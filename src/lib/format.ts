import type {
  Category,
  Company,
  Duration,
  Mood,
  SlipSnapshot,
} from "@/lib/types"

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
const UNITS = ["", "十", "百", "千"]

export function toChineseNumber(n: number): string {
  if (!Number.isInteger(n) || n <= 0 || n > 10000) return String(n)
  if (n === 10000) return "一万"
  const digits = String(n).split("").map(Number)
  let out = ""
  let pendingZero = false
  digits.forEach((digit, index) => {
    const unit = UNITS[digits.length - 1 - index] ?? ""
    if (digit === 0) {
      pendingZero = out.length > 0
      return
    }
    if (pendingZero) out += "零"
    pendingZero = false
    if (!(digit === 1 && unit === "十" && out === "")) out += DIGITS[digit]
    out += unit
  })
  return out
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

export function formatRelative(then: number, now: number): string {
  const delta = Math.max(0, now - then)
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return "昨天"
  if (days < 30) return `${days}天前`
  const date = new Date(then)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export const CATEGORY_LABEL: Record<Category, string> = {
  ritual: "小仪式",
  rule: "怪规则",
  stranger: "轻轻一句",
  secret: "秘密任务",
  explore: "去看看",
  role: "扮演",
  luck: "运气",
  adventure: "小冒险",
  city: "城市",
  kindness: "善意",
  sense: "感官",
  create: "微创作",
  family: "家人",
  slow: "慢下来",
  food: "食物",
  nature: "自然",
  music: "声音",
  book: "字句",
  photo: "照片",
  memory: "旧事",
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
