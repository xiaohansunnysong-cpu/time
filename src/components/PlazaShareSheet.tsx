import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  createPlazaPost,
  loadPlazaNickname,
  PlazaRequestError,
  savePlazaNickname,
  slipShareText,
  textLength,
} from "@/lib/plaza"
import type { SlipSnapshot } from "@/lib/types"

export function PlazaShareSheet({
  open,
  onOpenChange,
  slip,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  slip: SlipSnapshot
}) {
  const [nickname, setNickname] = useState(loadPlazaNickname)
  const [story, setStory] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  const slipText = slipShareText(slip)
  const nicknameCount = textLength(nickname.trim())
  const storyCount = textLength(story.trim())

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!posting) onOpenChange(next)
      }}
    >
      <SheetContent side="bottom" className="max-h-[88svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>挂到广场</SheetTitle>
          <SheetDescription>
            做完之后，用一个称呼和两句话，让别人也看见这件小事。
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4"
          onSubmit={(event) => {
            event.preventDefault()
            const nextNickname = nickname.trim()
            const nextStory = story.trim()
            if (textLength(nextNickname) < 1 || textLength(nextNickname) > 16) {
              setError("称呼用 1 到 16 个字")
              return
            }
            if (storyCount < 1 || storyCount > 200) {
              setError("小故事写 1 到 200 个字")
              return
            }
            if (!slipText) {
              setError("这支签读不完整")
              return
            }
            setError(null)
            setPosting(true)
            savePlazaNickname(nextNickname)
            void createPlazaPost({
              nickname: nextNickname,
              slipNumber: slip.custom ? 0 : slip.number,
              slipText,
              story: nextStory,
            })
              .then(() => {
                toast("小故事挂到广场上了")
                setStory("")
                onOpenChange(false)
              })
              .catch((reason: unknown) => {
                const message =
                  reason instanceof PlazaRequestError
                    ? reason.message
                    : "广场暂时没有回应"
                setError(
                  message === "香火还没点着"
                    ? "香火还在点燃。过一会儿再挂，求签不受影响。"
                    : `${message} 求签不受影响。`
                )
              })
              .finally(() => setPosting(false))
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plaza-nickname">怎么称呼你</FieldLabel>
              <Input
                id="plaza-nickname"
                className="h-11"
                value={nickname}
                maxLength={16}
                autoComplete="nickname"
                placeholder="一个临时的称呼就好"
                onChange={(event) => {
                  setNickname(event.target.value)
                  setError(null)
                }}
              />
              <FieldDescription>
                {nicknameCount}/16，会记住在这台设备上
              </FieldDescription>
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="plaza-story">小故事</FieldLabel>
              <Textarea
                id="plaza-story"
                value={story}
                maxLength={200}
                placeholder="做了没有，或者做到一半也行。"
                onChange={(event) => {
                  setStory(event.target.value)
                  setError(null)
                }}
              />
              <FieldDescription>{storyCount}/200</FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          {posting ? (
            <p className="text-center text-sm text-primary">香火正在点燃…</p>
          ) : null}
          <SheetFooter>
            <Button type="submit" className="h-11 w-full" disabled={posting}>
              {posting ? "香火正在点燃…" : "挂上去"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
