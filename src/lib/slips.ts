import type { Category, Duration, Rank, SlipSnapshot } from "@/lib/types"
import { SLIP_TOTAL } from "@/lib/slip-pick"

const CHUNK_SIZE = 500

export type StoredSlip = {
  n: number
  rank: Rank
  verse: string
  title: string
  description: string
  duration: Duration
  category: Category
}

const cache = new Map<number, StoredSlip[]>()

export function slipUrl(chunkIndex: number): string {
  const name = `chunk-${String(chunkIndex).padStart(2, "0")}.json`
  const base = import.meta.env.BASE_URL
  return `${base}slips/${name}`
}

export async function loadSlip(n: number): Promise<StoredSlip> {
  if (n < 1 || n > SLIP_TOTAL) throw new Error("签号超出签筒")
  const chunkIndex = Math.floor((n - 1) / CHUNK_SIZE)
  let slips = cache.get(chunkIndex)
  if (!slips) {
    const response = await fetch(slipUrl(chunkIndex))
    if (!response.ok) throw new Error("签筒没有应声")
    slips = (await response.json()) as StoredSlip[]
    cache.set(chunkIndex, slips)
  }
  const slip = slips.find((item) => item.n === n)
  if (!slip) throw new Error("这支签找不到")
  return slip
}

export function storedToSnapshot(slip: StoredSlip): SlipSnapshot {
  return {
    challengeId: `built-${slip.n}`,
    number: slip.n,
    rank: slip.rank,
    verse: slip.verse,
    title: slip.title,
    description: slip.description,
    duration: slip.duration,
    category: slip.category,
  }
}

export { SLIP_TOTAL }
