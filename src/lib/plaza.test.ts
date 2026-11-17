import { describe, expect, it } from "vitest"

import {
  plazaSlipLabel,
  relativeTime,
  slipShareText,
  textLength,
} from "@/lib/plaza"

describe("plaza copy", () => {
  it("labels slip numbers and custom slips", () => {
    expect(plazaSlipLabel(3821)).toBe("第3821签")
    expect(plazaSlipLabel(0)).toBe("自拟签")
  })

  it("speaks recent time in Chinese", () => {
    const now = Date.parse("2026-11-17T12:00:00.000Z")
    expect(relativeTime("2026-11-17T11:59:30.000Z", now)).toBe("刚刚")
    expect(relativeTime("2026-11-17T11:40:00.000Z", now)).toBe("20 分钟前")
    expect(relativeTime("2026-11-17T09:00:00.000Z", now)).toBe("3 小时前")
    expect(relativeTime("2026-11-16T12:00:00.000Z", now)).toBe("昨天")
    expect(relativeTime("2026-11-10T12:00:00.000Z", now)).toBe("7 天前")
  })

  it("keeps a shareable slip within the plaza limit", () => {
    const text = slipShareText({
      verse: "风",
      title: "开一扇窗",
      description: "事".repeat(600),
    })
    expect(text.startsWith("风\n开一扇窗\n")).toBe(true)
    expect(textLength(text)).toBeLessThanOrEqual(500)
  })
})
