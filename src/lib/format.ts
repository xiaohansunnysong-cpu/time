import type {
  Category,
  Company,
  Duration,
  Mood,
  SlipSnapshot,
} from "@/lib/types"

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]

export function toChineseNumber(n: number): string {
  if (!Number.isInteger(n) || n <= 0 || n >= 100) return String(n)
  if (n < 10) return DIGITS[n] ?? String(n)
  if (n === 10) return "十"
  if (n < 20) return `十${DIGITS[n % 10]}`
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${DIGITS[tens]}十${ones ? DIGITS[ones] : ""}`
}

export function slipLabel(
  slip: Pick<SlipSnapshot, "custom" | "number" | "rank">
) {
  if (slip.custom) return "自拟签"
  return `第${toChineseNumber(slip.number)}签 · ${slip.rank}`
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function msUntilLocalMidnight(now: number): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
}

export function formatStoryDate(key: string, today: Date): string {
  const todayKey = localDateKey(today)
  if (key === todayKey) return "今天"
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (key === localDateKey(yesterday)) return "昨天"
  const [year, month, day] = key.split("-")
  if (!year || !month || !day) return key
  return `${Number(year)}年${Number(month)}月${Number(day)}日`
}

export function formatClock(timestamp: number): string {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export const CATEGORY_LABEL: Record<Category, string> = {
  city: "城市探索",
  kindness: "陌生人小善意",
  sense: "感官体验",
  create: "创作",
  family: "家庭/亲子",
  slow: "慢下来",
  food: "食物",
  nature: "自然",
  music: "音乐",
  book: "书页",
  photo: "照片",
  memory: "记忆",
  friend: "朋友",
  home: "家里",
}

export const MOOD_LABEL: Record<Mood, string> = {
  lazy: "懒懒的",
  steady: "刚好",
  adventure: "想冒险",
}

export const COMPANY_LABEL: Record<Company, string> = {
  alone: "独自",
  child: "和孩子",
  friend: "和朋友",
}

export const DURATION_LABEL: Record<Duration, string> = {
  5: "约 5 分钟",
  15: "约 15 分钟",
  30: "约 30 分钟",
  60: "约 60 分钟",
}

export function parseMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function windowIsValid(start: string, end: string): boolean {
  const from = parseMinutes(start)
  const to = parseMinutes(end)
  if (from == null || to == null) return false
  return to - from >= 30
}
