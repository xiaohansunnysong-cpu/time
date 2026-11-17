import { useEffect, useState } from "react"

import { CustomSheet } from "@/components/CustomSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { CATEGORY_LABEL, DURATION_LABEL } from "@/lib/format"
import { SLIP_TOTAL } from "@/lib/slip-pick"
import { useApp } from "@/state/app-state"

export function MineScreen() {
  const { custom, removeCustom, setSurpriseOpen } = useApp()
  const [open, setOpen] = useState(false)
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [hintReady, setHintReady] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setHintReady(true)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.42em] text-primary">时间盲盒</p>
        <h1 className="font-heading text-3xl">我的签</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          签筒里有 {SLIP_TOTAL.toLocaleString("zh-CN")} 支常备签
          {custom.length > 0 ? `，另有 ${custom.length} 支你写下的` : ""}。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>随缘时刻</CardTitle>
          <CardDescription>
            选一段每天可能出现的时辰。到了会轻声敲你；若你不在，下次打开时签筒是温的。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => setSurpriseOpen(true)}
          >
            设定时辰
          </Button>
        </CardContent>
      </Card>

      <Button className="h-12 w-full" onClick={() => setOpen(true)}>
        写一支自己的签
      </Button>

      {custom.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有自拟签</EmptyTitle>
            <EmptyDescription>
              写一件你一直想做、但普通日子不会主动去做的小事。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {custom.map((challenge) => (
            <Card key={challenge.id} size="sm">
              <CardHeader>
                <CardTitle>{challenge.title}</CardTitle>
                <CardDescription>{challenge.verse}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="leading-relaxed">{challenge.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">自拟签</Badge>
                  <Badge variant="outline">
                    {CATEGORY_LABEL[challenge.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {DURATION_LABEL[challenge.duration]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="h-10 self-start"
                  onClick={() => removeCustom(challenge.id)}
                >
                  从签筒取出
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InstallHint
        event={installEvent}
        ready={hintReady}
        onInstalled={() => {
          setInstallEvent(null)
          setHintReady(false)
        }}
      />

      <CustomSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

function InstallHint({
  event,
  ready,
  onInstalled,
}: {
  event: BeforeInstallPromptEvent | null
  ready: boolean
  onInstalled: () => void
}) {
  const ios =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent)
  const standalone =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches

  if (standalone) return null

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>放到主屏幕</CardTitle>
        <CardDescription>
          装好之后，它会像一枚小签筒待在手机上。数据仍然只在这台设备里。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ready && event ? (
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => {
              void event.prompt().then(() => onInstalled())
            }}
          >
            安装时间盲盒
          </Button>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {ios
              ? "在 Safari 里点分享，再选「添加到主屏幕」。"
              : "用浏览器菜单里的「安装应用」或「添加到主屏幕」。"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
}
