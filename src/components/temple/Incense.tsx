import { cn } from "@/lib/utils"

export function Incense({ used, limit = 3 }: { used: number; limit?: number }) {
  const remaining = Math.max(0, limit - used)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-7" aria-hidden>
        {Array.from({ length: limit }, (_, index) => {
          const lit = index >= used
          return (
            <div key={index} className="relative flex flex-col items-center">
              {lit ? <span className="incense-smoke" /> : null}
              <span
                className={cn(
                  "incense-tip",
                  lit ? "incense-tip-lit" : "incense-tip-out"
                )}
              />
              <span className={cn("incense-stick", !lit && "opacity-40")} />
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-primary" aria-live="polite">
        {remaining > 0 ? `今日尚有 ${remaining} 次机缘` : "三炷香都灭了"}
      </p>
    </div>
  )
}
