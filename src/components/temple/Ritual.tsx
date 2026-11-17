import { useEffect, useState } from "react"

import { FateGears } from "@/components/temple/FateGears"
import { FortuneTube } from "@/components/temple/FortuneTube"
import { Button } from "@/components/ui/button"
import { slipLabel } from "@/lib/format"
import type { SlipSnapshot } from "@/lib/types"

function sliceChars(text: string, count: number) {
  return Array.from(text).slice(0, count).join("")
}

export function Ritual({
  slip,
  onDone,
}: {
  slip: SlipSnapshot
  onDone: () => void
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const parts = [slip.verse, slip.title, slip.description]
  const [phase, setPhase] = useState<"flight" | "ink">(reduced ? "ink" : "flight")
  const [part, setPart] = useState(0)
  const [count, setCount] = useState(reduced ? 999 : 0)

  useEffect(() => {
    if (reduced || phase === "ink") return
    const timer = window.setTimeout(() => setPhase("ink"), 980)
    return () => window.clearTimeout(timer)
  }, [phase, reduced])

  useEffect(() => {
    if (phase !== "ink" || reduced) return
    const text = [slip.verse, slip.title, slip.description][part] ?? ""
    const length = Array.from(text).length
    if (count >= length) {
      if (part >= 2) return
      const timer = window.setTimeout(() => {
        setPart((current) => current + 1)
        setCount(0)
      }, 260)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setCount((current) => current + 1), 38)
    return () => window.clearTimeout(timer)
  }, [count, part, phase, reduced, slip.description, slip.title, slip.verse])

  const finished =
    reduced || (phase === "ink" && part >= parts.length - 1 && count >= Array.from(parts[part] ?? "").length)

  return (
    <div className="ritual-overlay" role="dialog" aria-label="求签">
      <div className="ritual-gears" aria-hidden>
        <FateGears />
      </div>
      <div className="flex w-full max-w-md flex-col items-center gap-6 px-6">
        {phase === "flight" ? <FortuneTube shaking /> : null}
        <article
          className={
            phase === "flight"
              ? "slip-fly slip-paper relative w-full overflow-hidden rounded-sm px-6 py-7"
              : "ink-reveal slip-paper relative w-full overflow-hidden rounded-sm px-6 py-7"
          }
        >
          <div className="slip-edge" aria-hidden />
          <p className="text-center text-xs tracking-[0.35em] text-temple">
            {slipLabel(slip)}
          </p>
          <p className="mt-4 text-center font-heading text-3xl leading-snug">
            {phase === "ink" ? sliceChars(parts[0] ?? "", part > 0 || reduced ? 999 : count) : "　"}
          </p>
          <div className="slip-rule my-4" />
          <h2 className="font-serif text-xl leading-snug">
            {phase === "ink" && (part > 0 || reduced)
              ? sliceChars(parts[1] ?? "", part > 1 || reduced ? 999 : count)
              : ""}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            {phase === "ink" && (part > 1 || reduced) ? sliceChars(parts[2] ?? "", reduced ? 999 : count) : ""}
          </p>
        </article>
        <Button
          variant="ghost"
          className="h-11 text-primary"
          onClick={onDone}
        >
          {finished ? "看清了" : "跳过"}
        </Button>
      </div>
    </div>
  )
}
