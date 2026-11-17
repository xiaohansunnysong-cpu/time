import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { sslFor } from "../src/db.js"
import {
  hasLink,
  hasProfanity,
  validatePostInput,
} from "../src/validate.js"

const clientId = "11111111-1111-4111-8111-111111111111"

function body(patch = {}) {
  return {
    nickname: "小满",
    slipNumber: 12,
    slipText: "把窗打开一会儿",
    story: "风进来了，我站了一分钟。",
    clientId,
    ...patch,
  }
}

describe("validatePostInput", () => {
  it("accepts a short temple story", () => {
    const result = validatePostInput(body())
    assert.equal(result.ok, true)
    assert.equal(result.value.nickname, "小满")
    assert.equal(result.value.clientId, clientId)
  })

  it("trims and rejects links and profanity", () => {
    const trimmed = validatePostInput(body({ nickname: "  小满  " }))
    assert.equal(trimmed.ok, true)
    assert.equal(trimmed.value.nickname, "小满")
    const punctuated = validatePostInput(body({ story: "我把窗打开，站了一分钟。" }))
    assert.equal(punctuated.ok, true)
    assert.equal(punctuated.value.story, "我把窗打开，站了一分钟。")

    const link = validatePostInput(body({ story: "看看 https://example.com" }))
    assert.equal(link.ok, false)
    assert.equal(link.status, 400)

    const bare = validatePostInput(body({ story: "去 example.com 吧" }))
    assert.equal(bare.ok, false)

    const rude = validatePostInput(body({ story: "这太 shit 了" }))
    assert.equal(rude.ok, false)
  })

  it("enforces nickname and story lengths", () => {
    assert.equal(validatePostInput(body({ nickname: "" })).ok, false)
    assert.equal(validatePostInput(body({ nickname: "名".repeat(17) })).status, 400)
    assert.equal(validatePostInput(body({ story: "   " })).ok, false)
    assert.equal(validatePostInput(body({ story: "事".repeat(201) })).status, 400)
    assert.equal(validatePostInput(body({ slipNumber: 1.5 })).ok, false)
    assert.equal(validatePostInput(body({ clientId: "nope" })).ok, false)
  })
})

describe("filters", () => {
  it("catches links and skips ordinary sentences", () => {
    assert.equal(hasLink("今天没有出门"), false)
    assert.equal(hasLink("www.example.com"), true)
    assert.equal(hasProfanity("风很轻"), false)
    assert.equal(hasProfanity("f u c k"), true)
  })
})

describe("sslFor", () => {
  it("requires ssl for hosted postgres and skips it locally", () => {
    assert.deepEqual(
      sslFor("postgres://user:pass@ep-test.neon.tech/neondb?sslmode=require"),
      { rejectUnauthorized: false }
    )
    assert.equal(
      sslFor("postgres://tbb:tbb@127.0.0.1:5432/tbb"),
      false
    )
    assert.equal(
      sslFor("postgres://tbb:tbb@localhost:5432/tbb?sslmode=disable"),
      false
    )
  })
})
