import { describe, expect, it } from "vitest"

import { canDraw, emptyDay, phaseOf, pickSurpriseTime, rescheduleSurprise } from "@/lib/draw"
import {
  formatCountdown,
  localDateKey,
  msUntilLocalMidnight,
  slipLabel,
  toChineseNumber,
  windowIsValid,
} from "@/lib/format"
import { createSeen, pickSlipNumber, seenCount, seenHas } from "@/lib/slip-pick"
import type { DayState, Settings, Story } from "@/lib/types"
import { DAILY_DRAW_LIMIT } from "@/lib/types"

describe("slip rotation", () => {
  it("does not repeat until the tube has been emptied", () => {
    const seen = createSeen(20)
    const drawn: number[] = []
    let cursor = 0
    const random = () => {
      cursor += 1
      return (cursor % 7) / 7
    }
    for (let index = 0; index < 20; index += 1) {
      drawn.push(pickSlipNumber(seen, 20, [], random))
    }
    expect(new Set(drawn).size).toBe(20)
    expect(seenCount(seen, 20)).toBe(20)
    const again = pickSlipNumber(seen, 20, [], () => 0)
    expect(again).toBeGreaterThan(0)
    expect(seenHas(seen, again)).toBe(true)
    expect(seenCount(seen, 20)).toBe(1)
  })

  it("skips slips already drawn today even after a reset", () => {
    const seen = createSeen(5)
    for (let n = 1; n <= 5; n += 1) pickSlipNumber(seen, 5, [], () => 0)
    const next = pickSlipNumber(seen, 5, [1], () => 0)
    expect(next).not.toBe(1)
  })
})

describe("daily limit", () => {
  const base = emptyDay("2026-11-17")

  it("allows three draws and then closes the tube", () => {
    expect(canDraw(base)).toBe(true)
    const full: DayState = {
      ...base,
      draws: [1, 2, 3].map((n) => ({
        id: `d${n}`,
        at: n,
        slip: {
          challengeId: `c${n}`,
          number: n,
          rank: "上签",
          verse: "v",
          title: "t",
          description: "d",
          duration: 15,
          category: "slow",
        },
      })),
    }
    expect(full.draws).toHaveLength(DAILY_DRAW_LIMIT)
    expect(canDraw(full)).toBe(false)
  })

  it("keeps the last slip open until it is logged", () => {
    const day: DayState = {
      ...base,
      draws: [
        {
          id: "d1",
          at: 1,
          slip: {
            challengeId: "c1",
            number: 17,
            rank: "上上签",
            verse: "巷口的风",
            title: "换一条路",
            description: "走一走",
            duration: 15,
            category: "city",
          },
        },
      ],
      acceptedDrawId: "d1",
    }
    Object.assign(day, {
      draws: [day.draws[0], day.draws[0], day.draws[0]].map((draw, index) => ({
        ...draw!,
        id: `d${index + 1}`,
      })),
      acceptedDrawId: "d3",
    })
    const offer = phaseOf(day, [])
    expect(offer.kind).toBe("offer")
    const story: Story = {
      id: "s1",
      drawId: "d3",
      slip: day.draws[2]!.slip,
      note: "走了小路",
      createdAt: 10,
    }
    expect(phaseOf(day, [story]).kind).toBe("closed")
  })
})

describe("surprise window", () => {
  it("picks a hidden minute inside today's window", () => {
    const now = new Date(2026, 10, 17, 9, 0, 0)
    expect(pickSurpriseTime(now, "10:00", "12:00", () => 0)).toBe(
      new Date(2026, 10, 17, 10, 0, 0).getTime()
    )
    const during = new Date(2026, 10, 17, 10, 30, 0)
    expect(pickSurpriseTime(during, "10:00", "12:00", () => 0)).toBe(
      new Date(2026, 10, 17, 10, 31, 0).getTime()
    )
    expect(
      pickSurpriseTime(
        new Date(2026, 10, 17, 21, 0, 0),
        "10:00",
        "20:00",
        () => 0
      )
    ).toBeNull()
    expect(windowIsValid("10:00", "10:20")).toBe(false)
  })

  it("clears the bell when surprise mode is off", () => {
    const settings: Settings = {
      surpriseEnabled: false,
      windowStart: "10:00",
      windowEnd: "20:00",
      sound: true,
      installHintDismissed: false,
    }
    const day: DayState = {
      ...emptyDay("2026-11-17"),
      surpriseAt: 123,
      surpriseNotified: true,
    }
    const next = rescheduleSurprise(
      day,
      settings,
      new Date(2026, 10, 17, 9, 0, 0)
    )
    expect(next.surpriseAt).toBeNull()
    expect(next.surpriseNotified).toBe(false)
  })
})

describe("copy helpers", () => {
  it("formats slip numbers and the midnight countdown", () => {
    expect(toChineseNumber(17)).toBe("十七")
    expect(toChineseNumber(20)).toBe("二十")
    expect(slipLabel({ number: 17, rank: "上上签" })).toBe("第十七签 · 上上签")
    expect(slipLabel({ number: 1, rank: "上签", custom: true })).toBe("自拟签")
    const evening = new Date(2026, 10, 17, 23, 0, 0).getTime()
    expect(localDateKey(new Date(evening))).toBe("2026-11-17")
    expect(formatCountdown(msUntilLocalMidnight(evening))).toBe("01:00:00")
  })
})
