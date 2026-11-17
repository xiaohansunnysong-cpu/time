import type { SlipSnapshot } from "@/lib/types"

const CLIENT_KEY = "tbb.plaza.clientId.v1"
const NICK_KEY = "tbb.plaza.nickname.v1"
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const configured = import.meta.env.VITE_API_URL?.trim()

export const API_BASE = (
  configured || "https://shijian-manghe-api.onrender.com"
).replace(/\/$/, "")

export type PlazaPost = {
  id: string
  nickname: string
  slipNumber: number
  slipText: string
  story: string
  createdAt: string
  likeCount: number
  liked: boolean
}

export type PlazaPage = {
  posts: PlazaPost[]
  nextCursor: string | null
}

export class PlazaRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "PlazaRequestError"
    this.status = status
  }
}

export function textLength(value: string): number {
  return Array.from(value).length
}

export function plazaClientId(): string {
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

export function loadPlazaNickname(): string {
  try {
    return localStorage.getItem(NICK_KEY)?.trim() ?? ""
  } catch {
    return ""
  }
}

export function savePlazaNickname(nickname: string) {
  try {
    const next = nickname.trim()
    if (next)
      localStorage.setItem(NICK_KEY, Array.from(next).slice(0, 16).join(""))
  } catch {
    /* remembering a nickname is a convenience */
  }
}

export function slipShareText(
  slip: Pick<SlipSnapshot, "verse" | "title" | "description">
): string {
  const text = [slip.verse, slip.title, slip.description]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n")
  return Array.from(text).slice(0, 500).join("")
}

export function plazaSlipLabel(slipNumber: number): string {
  if (!Number.isInteger(slipNumber) || slipNumber <= 0) return "自拟签"
  return `第${slipNumber}签`
}

export function relativeTime(iso: string, now: number): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ""
  const delta = Math.max(0, now - then)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (delta < minute) return "刚刚"
  if (delta < hour) return `${Math.floor(delta / minute)} 分钟前`
  if (delta < day) return `${Math.floor(delta / hour)} 小时前`
  if (delta < 2 * day) return "昨天"
  if (delta < 30 * day) return `${Math.floor(delta / day)} 天前`
  const date = new Date(then)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new PlazaRequestError("已取消", 0))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new PlazaRequestError("已取消", 0))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

async function once<T>(
  path: string,
  init: RequestInit,
  signal?: AbortSignal
): Promise<T> {
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 22_000)
  const onAbort = () => timeout.abort()
  signal?.addEventListener("abort", onAbort, { once: true })
  if (signal?.aborted) timeout.abort()
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: timeout.signal,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    })
    const payload = (await response.json().catch(() => null)) as {
      error?: unknown
    } | null
    if (!response.ok) {
      const message =
        payload && typeof payload.error === "string"
          ? payload.error
          : "广场暂时没有回应"
      throw new PlazaRequestError(message, response.status)
    }
    return payload as T
  } catch (error) {
    if (signal?.aborted) throw new PlazaRequestError("已取消", 0)
    if (error instanceof PlazaRequestError) throw error
    throw new PlazaRequestError("香火还没点着", 0)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", onAbort)
  }
}

export async function plazaRequest<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  let last: PlazaRequestError | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await once<T>(path, init, signal)
    } catch (error) {
      const wrapped =
        error instanceof PlazaRequestError
          ? error
          : new PlazaRequestError("广场暂时没有回应", 0)
      if (wrapped.message === "已取消") throw wrapped
      if (wrapped.status >= 400 && wrapped.status < 500) throw wrapped
      last = wrapped
      if (attempt < 2) await sleep(1000, signal)
    }
  }
  throw last ?? new PlazaRequestError("广场暂时没有回应", 0)
}

export function listPosts(cursor?: string | null, signal?: AbortSignal) {
  const params = new URLSearchParams()
  params.set("clientId", plazaClientId())
  if (cursor) params.set("cursor", cursor)
  return plazaRequest<PlazaPage>(
    `/api/posts?${params.toString()}`,
    { method: "GET" },
    signal
  )
}

export function createPlazaPost(
  input: {
    nickname: string
    slipNumber: number
    slipText: string
    story: string
  },
  signal?: AbortSignal
) {
  return plazaRequest<{ post: PlazaPost }>(
    "/api/posts",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        clientId: plazaClientId(),
      }),
    },
    signal
  )
}

export function toggleLike(id: string) {
  return plazaRequest<{ id: string; liked: boolean; likeCount: number }>(
    `/api/posts/${id}/like`,
    {
      method: "POST",
      body: JSON.stringify({ clientId: plazaClientId() }),
    }
  )
}

export function reportPost(id: string) {
  return plazaRequest<{ ok: boolean; hidden: boolean }>(
    `/api/posts/${id}/report`,
    {
      method: "POST",
      body: JSON.stringify({ clientId: plazaClientId() }),
    }
  )
}
