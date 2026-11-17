import assert from "node:assert/strict"
import test from "node:test"

import { Pool } from "pg"

import { createApp, migrate, poolConfig } from "./app.js"

const databaseUrl = process.env.DATABASE_URL
const clientA = "11111111-1111-4111-8111-111111111111"
const clientB = "22222222-2222-4222-8222-222222222222"
const clientC = "33333333-3333-4333-8333-333333333333"
const clientD = "44444444-4444-4444-8444-444444444444"

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Origin: "http://127.0.0.1:4317",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers }
}

test("plaza api", { skip: databaseUrl ? false : "DATABASE_URL not set" }, async () => {
  const pool = new Pool(poolConfig(databaseUrl))
  await migrate(pool)
  await pool.query("DELETE FROM posts WHERE client_id = ANY($1::text[])", [
    [clientA, clientB, clientC, clientD],
  ])
  const server = createApp(pool)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  const base = `http://127.0.0.1:${address.port}`
  try {
    const health = await request(base, "/api/health")
    assert.equal(health.status, 200)
    assert.equal(health.body.ok, true)
    assert.equal(health.headers.get("access-control-allow-origin"), "http://127.0.0.1:4317")

    const blocked = await fetch(`${base}/api/health`, {
      headers: { Origin: "https://evil.example" },
    })
    assert.equal(blocked.status, 403)

    const created = await request(base, "/api/posts", {
      method: "POST",
      body: {
        nickname: " 路过的云 ",
        slipNumber: 8,
        slipText: "下一个看到的红色东西，决定今晚的一小口",
        story: "红色是一辆自行车，于是晚饭加了葱。",
        clientId: clientA,
      },
    })
    assert.equal(created.status, 201)
    assert.equal(created.body.nickname, "路过的云")
    assert.equal(created.body.likeCount, 0)

    const linked = await request(base, "/api/posts", {
      method: "POST",
      body: {
        nickname: "云",
        slipNumber: 1,
        slipText: "看这里 https://example.com",
        story: "不行",
        clientId: clientA,
      },
    })
    assert.equal(linked.status, 400)

    const page = await request(base, `/api/posts?clientId=${clientA}`)
    assert.equal(page.status, 200)
    assert.ok(page.body.posts.some((post) => post.id === created.body.id))
    const mine = page.body.posts.find((post) => post.id === created.body.id)
    assert.equal(mine.likedByMe, false)

    const liked = await request(base, `/api/posts/${created.body.id}/like`, {
      method: "POST",
      body: { clientId: clientB },
    })
    assert.equal(liked.body.likedByMe, true)
    assert.equal(liked.body.likeCount, 1)
    const unliked = await request(base, `/api/posts/${created.body.id}/like`, {
      method: "POST",
      body: { clientId: clientB },
    })
    assert.equal(unliked.body.likedByMe, false)
    assert.equal(unliked.body.likeCount, 0)

    for (const clientId of [clientB, clientC, clientD]) {
      const report = await request(base, `/api/posts/${created.body.id}/report`, {
        method: "POST",
        body: { clientId },
      })
      assert.equal(report.status, 200)
    }
    const hidden = await request(base, `/api/posts?clientId=${clientA}`)
    assert.equal(
      hidden.body.posts.some((post) => post.id === created.body.id),
      false,
    )

    await pool.query("DELETE FROM posts WHERE client_id = $1", [clientA])
    for (let index = 0; index < 5; index += 1) {
      const ok = await request(base, "/api/posts", {
        method: "POST",
        body: {
          nickname: "限额",
          slipNumber: index + 1,
          slipText: `第 ${index} 支试签`,
          story: `这是第 ${index} 则试故事`,
          clientId: clientA,
        },
      })
      assert.equal(ok.status, 201)
    }
    const limited = await request(base, "/api/posts", {
      method: "POST",
      body: {
        nickname: "限额",
        slipNumber: 9,
        slipText: "再来一支",
        story: "不该挂上",
        clientId: clientA,
      },
    })
    assert.equal(limited.status, 429)
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await pool.query("DELETE FROM posts WHERE client_id = ANY($1::text[])", [
      [clientA, clientB, clientC, clientD],
    ])
    await pool.end()
  }
})
