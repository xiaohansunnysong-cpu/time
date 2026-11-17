import { useEffect, useRef, useState, type PointerEvent } from "react"

import { cn } from "@/lib/utils"

function primeMotion() {
  const motion = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<string>
  }
  if (typeof motion.requestPermission === "function") {
    void motion.requestPermission().catch(() => undefined)
  }
}

export function FortuneTube({
  shaking = false,
  dim = false,
  warm = false,
  onDraw,
}: {
  shaking?: boolean
  dim?: boolean
  warm?: boolean
  onDraw?: () => void
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const [holding, setHolding] = useState(false)
  const [hint, setHint] = useState("")
  const timer = useRef<number | null>(null)
  const fired = useRef(false)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  function clearTimer() {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!onDraw || event.button !== 0) return
    primeMotion()
    fired.current = false
    setHint("")
    setHolding(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    clearTimer()
    timer.current = window.setTimeout(() => {
      fired.current = true
      setHolding(false)
      onDraw()
    }, reduced ? 0 : 680)
  }

  function end() {
    clearTimer()
    setHolding(false)
    if (onDraw && !fired.current && !reduced) setHint("再按住一会儿，签才会出来")
  }

  const stage = (
    <>
      <span className="candle candle-left" aria-hidden />
      <span className="candle candle-right" aria-hidden />
      <span className="incense-smoke tube-smoke-a" aria-hidden />
      <span className="incense-smoke tube-smoke-b" aria-hidden />
      <span className="incense-smoke tube-smoke-c" aria-hidden />
      <div className={cn("tube", (shaking || holding) && "tube-shake")}>
        <div className="tube-sticks" aria-hidden>
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className="tube-stick"
              style={{
                transform: `rotate(${(index - 3) * 5}deg) translateY(${index % 2 === 0 ? -4 : 2}px)`,
              }}
            />
          ))}
        </div>
        <div className="tube-band tube-band-top" />
        <div className="tube-band tube-band-bottom" />
      </div>
    </>
  )

  if (!onDraw) {
    return (
      <div className={cn("tube-stage", dim && "tube-dim", warm && "tube-warm")}>{stage}</div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className={cn(
          "tube-button tube-stage",
          dim && "tube-dim",
          warm && "tube-warm",
          holding && "tube-warm",
        )}
        aria-label={reduced ? "求签" : "按住签筒求签"}
        onPointerDown={start}
        onPointerUp={end}
        onPointerCancel={end}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          if (event.detail === 0) onDraw()
        }}
      >
        {stage}
      </button>
      <p className="min-h-5 text-center text-sm text-primary" aria-live="polite">
        {hint}
      </p>
    </div>
  )
}
