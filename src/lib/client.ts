const CLIENT_KEY = "tbb.clientId"
const NICK_KEY = "tbb.plazaNickname"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_KEY)
    if (existing && UUID_RE.test(existing)) return existing
    const next = crypto.randomUUID()
    localStorage.setItem(CLIENT_KEY, next)
    return next
  } catch {
    return crypto.randomUUID()
  }
}

export function loadNickname(): string {
  try {
    return localStorage.getItem(NICK_KEY) ?? ""
  } catch {
    return ""
  }
}

export function saveNickname(nickname: string) {
  try {
    localStorage.setItem(NICK_KEY, nickname)
  } catch {
    /* nickname is only a convenience */
  }
}
