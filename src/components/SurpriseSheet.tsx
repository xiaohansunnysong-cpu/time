import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { windowIsValid } from "@/lib/format"
import { useApp } from "@/state/app-state"

export function SurpriseSheet() {
  const { settings, surpriseOpen, setSurpriseOpen, updateSettings } = useApp()
  const valid = windowIsValid(settings.windowStart, settings.windowEnd)
  const [permission, setPermission] = useState(() =>
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission
  )

  return (
    <Sheet open={surpriseOpen} onOpenChange={setSurpriseOpen}>
      <SheetContent side="bottom" className="max-h-[88svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>随缘时刻</SheetTitle>
          <SheetDescription>
            在一段时辰里随机挑一个片刻。到了若允许，会轻声敲你；否则你下次打开，签筒会显示已暖。不会提前告诉你是哪一分钟。
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="surprise-on">开启随缘时刻</FieldLabel>
                <FieldDescription>
                  这不是日程提醒，只是一个可以偏出轨迹的瞬间。
                </FieldDescription>
              </FieldContent>
              <Switch
                id="surprise-on"
                checked={settings.surpriseEnabled}
                onCheckedChange={(checked) =>
                  updateSettings({ surpriseEnabled: checked })
                }
              />
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="sound-on">签筒的木鱼与钟</FieldLabel>
                <FieldDescription>
                  默认安静。打开后，按住签筒时有木鱼，签文展开时有一声轻钟。
                </FieldDescription>
              </FieldContent>
              <Switch
                id="sound-on"
                checked={settings.sound}
                onCheckedChange={(checked) =>
                  updateSettings({ sound: checked })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!valid || undefined}>
                <FieldLabel htmlFor="window-start">开始</FieldLabel>
                <Input
                  id="window-start"
                  type="time"
                  value={settings.windowStart}
                  aria-invalid={!valid || undefined}
                  onChange={(event) =>
                    updateSettings({ windowStart: event.target.value })
                  }
                />
              </Field>
              <Field data-invalid={!valid || undefined}>
                <FieldLabel htmlFor="window-end">结束</FieldLabel>
                <Input
                  id="window-end"
                  type="time"
                  value={settings.windowEnd}
                  aria-invalid={!valid || undefined}
                  onChange={(event) =>
                    updateSettings({ windowEnd: event.target.value })
                  }
                />
              </Field>
            </div>
            {!valid ? (
              <Field data-invalid>
                <FieldError>结束要晚于开始，至少留出半小时。</FieldError>
              </Field>
            ) : null}
          </FieldGroup>

          {permission === "unsupported" ? (
            <Alert>
              <AlertTitle>这个浏览器不支持通知</AlertTitle>
              <AlertDescription>
                到点之后打开应用，签筒会自己显示已就绪。
              </AlertDescription>
            </Alert>
          ) : permission === "denied" ? (
            <Alert>
              <AlertTitle>通知被拦住了</AlertTitle>
              <AlertDescription>
                没有关系。到点后你打开时间盲盒，签筒仍会是温的。
              </AlertDescription>
            </Alert>
          ) : permission === "granted" ? (
            <p className="text-sm text-muted-foreground">轻声提醒已允许。</p>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                void Notification.requestPermission().then((result) => {
                  setPermission(result)
                })
              }}
            >
              允许轻声提醒
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
