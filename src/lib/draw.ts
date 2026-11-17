import type { Challenge, DayState, Draw, Settings, Story } from "@/lib/types"
import { DAILY_DRAW_LIMIT } from "@/lib/types"
import { parseMinutes } from "@/lib/format"

export function isTestMode(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("test") === "1"
}

export function toSlip(challenge: Challenge) {
  return {
    challengeId: challenge.id,
    number: challenge.number,
    rank: challenge.rank,
    verse: challenge.verse,
    title: challenge.title,
    description: challenge.description,
    duration: challenge.duration,
    category: challenge.category,
    custom: challenge.custom,
  }
}

export function drawsRemaining(day: DayState): number {
  return isTestMode() ? Number.POSITIVE_INFINITY : Math.max(0, DAILY_DRAW_LIMIT - day.draws.length)
}

export function canDraw(day: DayState): boolean {
  return isTestMode() || day.draws.length < DAILY_DRAW_LIMIT
}

export type Phase =
  | { kind: "altar"; loggedToday: boolean }
  | { kind: "offer"; draw: Draw; accepted: boolean }
  | { kind: "closed" }

export function phaseOf(day: DayState, stories: Story[]): Phase {
  const latest = day.draws[day.draws.length - 1]
  if (!latest) return { kind: "altar", loggedToday: false }
  const logged = stories.some((story) => story.drawId === latest.id)
  if (!logged) {
    return {
      kind: "offer",
      draw: latest,
      accepted: day.acceptedDrawId === latest.id,
    }
  }
  if (!canDraw(day)) return { kind: "closed" }
  return { kind: "altar", loggedToday: true }
}

export function pickSurpriseTime(
  now: Date,
  start: string,
  end: string,
  random: () => number = Math.random
): number | null {
  const startMin = parseMinutes(start)
  const endMin = parseMinutes(end)
  if (startMin == null || endMin == null) return null
  if (endMin - startMin < 30) return null
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin >= endMin) return null
  const from = Math.max(startMin, nowMin + 1)
  if (from >= endMin) return null
  const chosen = from + Math.floor(random() * (endMin - from))
  const result = new Date(now)
  result.setHours(0, 0, 0, 0)
  return result.getTime() + chosen * 60_000
}

export function rescheduleSurprise(
  day: DayState,
  settings: Settings,
  now: Date,
  random: () => number = Math.random
): DayState {
  if (!settings.surpriseEnabled) {
    return { ...day, surpriseAt: null, surpriseNotified: false }
  }
  if (day.surpriseNotified) return day
  return {
    ...day,
    surpriseAt: pickSurpriseTime(
      now,
      settings.windowStart,
      settings.windowEnd,
      random
    ),
  }
}

export function surpriseIsReady(
  day: DayState,
  settings: Settings,
  now: number
): boolean {
  return (
    settings.surpriseEnabled &&
    day.draws.length === 0 &&
    day.surpriseAt != null &&
    now >= day.surpriseAt
  )
}

export function emptyDay(date: string): DayState {
  return {
    date,
    draws: [],
    acceptedDrawId: null,
    surpriseAt: null,
    surpriseNotified: false,
  }
}
