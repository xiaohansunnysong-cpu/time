import { useEffect, useState } from "react"

import { FateGears } from "@/components/temple/FateGears"
import { FortuneTube } from "@/components/temple/FortuneTube"
import { Button } from "@/components/ui/button"
import { slipLabel } from "@/lib/format"
import type { SlipSnapshot } from "@/lib/types"

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
  const [phase, setPhase] = useState<"shake" | "gears" | "slip">(
    reduced ? "gears" : "shake"
  )

  useEffect(() => {
    const timers = reduced
      ? [
          window.setTimeout(() => setPhase("slip"), 400),
          window.setTimeout(onDone, 1100),
        ]
      : [
          window.setTimeout(() => setPhase("gears"), 1200),
          window.setTimeout(() => setPhase("slip"), 3800),
          window.setTimeout(onDone, 5200),
        ]
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [onDone, reduced])

  return (
    <div className="ritual-overlay" role="dialog" aria-label="求签">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-6">
        {phase === "shake" ? <FortuneTube shaking /> : null}
        {phase === "gears" ? <FateGears /> : null}
        {phase === "slip" ? (
          <div className="slip-fall flex w-full flex-col items-center gap-3">
            <p className="text-center text-sm tracking-[0.28em] text-primary">
              命运的齿轮开始转动
            </p>
            <p className="text-xs tracking-[0.35em] text-primary">
              {slipLabel(slip)}
            </p>
            <p className="text-center font-serif text-2xl leading-snug text-foreground">
              {slip.verse}
            </p>
          </div>
        ) : null}
        <Button variant="ghost" className="h-11" onClick={onDone}>
          跳过
        </Button>
      </div>
    </div>
  )
}
