const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const BANNED = [
  "傻逼",
  "傻b",
  "煞笔",
  "操你妈",
  "妈逼",
  "去死",
  "脑残",
  "贱人",
  "鸡巴",
  "阴茎",
  "阴道",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "nigga",
  "porn",
]

const LINK_RE =
  /(?:https?:\/\/|www\d*\.)|(?:[a-z0-9-]+\.)+(?:com|cn|net|org|io|me|app|xyz|co|link|gg|tv|cc|info|top)\b|javascript:|data:/i

export const LIMITS = {
  nickname: 16,
  story: 200,
  slipText: 500,
  postsPerClient: 5,
  postsPerIp: 15,
  reportHideAt: 3,
  pageSize: 20,
}

export function codePointLength(value) {
  return Array.from(value).length
}

export function visibleText(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim()
}

export function fold(value) {
  return visibleText(value).normalize("NFKC")
}

export function parseClientId(value) {
  if (typeof value !== "string" || !UUID_RE.test(value.trim())) return null
  return value.trim().toLowerCase()
}

export function hasLink(value) {
  return LINK_RE.test(fold(value).toLowerCase())
}

export function hasProfanity(value) {
  const compact = fold(value).toLowerCase().replace(/[\s._*\-]+/g, "")
  return BANNED.some((word) => compact.includes(word))
}

function fail(status, error) {
  return { ok: false, status, error }
}

function cleanText(value, { min, max, empty, long }) {
  if (typeof value !== "string") return fail(400, empty)
  const text = visibleText(value)
  const length = codePointLength(text)
  if (length < min) return fail(400, empty)
  if (length > max) return fail(400, long)
  if (hasLink(text)) return fail(400, "广场上不挂链接")
  if (hasProfanity(text)) return fail(400, "这句话不太适合挂在广场上")
  return { ok: true, text }
}

export function validatePostInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail(400, "内容读不懂")
  }
  const clientId = parseClientId(body.clientId)
  if (!clientId) return fail(400, "这台设备的记号不对，刷新后再试")

  const nickname = cleanText(body.nickname, {
    min: 1,
    max: LIMITS.nickname,
    empty: "先起一个称呼",
    long: "称呼最多 16 个字",
  })
  if (!nickname.ok) return nickname

  const story = cleanText(body.story, {
    min: 1,
    max: LIMITS.story,
    empty: "写一两句再挂上去",
    long: "小故事最多 200 个字",
  })
  if (!story.ok) return story

  const slipText = cleanText(body.slipText, {
    min: 1,
    max: LIMITS.slipText,
    empty: "这支签读不完整",
    long: "签文太长了",
  })
  if (!slipText.ok) return slipText

  const slipNumber = body.slipNumber
  if (
    typeof slipNumber !== "number" ||
    !Number.isInteger(slipNumber) ||
    slipNumber < 0 ||
    slipNumber > 100000
  ) {
    return fail(400, "这支签读不完整")
  }

  return {
    ok: true,
    value: {
      clientId,
      nickname: nickname.text,
      story: story.text,
      slipText: slipText.text,
      slipNumber,
    },
  }
}

export function validateClientBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail(400, "内容读不懂")
  }
  const clientId = parseClientId(body.clientId)
  if (!clientId) return fail(400, "这台设备的记号不对，刷新后再试")
  return { ok: true, clientId }
}
