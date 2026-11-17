import { FeatherIcon, FlameIcon, ScrollTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { View } from "@/lib/types"
import { useApp } from "@/state/app-state"

const ITEMS: Array<{ view: View; label: string; icon: typeof FlameIcon }> = [
  { view: "draw", label: "求签", icon: FlameIcon },
  { view: "log", label: "缘分日志", icon: ScrollTextIcon },
  { view: "mine", label: "我的签", icon: FeatherIcon },
]

export function AppNav() {
  const { view, setView } = useApp()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-md gap-1 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = view === item.view
          return (
            <Button
              key={item.view}
              variant={active ? "default" : "ghost"}
              className="h-12 flex-1"
              aria-current={active ? "page" : undefined}
              onClick={() => setView(item.view)}
            >
              <Icon data-icon="inline-start" />
              {item.label}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
