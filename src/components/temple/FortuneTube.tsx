import { cn } from "@/lib/utils"

export function FortuneTube({
  shaking = false,
  dim = false,
  warm = false,
}: {
  shaking?: boolean
  dim?: boolean
  warm?: boolean
}) {
  return (
    <div className={cn("tube-stage", dim && "tube-dim", warm && "tube-warm")}>
      <span className="candle candle-left" aria-hidden />
      <span className="candle candle-right" aria-hidden />
      <span className="incense-smoke tube-smoke-a" aria-hidden />
      <span className="incense-smoke tube-smoke-b" aria-hidden />
      <span className="incense-smoke tube-smoke-c" aria-hidden />
      <div className={cn("tube", shaking && "tube-shake")}>
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
    </div>
  )
}
