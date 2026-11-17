import { createHash, randomUUID } from "node:crypto"
import http from "node:http"

import {
  allowedOrigin,
  normalizeClientId,
  normalizeNickname,
  normalizeSlipNumber,
  normalizeSlipText,
  normalizeStory,
} from "./validate.js"

const POST_LIMIT = 5

export function poolConfig(connectionString) {
  const local = /localhost|127\.0\.0\.1/.test(connectionString)
  return {
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10_000,
    ssl: local ? undefined : { rejectUnauthorized: false },
  }
}

export async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY,
      nickname TEXT NOT NULL,
      slip_number INTEGER NOT NULL,
      slip_text TEXT NOT NULL,
      story TEXT NOT NULL,
      client_id TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      like_count INTEGER NOT NULL DEFAULT 0,
      report_count INTEGER NOT NULL DEFAULT 0,
      hidden BOOLEAN NOT NULL DEFAULT FALSE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (post_id, client_id)
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_reports (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (post_id, client_id)
    )
  `)
  await pool.query(
    "CREATE INDEX IF NOT EXISTS posts_feed_idx ON posts (created_at DESC, id DESC)",
  )
  await pool.query(
    "CREATE INDEX IF NOT EXISTS posts_client_day_idx ON posts (client_id, created_at)",
  )
  await pool.query(
    "CREATE INDEX IF NOT EXISTS posts_ip_day_idx ON posts (ip_hash, created_at)",
  )
}

function json(res, status, body, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8" }
  if (origin && allowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
    headers.Vary = "Origin"
  }
  res.writeHead(status, headers)
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
  return createHash("sha256").update(ip).digest("hex")
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on("data", (chunk) => {
      size += chunk.length
      if (size > 16_000) {
        reject(Object.assign(new Error("太大了"), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
      } catch {
        reject(Object.assign(new Error("格式不对"), { status: 400 }))
      }
    })
    req.on("error", reject)
  })
}

function encodeCursor(createdAt, id) {
  return Buffer.from(`${new Date(createdAt).toISOString()}|${id}`).toString("base64url")
}

function decodeCursor(cursor) {
  if (!cursor) return { createdAt: null, id: null }
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8")
    const split = raw.indexOf("|")
    if (split <= 0) return null
    const createdAt = new Date(raw.slice(0, split))
    const id = raw.slice(split + 1)
    if (Number.isNaN(createdAt.getTime())) return null
    if (normalizeClientId(id).error && !/^[0-9a-f-]{36}$/i.test(id)) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

function present(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    slipNumber: row.slip_number,
    slipText: row.slip_text,
    story: row.story,
    createdAt: new Date(row.created_at).toISOString(),
    likeCount: row.like_count,
    likedByMe: row.liked_by_me === true,
  }
}

async function listPosts(pool, url) {
  const decoded = decodeCursor(url.searchParams.get("cursor"))
  if (decoded === null) return { status: 400, body: { error: "翻页记号不对" } }
  const clientRaw = url.searchParams.get("clientId")
  let clientId = ""
  if (clientRaw) {
    const parsed = normalizeClientId(clientRaw)
    if (parsed.error) return { status: 400, body: { error: parsed.error } }
    clientId = parsed.text
  }
  const result = await pool.query(
    `SELECT p.id, p.nickname, p.slip_number, p.slip_text, p.story, p.created_at, p.like_count,
            EXISTS (
              SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.client_id = $3
            ) AS liked_by_me
     FROM posts p
     WHERE p.hidden = FALSE
       AND ($1::timestamptz IS NULL OR (p.created_at, p.id) < ($1::timestamptz, $2::uuid))
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT 21`,
    [decoded.createdAt, decoded.id, clientId],
  )
  const hasMore = result.rows.length > 20
  const page = hasMore ? result.rows.slice(0, 20) : result.rows
  const last = page.at(-1)
  return {
    status: 200,
    body: {
      posts: page.map(present),
      nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
    },
  }
}

async function createPost(pool, body, ipHash) {
  const nickname = normalizeNickname(body.nickname)
  const story = normalizeStory(body.story)
  const slipText = normalizeSlipText(body.slipText)
  const slipNumber = normalizeSlipNumber(body.slipNumber)
  const clientId = normalizeClientId(body.clientId)
  const invalid = [nickname, story, slipText, slipNumber, clientId].find((item) => item.error)
  if (invalid) return { status: 400, body: { error: invalid.error } }

  const quota = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM posts WHERE client_id = $1 AND created_at > now() - interval '1 day') AS by_client,
       (SELECT count(*)::int FROM posts WHERE ip_hash = $2 AND created_at > now() - interval '1 day') AS by_ip`,
    [clientId.text, ipHash],
  )
  const row = quota.rows[0]
  if (row.by_client >= POST_LIMIT || row.by_ip >= POST_LIMIT) {
    return { status: 429, body: { error: "今天的广场已经挂得够多了，明天再来" } }
  }

  const inserted = await pool.query(
    `INSERT INTO posts (id, nickname, slip_number, slip_text, story, client_id, ip_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nickname, slip_number, slip_text, story, created_at, like_count, FALSE AS liked_by_me`,
    [randomUUID(), nickname.text, slipNumber.number, slipText.text, story.text, clientId.text, ipHash],
  )
  return { status: 201, body: present(inserted.rows[0]) }
}

async function toggleLike(pool, id, body) {
  const clientId = normalizeClientId(body.clientId)
  if (clientId.error) return { status: 400, body: { error: clientId.error } }
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const found = await client.query("SELECT hidden FROM posts WHERE id = $1", [id])
    if (found.rowCount === 0 || found.rows[0].hidden) {
      await client.query("ROLLBACK")
      return { status: 404, body: { error: "这张牌子不在了" } }
    }
    const removed = await client.query(
      "DELETE FROM post_likes WHERE post_id = $1 AND client_id = $2",
      [id, clientId.text],
    )
    const liked = removed.rowCount === 0
    if (liked) {
      await client.query("INSERT INTO post_likes (post_id, client_id) VALUES ($1, $2)", [
        id,
        clientId.text,
      ])
      await client.query("UPDATE posts SET like_count = like_count + 1 WHERE id = $1", [id])
    } else {
      await client.query(
        "UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1",
        [id],
      )
    }
    const updated = await client.query("SELECT like_count FROM posts WHERE id = $1", [id])
    await client.query("COMMIT")
    return {
      status: 200,
      body: { likeCount: updated.rows[0].like_count, likedByMe: liked },
    }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function reportPost(pool, id, body) {
  const clientId = normalizeClientId(body.clientId)
  if (clientId.error) return { status: 400, body: { error: clientId.error } }
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const found = await client.query("SELECT hidden FROM posts WHERE id = $1", [id])
    if (found.rowCount === 0) {
      await client.query("ROLLBACK")
      return { status: 404, body: { error: "这张牌子不在了" } }
    }
    const inserted = await client.query(
      "INSERT INTO post_reports (post_id, client_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [id, clientId.text],
    )
    let hidden = found.rows[0].hidden
    if (inserted.rowCount > 0) {
      const updated = await client.query(
        `UPDATE posts
         SET report_count = report_count + 1,
             hidden = hidden OR (report_count + 1) >= 3
         WHERE id = $1
         RETURNING hidden`,
        [id],
      )
      hidden = updated.rows[0].hidden
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

export function createApp(pool) {
  return http.createServer(async (req, res) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : ""
    if (origin && !allowedOrigin(origin)) {
      json(res, 403, { error: "这个来处不能挂牌子" }, "")
      return
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      })
      res.end()
      return
    }

    const url = new URL(req.url || "/", "http://localhost")
    try {
      if (req.method === "GET" && url.pathname === "/api/health") {
        json(res, 200, { ok: true }, origin)
        return
      }
      if (req.method === "GET" && url.pathname === "/api/posts") {
        const result = await listPosts(pool, url)
        json(res, result.status, result.body, origin)
        return
      }
      const like = /^\/api\/posts\/([0-9a-f-]{36})\/like$/.exec(url.pathname)
      const report = /^\/api\/posts\/([0-9a-f-]{36})\/report$/.exec(url.pathname)
      if (req.method === "POST" && url.pathname === "/api/posts") {
        const body = await readBody(req)
        const result = await createPost(pool, body, hashIp(clientIp(req)))
        json(res, result.status, result.body, origin)
        return
      }
      if (req.method === "POST" && like) {
        const body = await readBody(req)
        const result = await toggleLike(pool, like[1], body)
        json(res, result.status, result.body, origin)
        return
      }
      if (req.method === "POST" && report) {
        const body = await readBody(req)
        const result = await reportPost(pool, report[1], body)
        json(res, result.status, result.body, origin)
        return
      }

      if (req.method === "GET" && url.pathname === "/api/wishes") {
        const raw = url.searchParams.get("clientId") || ""
        const visitor = raw ? normalizeClientId(raw) : { text: "" }
        if (visitor.error) { json(res, 400, { error: visitor.error }, origin); return }
        const result = await pool.query(
          "SELECT id, wish_text, status, created_at, (claimant_id = $1 AND $1 <> '') AS claimed_by_me FROM wishes WHERE status <> 'fulfilled' OR created_at > now() - interval '14 days' ORDER BY (status = 'fulfilled') ASC, created_at DESC LIMIT 50",
          [visitor.text],
        )
        json(res, 200, { wishes: result.rows.map((row) => ({ id: row.id, text: row.wish_text, status: row.status, createdAt: new Date(row.created_at).toISOString(), claimedByMe: row.claimed_by_me === true })) }, origin)
        return
      }
      if (req.method === "POST" && url.pathname === "/api/wishes") {
        const body = await readBody(req)
        const wish = normalizeWishText(body.text)
        const visitor = normalizeClientId(body.clientId)
        const invalid = [wish, visitor].find((item) => item.error)
        if (invalid) { json(res, 400, { error: invalid.error }, origin); return }
        const quota = await pool.query("SELECT count(*)::int AS count FROM wishes WHERE client_id = $1 AND created_at > now() - interval '1 day'", [visitor.text])
        if (quota.rows[0].count >= 5) { json(res, 429, { error: "今天挂愿的次数用完了，明天再来" }, origin); return }
        const inserted = await pool.query("INSERT INTO wishes (id, wish_text, client_id) VALUES ($1, $2, $3) RETURNING id, wish_text, status, created_at", [randomUUID(), wish.text, visitor.text])
        const row = inserted.rows[0]
        json(res, 201, { id: row.id, text: row.wish_text, status: row.status, createdAt: new Date(row.created_at).toISOString(), claimedByMe: false }, origin)
        return
      }
      const wishAction = /^\\/api\\/wishes\\/([0-9a-f-]{36})\\/(claim|fulfill)$/.exec(url.pathname)
      if (req.method === "POST" && wishAction) {
        const body = await readBody(req)
        const visitor = normalizeClientId(body.clientId)
        if (visitor.error) { json(res, 400, { error: visitor.error }, origin); return }
        const result = wishAction[2] === "claim"
          ? await pool.query("UPDATE wishes SET status = 'claimed', claimant_id = $2 WHERE id = $1 AND status = 'open' AND client_id <> $2 RETURNING id", [wishAction[1], visitor.text])
          : await pool.query("UPDATE wishes SET status = 'fulfilled', fulfilled_at = now() WHERE id = $1 AND status = 'claimed' AND claimant_id = $2 RETURNING id", [wishAction[1], visitor.text])
        if (!result.rowCount) { json(res, 409, { error: "这份心愿刚刚有变化，刷新看看" }, origin); return }
        json(res, 200, { ok: true }, origin)
        return
      }
      json(res, 404, { error: "没有这条路" }, origin)
    } catch (error) {
      const status = error.status || 503
      json(res, status, { error: error.status ? error.message : "香火暂时没有点着" }, origin)
    }
  })
}
