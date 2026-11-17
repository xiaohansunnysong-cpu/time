import { createHash, randomUUID } from "node:crypto"
import { createServer } from "node:http"

import { LIMITS, parseClientId, validateClientBody, validatePostInput } from "./validate.js"

const STATIC_ORIGIN = "https://shijian-manghe.onrender.com"

export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== "string") return false
  if (origin === STATIC_ORIGIN) return true
  try {
    const url = new URL(origin)
    const host = url.hostname.replace(/^\[|\]$/g, "")
    const local = host === "localhost" || host === "127.0.0.1" || host === "::1"
    return local && (url.protocol === "http:" || url.protocol === "https:")
  } catch {
    return false
  }
}

function send(res, status, body, origin) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  }
  if (origin && isAllowedOrigin(origin)) {
    headers["access-control-allow-origin"] = origin
    headers.vary = "Origin"
    headers["access-control-allow-methods"] = "GET, POST, OPTIONS"
    headers["access-control-allow-headers"] = "Content-Type"
    headers["access-control-max-age"] = "86400"
  }
  res.writeHead(status, headers)
  if (status === 204) {
    res.end()
    return
  }
  res.end(JSON.stringify(body))
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim()
  }
  return req.socket.remoteAddress || "unknown"
}

function hashIp(ip) {
  return createHash("sha256").update(`tbb-plaza|${ip}`).digest("hex")
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let settled = false
    const fail = (status, error) => {
      if (settled) return
      settled = true
      reject(Object.assign(new Error(error), { status }))
    }
    req.on("data", (chunk) => {
      size += chunk.length
      if (size > 16_384) {
        fail(413, "内容太长了")
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => {
      if (settled) return
      settled = true
      if (size === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
      } catch {
        reject(Object.assign(new Error("内容读不懂"), { status: 400 }))
      }
    })
    req.on("error", () => fail(400, "内容读不懂"))
  })
}

function mapPost(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    slipNumber: row.slip_number,
    slipText: row.slip_text,
    story: row.story,
    createdAt: new Date(row.created_at).toISOString(),
    likeCount: Number(row.like_count ?? 0),
    liked: row.liked === true,
  }
}

function encodeCursor(row) {
  const stamp = new Date(row.created_at).toISOString()
  return Buffer.from(`${stamp}|${row.id}`).toString("base64url")
}

function decodeCursor(cursor) {
  if (!cursor) return null
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8")
    const splitAt = raw.lastIndexOf("|")
    if (splitAt <= 0) return null
    const stamp = raw.slice(0, splitAt)
    const id = raw.slice(splitAt + 1)
    if (!parseClientId(id) || Number.isNaN(Date.parse(stamp))) return null
    return { at: new Date(stamp).toISOString(), id }
  } catch {
    return null
  }
}

async function listPosts(pool, url) {
  const cursorRaw = url.searchParams.get("cursor")
  const cursor = cursorRaw ? decodeCursor(cursorRaw) : null
  if (cursorRaw && !cursor) {
    return { status: 400, body: { error: "翻页记号不对" } }
  }
  const clientId = parseClientId(url.searchParams.get("clientId") ?? "")
  const limit = LIMITS.pageSize + 1
  const result = await pool.query(
    `SELECT
       p.id,
       p.nickname,
       p.slip_number,
       p.slip_text,
       p.story,
       p.created_at,
       COUNT(l.post_id)::int AS like_count,
       COALESCE(BOOL_OR(l.client_id = $3), false) AS liked
     FROM posts p
     LEFT JOIN likes l ON l.post_id = p.id
     WHERE p.hidden = false
       AND (
         $1::timestamptz IS NULL
         OR (p.created_at, p.id) < ($1::timestamptz, $2::uuid)
       )
     GROUP BY p.id
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $4`,
    [cursor?.at ?? null, cursor?.id ?? null, clientId, limit]
  )
  const hasMore = result.rows.length > LIMITS.pageSize
  const rows = hasMore ? result.rows.slice(0, LIMITS.pageSize) : result.rows
  const last = rows[rows.length - 1]
  return {
    status: 200,
    body: {
      posts: rows.map(mapPost),
      nextCursor: hasMore && last ? encodeCursor(last) : null,
    },
  }
}

async function createPost(pool, body, ip) {
  const parsed = validatePostInput(body)
  if (!parsed.ok) return { status: parsed.status, body: { error: parsed.error } }
  const { clientId, nickname, story, slipText, slipNumber } = parsed.value
  const ipHash = hashIp(ip)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const locks = [`client:${clientId}`, `ip:${ipHash}`].sort()
    for (const key of locks) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key])
    }
    const counts = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM posts
           WHERE client_id = $1 AND created_at > NOW() - INTERVAL '1 day') AS by_client,
         (SELECT COUNT(*)::int FROM posts
           WHERE ip_hash = $2 AND created_at > NOW() - INTERVAL '1 day') AS by_ip`,
      [clientId, ipHash]
    )
    const byClient = counts.rows[0]?.by_client ?? 0
    const byIp = counts.rows[0]?.by_ip ?? 0
    if (byClient >= LIMITS.postsPerClient) {
      await client.query("ROLLBACK")
      return { status: 429, body: { error: "今天已经挂过五则了，明日再来" } }
    }
    if (byIp >= LIMITS.postsPerIp) {
      await client.query("ROLLBACK")
      return { status: 429, body: { error: "这个网络今天挂得有点多，明日再来" } }
    }
    const id = randomUUID()
    const inserted = await client.query(
      `INSERT INTO posts (id, nickname, slip_number, slip_text, story, client_id, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nickname, slip_number, slip_text, story, created_at`,
      [id, nickname, slipNumber, slipText, story, clientId, ipHash]
    )
    await client.query("COMMIT")
    return {
      status: 201,
      body: { post: mapPost({ ...inserted.rows[0], like_count: 0, liked: false }) },
    }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function toggleLike(pool, id, body) {
  if (!parseClientId(id)) return { status: 400, body: { error: "这则故事找不到" } }
  const parsed = validateClientBody(body)
  if (!parsed.ok) return { status: parsed.status, body: { error: parsed.error } }
  const result = await pool.query(
    `WITH target AS (
       SELECT id FROM posts WHERE id = $1::uuid
     ),
     deleted AS (
       DELETE FROM likes
       WHERE post_id = (SELECT id FROM target) AND client_id = $2
       RETURNING post_id
     ),
     inserted AS (
       INSERT INTO likes (post_id, client_id)
       SELECT id, $2 FROM target
       WHERE EXISTS (SELECT 1 FROM target)
         AND NOT EXISTS (SELECT 1 FROM deleted)
       RETURNING post_id
     ),
     before_count AS (
       SELECT COUNT(*)::int AS like_count
       FROM likes
       WHERE post_id = (SELECT id FROM target)
     )
     SELECT
       (SELECT id FROM target) AS id,
       EXISTS (SELECT 1 FROM inserted) AS liked,
       (
         SELECT like_count FROM before_count
       ) + (SELECT COUNT(*)::int FROM inserted) - (SELECT COUNT(*)::int FROM deleted) AS like_count`,
    [id, parsed.clientId]
  )
  const row = result.rows[0]
  if (!row?.id) return { status: 404, body: { error: "这则故事已经不在广场上" } }
  return {
    status: 200,
    body: {
      id: row.id,
      liked: row.liked === true,
      likeCount: Number(row.like_count ?? 0),
    },
  }
}

async function reportPost(pool, id, body) {
  if (!parseClientId(id)) return { status: 400, body: { error: "这则故事找不到" } }
  const parsed = validateClientBody(body)
  if (!parsed.ok) return { status: parsed.status, body: { error: parsed.error } }
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const found = await client.query(
      "SELECT id FROM posts WHERE id = $1::uuid FOR UPDATE",
      [id]
    )
    if (found.rowCount === 0) {
      await client.query("ROLLBACK")
      return { status: 404, body: { error: "这则故事已经不在广场上" } }
    }
    await client.query(
      `INSERT INTO reports (post_id, client_id)
       VALUES ($1::uuid, $2)
       ON CONFLICT DO NOTHING`,
      [id, parsed.clientId]
    )
    const count = await client.query(
      "SELECT COUNT(*)::int AS n FROM reports WHERE post_id = $1::uuid",
      [id]
    )
    const hidden = (count.rows[0]?.n ?? 0) >= LIMITS.reportHideAt
    if (hidden) {
      await client.query("UPDATE posts SET hidden = true WHERE id = $1::uuid", [id])
    }
    await client.query("COMMIT")
    return { status: 200, body: { ok: true, hidden } }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function health(pool) {
  await pool.query("SELECT 1")
  return { status: 200, body: { ok: true } }
}

export function createApp(pool) {
  return createServer(async (req, res) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : ""
    if (req.method === "OPTIONS") {
      if (!isAllowedOrigin(origin)) {
        send(res, 403, { error: "这个来处不让进广场" }, origin)
        return
      }
      send(res, 204, {}, origin)
      return
    }
    try {
      const url = new URL(req.url ?? "/", "http://localhost")
      const like = /^\/api\/posts\/([0-9a-f-]{36})\/like$/.exec(url.pathname)
      const report = /^\/api\/posts\/([0-9a-f-]{36})\/report$/.exec(url.pathname)
      let result
      if (req.method === "GET" && url.pathname === "/api/health") {
        result = await health(pool)
      } else if (req.method === "GET" && url.pathname === "/api/posts") {
        result = await listPosts(pool, url)
      } else if (req.method === "POST" && url.pathname === "/api/posts") {
        result = await createPost(pool, await readJson(req), clientIp(req))
      } else if (req.method === "POST" && like) {
        result = await toggleLike(pool, like[1], await readJson(req))
      } else if (req.method === "POST" && report) {
        result = await reportPost(pool, report[1], await readJson(req))
      } else {
        result = { status: 404, body: { error: "没有这条路" } }
      }
      send(res, result.status, result.body, origin)
    } catch (error) {
      const status = Number(error?.status) || 500
      if (status >= 500) console.error(error)
      if (!res.headersSent && !res.writableEnded) {
        send(
          res,
          status,
          { error: status === 500 ? "广场那边出了点状况" : error.message },
          origin
        )
      }
    }
  })
}
