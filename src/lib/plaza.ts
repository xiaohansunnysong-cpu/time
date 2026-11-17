import type { SlipSnapshot } from "@/lib/types"

const FALLBACK = "https://shijian-manghe-api.onrender.com"

export const API_BASE = (
  import.meta.env.VITE_API_URL || FALLBACK
).replace(/\/$/, "")

export type PlazaPost = {
  id: string
  nickname: string
  slipNumber: number
  slipText: string
  story: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
}

export type PlazaPage = {
  posts: PlazaPost[]
  nextCursor: string | null
}

export function slipShareText(slip: SlipSnapshot): string {
  return [slip.verse, slip.title, slip.description].filter(Boolean).join("\n")
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    if (body.error) return body.error
  } catch {
    /* ignore */
  }
  return "香火还没点着，稍后再试"
}

export async function fetchPosts(
  cursor: string | null,
  clientId: string,
  signal?: AbortSignal,
): Promise<PlazaPage> {
  const url = new URL(`${API_BASE}/api/posts`)
  if (cursor) url.searchParams.set("cursor", cursor)
  if (clientId) url.searchParams.set("clientId", clientId)
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as PlazaPage
}

export async function publishStory(input: {
  nickname: string
  slipNumber: number
  slipText: string
  story: string
  clientId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) return { ok: false, error: await readError(response) }
    return { ok: true }
  } catch {
    return { ok: false, error: "广场暂时没应声，签还在你手里" }
  }
}

export async function toggleLike(
  id: string,
  clientId: string,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  const response = await fetch(`${API_BASE}/api/posts/${id}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as { likeCount: number; likedByMe: boolean }
}

export async function reportPost(
  id: string,
  clientId: string,
): Promise<{ hidden: boolean }> {
  const response = await fetch(`${API_BASE}/api/posts/${id}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as { hidden: boolean }
}
