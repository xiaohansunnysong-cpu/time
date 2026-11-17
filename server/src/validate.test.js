import assert from "node:assert/strict"
import test from "node:test"

import {
  allowedOrigin,
  normalizeClientId,
  normalizeNickname,
  normalizeSlipNumber,
  normalizeStory,
} from "./validate.js"

test("nickname trims and rejects links or abuse", () => {
  assert.equal(normalizeNickname("  路过的云  ").text, "路过的云")
  assert.equal(normalizeNickname("   ").error, "还空着")
  assert.equal(normalizeNickname("https://example.com").error, "不能带链接")
  assert.equal(normalizeNickname("去 example.com 看").error, "不能带链接")
  assert.equal(normalizeNickname("你这个傻逼").error, "这句话不适合挂出来")
  assert.equal(normalizeNickname("一二三四五六七八九十一二三四五六七").error, "太长了")
})

test("story stays within 200 characters", () => {
  assert.equal(normalizeStory("做了。").text, "做了。")
  assert.equal(normalizeStory("").error, "还空着")
  assert.equal(normalizeStory("好".repeat(201)).error, "太长了")
})

test("client id must be a uuid and slip numbers stay in range", () => {
  assert.equal(
    normalizeClientId("11111111-1111-4111-8111-111111111111").text,
    "11111111-1111-4111-8111-111111111111",
  )
  assert.ok(normalizeClientId("nope").error)
  assert.equal(normalizeSlipNumber(0).number, 0)
  assert.equal(normalizeSlipNumber(10000).number, 10000)
  assert.ok(normalizeSlipNumber(-1).error)
  assert.ok(normalizeSlipNumber(1.5).error)
})

test("cors allows the static site and localhost only", () => {
  assert.equal(allowedOrigin(undefined), true)
  assert.equal(allowedOrigin("https://shijian-manghe.onrender.com"), true)
  assert.equal(allowedOrigin("http://localhost:4317"), true)
  assert.equal(allowedOrigin("http://127.0.0.1:8787"), true)
  assert.equal(allowedOrigin("https://evil.example"), false)
})
