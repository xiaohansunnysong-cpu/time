const PROFANITY = [
  "傻逼",
  "傻b",
  "煞笔",
  "妈的",
  "他妈",
  "操你",
  "肏你",
  "滚蛋",
  "去死",
  "色情",
  "裸体",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "nigger",
  "slut",
  "cunt",
]

const URL_RE = /https?:\/\/|www\./i
const DOMAIN_RE =
  /(?:^|[^\p{L}\p{N}])(?:[a-z0-9-]+\.)+(?:com|cn|net|org|io|me|co|xyz|app)(?:[^\p{L}\p{N}]|$)/iu

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeText(value, { min, max }) {
  if (typeof value !== "string") return { error: "格式不对" }
  const text = value.replace(/\s+/g, " ").trim()
  const length = Array.from(text).length
  if (length < min) return { error: min === 1 ? "还空着" : "太短了" }
  if (URL_RE.test(text) || DOMAIN_RE.test(text)) return { error: "不能带链接" }
  const lower = text.toLowerCase()
  if (PROFANITY.some((word) => lower.includes(word))) return { error: "这句话不适合挂出来" }
  if (length > max) return { error: "太长了" }
  return { text }
}

export function normalizeNickname(value) {
  return normalizeText(value, { min: 1, max: 16 })
}

export function normalizeStory(value) {
  return normalizeText(value, { min: 1, max: 200 })
}

export function normalizeSlipText(value) {
  return normalizeText(value, { min: 1, max: 400 })
}

export function normalizeClientId(value) {
  if (typeof value !== "string" || !UUID_RE.test(value)) return { error: "缺少访客记号" }
  return { text: value.toLowerCase() }
}

export function normalizeSlipNumber(value) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(number) || number < 0 || number > 100000) {
    return { error: "签号不对" }
  }
  return { number }
}

export function allowedOrigin(origin) {
  if (!origin) return true
  if (origin === "https://shijian-manghe.onrender.com") return true
  try {
    const url = new URL(origin)
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1"
    return local && (url.protocol === "http:" || url.protocol === "https:")
  } catch {
    return false
  }
}
