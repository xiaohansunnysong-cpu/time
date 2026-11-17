import { FeatherIcon, FlameIcon, ScrollTextIcon, TreesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { View } from "@/lib/types"
import { useApp } from "@/state/app-state"

const ITEMS: Array<{ view: View; label: string; icon: typeof FlameIcon }> = [
  { view: "draw", label: "求签", icon: FlameIcon },
  { view: "plaza", label: "广场", icon: TreesIcon },
  { view: "log", label: "日志", icon: ScrollTextIcon },
  { view: "mine", label: "我的", icon: FeatherIcon },
]

export function AppNav() {
  const { view, setView } = useApp()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-md gap-1 px-2 pt-2">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = view === item.view
          return (
            <Button
              key={item.view}
              variant={active ? "default" : "ghost"}
              className="h-14 min-w-0 flex-1 flex-col gap-1 px-1 text-xs"
              aria-current={active ? "page" : undefined}
              onClick={() => setView(item.view)}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="leading-none">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
