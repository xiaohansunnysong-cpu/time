import { createHash, randomUUID } from "node:crypto"
import http from "node:http"

import {
  allowedOrigin,
  normalizeClientId,
  normalizeNickname,
  normalizeSlipNumber,
  normalizeSlipText,
  normalizeStory,
  normalizeWishText,
} from "./validate.js"

const POST_LIMIT = 5

const STARTER_WISHES = [
  "愿有缘人今天买一束花送给自己，并拍下最喜欢的一枝。",
  "愿有缘人坐一趟没坐过的公交，两三站后下来走走，再按熟悉路线回家。",
  "愿有缘人给亲近的人做一顿简单的饭，一起好好吃完。",
  "愿有缘人去看一幅曾经路过的名画，认真找出一个小细节。",
  "愿有缘人尝一杯从没点过的饮品，给第一口起个名字。",
  "愿有缘人给一个月后的自己写张便条，留一句鼓励。",
  "愿有缘人闭眼听歌单里的第二首歌，记下歌带来的第一个画面。",
  "愿有缘人走一条没走过的回家路，找三样平时没注意的东西。",
  "愿有缘人认真夸自己一件具体的小事，不敷衍。",
  "愿有缘人给一段日常风景拍张电影海报感的照片，再取个片名。",
]

const STARTER_COMMUNITY_SLIPS = [
  "模仿电视剧里刚听到惊天秘密的人，沉默三秒后说：‘原来如此。’",
  "模仿电影主角慢动作进场，走五步就够。",
  "模仿刚拿到大奖的人，发表一段10秒获奖感言。",
  "模仿努力保持礼貌、但已经快迟到的人。",
  "模仿看到冰箱空了，却还不肯放弃希望的人。",
  "模仿第一次喝到特别酸的饮料，还要假装很好喝。",
  "用严肃新闻主播的语气播报：‘我刚刚找到遥控器。’",
  "模仿宫廷剧里受了委屈、但努力端庄的人。",
  "模仿侦探发现关键线索：‘这件事，果然没那么简单。’",
  "模仿电影反派，宣布自己要去洗碗。",
  "模仿体育解说员，解说自己成功坐下休息。",
  "模仿刚发现手机只剩1%电量的人。",
  "模仿销售员，认真推销世界上最普通的杯子。",
  "模仿机器人第一次学会说：‘我饿了。’",
  "模仿刚睡醒、还没完全加载完成的人。",
  "模仿看到熟人却一时想不起名字，努力自然打招呼的人。",
  "模仿正在等外卖、每隔一分钟看一次门口的人。",
  "模仿天气预报员，预报自己今天的心情。",
  "模仿发现最后一块蛋糕还在的人。",
  "模仿广告演员，介绍一双普通袜子。",
  "模仿刚听到‘今天不用加班’的人。",
  "模仿老板宣布：‘今天的会议缩短到一分钟。’",
  "模仿第一次走进高级餐厅、努力装作很熟悉的人。",
  "模仿刚收到中奖消息、努力保持冷静的人。",
  "用古装侠客的语气，告别家里的拖鞋，准备出门远行。",
  "模仿电影主角发现忘带钥匙，站在门口思考人生。",
  "模仿正在和闹钟谈判的人：‘再给我五分钟。’",
  "模仿主播，介绍一张椅子为什么值得买。",
  "模仿一个第一次学会打喷嚏的人。",
  "模仿偷偷吃零食、突然听到脚步声的人。",
  "模仿咖啡师，认真介绍一杯白开水。",
  "模仿悬疑片主角，发现桌上的东西被人移动了一厘米。",
  "模仿刚发现周末已经结束的人。",
  "模仿努力记住‘我进房间是来干什么的’的人。",
  "模仿主持人，隆重介绍今天的主角——你自己。",
  "模仿一只第一次看见吸尘器的猫。",
  "模仿准备拍证件照、却不知道该怎么笑的人。",
  "模仿电影英雄，拯救一只快掉到地上的袜子。",
  "模仿刚听到‘今晚吃你最爱吃的菜’的人。",
  "模仿正在给植物做工作汇报的人。",
  "模仿认真解释‘我真的只看了五分钟手机’的人。",
  "用贵族语气，模仿第一次尝试吃方便面的人。",
  "模仿正在为迟到找理由、却越说越心虚的人。",
  "模仿电影配音员，给自己走路的画面配旁白。",
  "模仿侦探，寻找刚刚放下的眼镜。",
  "模仿运动员，完成把垃圾扔进垃圾桶后的胜利庆祝。",
  "模仿收到朋友消息、想秒回又故意等一会儿的人。",
  "模仿深夜突然想起明天有事的人。",
  "模仿你喜欢的电影角色说一句经典台词，再用同样语气说：‘我先去倒杯水。’",
]

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
  await pool.query("CREATE TABLE IF NOT EXISTS wishes (id UUID PRIMARY KEY, wish_text TEXT NOT NULL, client_id TEXT NOT NULL, claimant_id TEXT, status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'fulfilled')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), fulfilled_at TIMESTAMPTZ)")
  await pool.query("ALTER TABLE wishes ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'community'")
  for (const [index, wishText] of STARTER_WISHES.entries()) {
    const seedId = `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`
    await pool.query(
      "INSERT INTO wishes (id, wish_text, client_id, source) SELECT $1, $2, $3, 'starter' WHERE NOT EXISTS (SELECT 1 FROM wishes WHERE wish_text = $2) ON CONFLICT (id) DO NOTHING",
      [seedId, wishText, "ffffffff-ffff-4fff-8fff-ffffffffffff"],
    )
  }
  await pool.query("CREATE INDEX IF NOT EXISTS wishes_feed_idx ON wishes (created_at DESC)")
  await pool.query("CREATE TABLE IF NOT EXISTS community_slips (id UUID PRIMARY KEY, task_text TEXT NOT NULL, creator_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), draw_count INTEGER NOT NULL DEFAULT 0, completed_count INTEGER NOT NULL DEFAULT 0, hidden BOOLEAN NOT NULL DEFAULT FALSE)")
  await pool.query("CREATE TABLE IF NOT EXISTS community_slip_draws (slip_id UUID NOT NULL REFERENCES community_slips(id) ON DELETE CASCADE, client_id TEXT NOT NULL, drawn_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ, PRIMARY KEY (slip_id, client_id))")
  await pool.query("CREATE INDEX IF NOT EXISTS community_slips_feed_idx ON community_slips (created_at DESC)")
  for (const [index, taskText] of STARTER_COMMUNITY_SLIPS.entries()) {
    const seedId = `00000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`
    await pool.query(
      "INSERT INTO community_slips (id, task_text, creator_id) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM community_slips WHERE task_text = $2) ON CONFLICT (id) DO NOTHING",
      [seedId, taskText, "ffffffff-ffff-4fff-8fff-ffffffffffff"],
    )
  }
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
          "SELECT id, wish_text, status, source, created_at, (claimant_id = $1 AND $1 <> '') AS claimed_by_me FROM wishes WHERE status <> 'fulfilled' OR created_at > now() - interval '14 days' ORDER BY (status = 'fulfilled') ASC, created_at DESC LIMIT 50",
          [visitor.text],
        )
        json(res, 200, { wishes: result.rows.map((row) => ({ id: row.id, text: row.wish_text, status: row.status, source: row.source, createdAt: new Date(row.created_at).toISOString(), claimedByMe: row.claimed_by_me === true })) }, origin)
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
      const wishParts = url.pathname.split("/")
      const wishAction = wishParts.length === 5 && wishParts[1] === "api" && wishParts[2] === "wishes" && /^[0-9a-f-]{36}$/i.test(wishParts[3]) && ["claim", "fulfill"].includes(wishParts[4]) ? [null, wishParts[3], wishParts[4]] : null
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
      if (req.method === "GET" && url.pathname === "/api/community-slips") {
        const result = await pool.query(
          "SELECT id, task_text, created_at, draw_count, completed_count FROM community_slips WHERE hidden = FALSE ORDER BY created_at DESC LIMIT 30",
        )
        json(res, 200, { slips: result.rows.map((row) => ({ id: row.id, text: row.task_text, createdAt: new Date(row.created_at).toISOString(), drawCount: row.draw_count, completedCount: row.completed_count })) }, origin)
        return
      }
      if (req.method === "POST" && url.pathname === "/api/community-slips") {
        const body = await readBody(req)
        const task = normalizeWishText(body.text)
        const visitor = normalizeClientId(body.clientId)
        const invalid = [task, visitor].find((item) => item.error)
        if (invalid) { json(res, 400, { error: invalid.error }, origin); return }
        const quota = await pool.query("SELECT count(*)::int AS count FROM community_slips WHERE creator_id = $1 AND created_at > now() - interval '1 day'", [visitor.text])
        if (quota.rows[0].count >= 3) { json(res, 429, { error: "今天写签的次数用完了，明天再来" }, origin); return }
        const inserted = await pool.query(
          "INSERT INTO community_slips (id, task_text, creator_id) VALUES ($1, $2, $3) RETURNING id, task_text, created_at, draw_count, completed_count",
          [randomUUID(), task.text, visitor.text],
        )
        const row = inserted.rows[0]
        json(res, 201, { slip: { id: row.id, text: row.task_text, createdAt: new Date(row.created_at).toISOString(), drawCount: row.draw_count, completedCount: row.completed_count } }, origin)
        return
      }
      if (req.method === "POST" && url.pathname === "/api/community-slips/draw") {
        const body = await readBody(req)
        const visitor = normalizeClientId(body.clientId)
        if (visitor.error) { json(res, 400, { error: visitor.error }, origin); return }
        const client = await pool.connect()
        try {
          await client.query("BEGIN")
          const selected = await client.query(
            "SELECT s.id, s.task_text, s.created_at FROM community_slips s WHERE s.hidden = FALSE AND s.creator_id <> $1 AND NOT EXISTS (SELECT 1 FROM community_slip_draws d WHERE d.slip_id = s.id AND d.client_id = $1) ORDER BY RANDOM() LIMIT 1",
            [visitor.text],
          )
          if (!selected.rowCount) {
            await client.query("ROLLBACK")
            json(res, 404, { error: "签筒里暂时还没有可抽的小事" }, origin)
            return
          }
          const row = selected.rows[0]
          await client.query("INSERT INTO community_slip_draws (slip_id, client_id) VALUES ($1, $2)", [row.id, visitor.text])
          const updated = await client.query(
            "UPDATE community_slips SET draw_count = draw_count + 1 WHERE id = $1 RETURNING draw_count, completed_count",
            [row.id],
          )
          await client.query("COMMIT")
          json(res, 200, { slip: { id: row.id, text: row.task_text, createdAt: new Date(row.created_at).toISOString(), drawCount: updated.rows[0].draw_count, completedCount: updated.rows[0].completed_count } }, origin)
        } catch (error) {
          await client.query("ROLLBACK")
          throw error
        } finally {
          client.release()
        }
        return
      }
      const communityParts = url.pathname.split("/")
      const communityId = communityParts[1] === "api" && communityParts[2] === "community-slips" && communityParts[4] === "complete" && /^[0-9a-f-]{36}$/i.test(communityParts[3] || "") ? communityParts[3] : null
      if (req.method === "POST" && communityId && communityParts.length === 5) {
        const body = await readBody(req)
        const visitor = normalizeClientId(body.clientId)
        if (visitor.error) { json(res, 400, { error: visitor.error }, origin); return }
        const client = await pool.connect()
        try {
          await client.query("BEGIN")
          const completed = await client.query(
            "UPDATE community_slip_draws SET completed_at = now() WHERE slip_id = $1 AND client_id = $2 AND completed_at IS NULL RETURNING slip_id",
            [communityId, visitor.text],
          )
          if (!completed.rowCount) {
            await client.query("ROLLBACK")
            json(res, 409, { error: "先抽到这支签，完成后才能打卡" }, origin)
            return
          }
          const updated = await client.query(
            "UPDATE community_slips SET completed_count = completed_count + 1 WHERE id = $1 RETURNING completed_count",
            [communityId],
          )
          await client.query("COMMIT")
          json(res, 200, { completedCount: updated.rows[0].completed_count }, origin)
        } catch (error) {
          await client.query("ROLLBACK")
          throw error
        } finally {
          client.release()
        }
        return
      }

      json(res, 404, { error: "没有这条路" }, origin)
    } catch (error) {
      const status = error.status || 503
      json(res, status, { error: error.status ? error.message : "香火暂时没有点着" }, origin)
    }
  })
}
