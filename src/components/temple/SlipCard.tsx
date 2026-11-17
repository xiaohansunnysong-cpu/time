import { Badge } from "@/components/ui/badge"
import { CATEGORY_LABEL, DURATION_LABEL, slipLabel } from "@/lib/format"
import type { SlipSnapshot } from "@/lib/types"

export function SlipCard({ slip }: { slip: SlipSnapshot }) {
  return (
    <article className="slip-paper relative overflow-hidden rounded-sm px-6 py-7 shadow-2xl">
      <div className="slip-edge" aria-hidden />
      <div className="flex flex-col gap-4">
        <p className="text-center text-xs tracking-[0.32em] text-temple">
          {slipLabel(slip)}
        </p>
        <p className="text-center font-serif text-2xl leading-snug">
          {slip.verse}
        </p>
        <div className="slip-rule" />
        <div className="flex flex-col gap-2 pr-10">
          <h2 className="font-serif text-xl leading-snug">{slip.title}</h2>
          <p className="text-sm leading-relaxed">{slip.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{CATEGORY_LABEL[slip.category]}</Badge>
          <span className="text-xs tracking-wide">
            {DURATION_LABEL[slip.duration]}
          </span>
        </div>
        <p className="text-xs leading-relaxed opacity-70">
          签号和签文只是玩法称呼，不作吉凶。这是一张今天的小邀请。
        </p>
      </div>
      <div className="seal absolute right-4 bottom-16" aria-hidden>
        缘
      </div>
    </article>
  )
}
