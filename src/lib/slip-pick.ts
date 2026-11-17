export const SLIP_TOTAL = 10000
export const REPEAT_AFTER_RATIO = 1

export function createSeen(total = SLIP_TOTAL): Uint8Array {
  return new Uint8Array(Math.ceil((total + 1) / 8))
}

export function seenHas(bits: Uint8Array, n: number): boolean {
  const index = n >> 3
  return (bits[index] & (1 << (n & 7))) !== 0
}

export function seenSet(bits: Uint8Array, n: number) {
  const index = n >> 3
  bits[index] |= 1 << (n & 7)
}

export function seenCount(bits: Uint8Array, total = SLIP_TOTAL): number {
  let count = 0
  for (let n = 1; n <= total; n += 1) {
    if (seenHas(bits, n)) count += 1
  }
  return count
}

export function pickSlipNumber(
  bits: Uint8Array,
  total: number,
  exclude: number[] = [],
  random: () => number = Math.random,
): number {
  const skip = new Set(exclude.filter((n) => n >= 1 && n <= total))
  const unseen: number[] = []
  for (let n = 1; n <= total; n += 1) {
    if (!seenHas(bits, n) && !skip.has(n)) unseen.push(n)
  }
  let pool = unseen
  if (pool.length === 0) {
    bits.fill(0)
    pool = []
    for (let n = 1; n <= total; n += 1) {
      if (!skip.has(n)) pool.push(n)
    }
  }
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
  const picked = pool[index] ?? 1
  seenSet(bits, picked)
  return picked
}
