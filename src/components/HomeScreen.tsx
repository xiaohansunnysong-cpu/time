import { useEffect, useState } from "react"

import { FortuneTube } from "@/components/temple/FortuneTube"
import { Incense } from "@/components/temple/Incense"
import { SlipCard } from "@/components/temple/SlipCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HangPlaque } from "@/components/HangPlaque"
import { StorySheet } from "@/components/StorySheet"
import { canDraw, phaseOf, surpriseIsReady } from "@/lib/draw"
import { formatCountdown, msUntilLocalMidnight } from "@/lib/format"
import { useApp } from "@/state/app-state"
import { BellIcon } from "lucide-react"

export function HomeScreen() {
  const {
    settings,
    day,
    stories,
    now,
    requestDraw,
    acceptDraw,
    setSurpriseOpen,
    setView,
  } = useApp()
  const phase = phaseOf(day, stories)
  const remainingDraw = canDraw(day)
  const ready = surpriseIsReady(day, settings, now)
  const [storyOpen, setStoryOpen] = useState(false)
  const [hangOpen, setHangOpen] = useState(false)
  const left = formatCountdown(msUntilLocalMidnight(now))

  useEffect(() => {
    if (phase.kind !== "altar") return
    let last = 0
    let primed = false
    let previous = { x: 0, y: 0, z: 0 }
    const onMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration || acceleration.x == null || acceleration.y == null || acceleration.z == null) {
        return
      }
      if (!primed) {
        previous = { x: acceleration.x, y: acceleration.y, z: acceleration.z }
        primed = true
        return
      }
      const delta =
        Math.abs(acceleration.x - previous.x) +
        Math.abs(acceleration.y - previous.y) +
        Math.abs(acceleration.z - previous.z)
      previous = { x: acceleration.x, y: acceleration.y, z: acceleration.z }
      if (delta > 24 && Date.now() - last > 1800) {
        last = Date.now()
        requestDraw()
      }
    }
    window.addEventListener("devicemotion", onMotion)
    return () => window.removeEventListener("devicemotion", onMotion)
  }, [phase.kind, requestDraw])

  const offer = phase.kind === "offer" ? phase : null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.42em] text-primary">时间盲盒</p>
          <h1 className="foil font-heading text-4xl leading-tight">
            {phase.kind === "closed"
              ? "今日机缘已尽"
              : offer
                ? "签落下来了"
                : "今日求签"}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            让生活轻轻偏出原有的轨迹。不是占卜，只是一件可以留下小故事的小事。
          </p>
        </div>
        <Button
          variant="outline"
          size="icon-lg"
          className="size-11 shrink-0"
          aria-label="随缘时刻"
          onClick={() => setSurpriseOpen(true)}
        >
          <BellIcon />
        </Button>
      </header>

      <Incense used={day.draws.length} />

      {ready && phase.kind === "altar" ? (
        <Alert>
          <AlertTitle>签筒已暖</AlertTitle>
          <AlertDescription>
            你选的时辰到了。这不是任务提醒，只是一个可以偏一下的瞬间。
          </AlertDescription>
        </Alert>
      ) : null}

      {settings.surpriseEnabled && !ready && day.draws.length === 0 ? (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {day.surpriseAt
            ? "签筒还凉着。今日会在你选的时辰里悄悄温一次，你仍可以现在求签。"
            : "今天这段时辰已经过去。明天签筒会在同样的时段里自己温一次。"}
        </p>
      ) : null}

      {phase.kind === "closed" ? (
        <Card>
          <CardHeader>
            <CardTitle>明日再来</CardTitle>
            <CardDescription>
              三支签都求过了。签筒要到零点才重新温热。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <p className="font-heading text-4xl tracking-[0.2em] text-primary tabular-nums">
              {left}
            </p>
            <p className="text-sm text-muted-foreground">距离明天</p>
            <FortuneTube dim />
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => setView("log")}
            >
              去看看缘分日志
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {phase.kind === "altar" ? (
        <div className="flex flex-col gap-5">
          <FortuneTube warm={ready} onDraw={requestDraw} />
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            按住签筒，或轻轻摇一摇手机。签会自己飞出来。
          </p>
          {phase.loggedToday ? (
            <p className="text-center text-sm text-primary">
              上一签已收进缘分日志。香还剩着，可以再求。
            </p>
          ) : null}
          <Button className="h-12 w-full" onClick={requestDraw}>
            {phase.loggedToday ? "再求一签" : "直接求签"}
          </Button>
        </div>
      ) : null}

      {offer ? (
        <div className="flex flex-col gap-4">
          {!remainingDraw ? (
            <Card>
              <CardHeader>
                <CardTitle>今日机缘已尽，明日再来</CardTitle>
                <CardDescription>
                  不能再换签了。这一支还可以收下，也可以写成故事。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl tracking-[0.18em] text-primary tabular-nums">
                  {left}
                </p>
              </CardContent>
            </Card>
          ) : null}
          <SlipCard slip={offer.draw.slip} />
          <div className="flex flex-col gap-2">
            {offer.accepted ? (
              <Button
                className="h-12 w-full"
                onClick={() => setStoryOpen(true)}
              >
                记下这段缘
              </Button>
            ) : (
              <Button
                className="h-12 w-full"
                onClick={() => acceptDraw(offer.draw.id)}
              >
                收下这签
              </Button>
            )}
            {remainingDraw ? (
              <Button
                variant="outline"
                className="h-12 w-full"
                onClick={requestDraw}
              >
                换签
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="h-11 w-full text-primary"
              onClick={() => setHangOpen(true)}
            >
              完成后，把小故事挂到广场
            </Button>
          </div>
        </div>
      ) : null}

      {offer ? (
        <StorySheet
          open={storyOpen}
          onOpenChange={setStoryOpen}
          drawId={offer.draw.id}
          title={offer.draw.slip.title}
        />
      ) : null}
      {offer && hangOpen ? (
        <HangPlaque
          open
          onOpenChange={setHangOpen}
          slip={offer.draw.slip}
          initialStory={stories.find((story) => story.drawId === offer.draw.id)?.note ?? ""}
        />
      ) : null}
    </div>
  )
}
