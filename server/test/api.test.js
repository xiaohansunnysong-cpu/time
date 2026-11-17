import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { createPool, ensureSchema } from "../src/db.js"
import { createApp } from "../src/http.js"

const databaseUrl = process.env.DATABASE_URL ?? ""
let local = false
try {
  const host = new URL(databaseUrl).hostname
  local = host === "localhost" || host === "127.0.0.1"
} catch {
  local = false
}

describe("plaza http", { skip: local ? false : "set DATABASE_URL to local postgres" }, () => {
  let pool
  let server
  let base

  before(async () => {
    pool = createPool(databaseUrl)
    await ensureSchema(pool)
    await pool.query("TRUNCATE posts CASCADE")
    server = createApp(pool)
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address()
    base = `http://127.0.0.1:${address.port}`
  })

  after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
  })

  function client(n) {
    return `22222222-2222-4222-8222-${String(n).padStart(12, "0")}`
  }

  async function postStory(n, story = `第 ${n} 则小事`) {
    const response = await fetch(`${base}/api/posts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:4317",
      },
      body: JSON.stringify({
        nickname: "小满",
        slipNumber: n,
        slipText: "把窗打开一会儿",
        story,
        clientId: client(n),
      }),
    })
    const body = await response.json()
    return { status: response.status, body, headers: response.headers }
  }

  it("answers health and allows the temple origin", async () => {
    const health = await fetch(`${base}/api/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { ok: true })

    const preflight = await fetch(`${base}/api/posts`, {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:4317",
        "access-control-request-method": "POST",
      },
    })
    assert.equal(preflight.status, 204)
    assert.equal(
      preflight.headers.get("access-control-allow-origin"),
      "http://localhost:4317"
    )

    const blocked = await fetch(`${base}/api/posts`, {
      method: "OPTIONS",
      headers: { origin: "https://evil.example" },
    })
    assert.equal(blocked.status, 403)
    assert.equal(blocked.headers.get("access-control-allow-origin"), null)

    const live = await fetch(`${base}/api/health`, {
      headers: { origin: "https://shijian-manghe.onrender.com" },
    })
    assert.equal(
      live.headers.get("access-control-allow-origin"),
      "https://shijian-manghe.onrender.com"
    )
  })

  it("creates, lists, likes, and hides reported posts", async () => {
    const created = await postStory(1, "我在门口站了一分钟。")
    assert.equal(created.status, 201)
    assert.equal(created.headers.get("access-control-allow-origin"), "http://127.0.0.1:4317")
    const id = created.body.post.id

    const page = await fetch(`${base}/api/posts?clientId=${client(1)}`)
    const listed = await page.json()
    assert.equal(listed.posts.length, 1)
    assert.equal(listed.posts[0].nickname, "小满")
    assert.equal(listed.posts[0].slipNumber, 1)
    assert.equal(listed.posts[0].slipText, "把窗打开一会儿")
    assert.equal(listed.posts[0].story, "我在门口站了一分钟。")
    assert.equal(typeof listed.posts[0].createdAt, "string")
    assert.equal(listed.posts[0].likeCount, 0)
    assert.equal(listed.posts[0].liked, false)
    assert.equal(listed.nextCursor, null)

    const liked = await fetch(`${base}/api/posts/${id}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: client(1) }),
    })
    assert.deepEqual(await liked.json(), { id, liked: true, likeCount: 1 })

    const again = await fetch(`${base}/api/posts/${id}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: client(1) }),
    })
    assert.deepEqual(await again.json(), { id, liked: false, likeCount: 0 })

    await fetch(`${base}/api/posts/${id}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: client(1) }),
    })

    for (const [index, n] of [2, 3, 4].entries()) {
      const report = await fetch(`${base}/api/posts/${id}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId: client(n) }),
      })
      const body = await report.json()
      assert.equal(body.ok, true)
      assert.equal(body.hidden, index === 2)
    }

    const afterHide = await fetch(`${base}/api/posts`)
    const hidden = await afterHide.json()
    assert.equal(hidden.posts.length, 0)
  })

  it("rate limits a client and paginates newest first", async () => {
    await pool.query("TRUNCATE posts CASCADE")
    const same = client(9)
    for (let n = 0; n < 5; n += 1) {
      const response = await fetch(`${base}/api/posts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nickname: "小满",
          slipNumber: n + 1,
          slipText: "签文",
          story: `故事 ${n}`,
          clientId: same,
        }),
      })
      assert.equal(response.status, 201)
    }
    const limited = await fetch(`${base}/api/posts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nickname: "小满",
        slipNumber: 6,
        slipText: "签文",
        story: "第六则",
        clientId: same,
      }),
    })
    assert.equal(limited.status, 429)

    await pool.query("TRUNCATE posts CASCADE")
    for (let n = 0; n < 25; n += 1) {
      await pool.query(
        `INSERT INTO posts (id, nickname, slip_number, slip_text, story, client_id, ip_hash, created_at)
         VALUES ($1::uuid, '路人', $2, '签文', $3, $4, 'hash', $5::timestamptz)`,
        [
          client(100 + n),
          n + 1,
          `故事 ${n}`,
          client(100 + n),
          new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
        ]
      )
    }
    const first = await fetch(`${base}/api/posts`)
    const firstBody = await first.json()
    assert.equal(firstBody.posts.length, 20)
    assert.equal(firstBody.posts[0].story, "故事 24")
    assert.ok(firstBody.nextCursor)
    const second = await fetch(
      `${base}/api/posts?cursor=${encodeURIComponent(firstBody.nextCursor)}`
    )
    const secondBody = await second.json()
    assert.equal(secondBody.posts.length, 5)
    assert.equal(secondBody.posts[0].story, "故事 4")
    assert.equal(secondBody.nextCursor, null)
    const seen = new Set([
      ...firstBody.posts.map((post) => post.id),
      ...secondBody.posts.map((post) => post.id),
    ])
    assert.equal(seen.size, 25)
  })
})
