import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
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
import { getClientId, loadNickname, saveNickname } from "@/lib/client"
import { publishStory, slipShareText } from "@/lib/plaza"
import type { SlipSnapshot } from "@/lib/types"

export function HangPlaque({
  open,
  onOpenChange,
  slip,
  initialStory = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  slip: SlipSnapshot | null
  initialStory?: string
}) {
  const [nickname, setNickname] = useState(loadNickname)
  const [story, setStory] = useState(initialStory)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>把小故事挂到广场</SheetTitle>
          <SheetDescription>
            不登录。广场只看见绰号、签文和你写的几句，照片仍留在这台设备上。
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!slip || sending) return
            const name = nickname.trim()
            const note = story.trim()
            if (!name || !note) {
              setError("写一个绰号，再写一两句故事。")
              return
            }
            setSending(true)
            setError("")
            void publishStory({
              nickname: name,
              slipNumber: slip.number,
              slipText: slipShareText(slip),
              story: note,
              clientId: getClientId(),
            }).then((result) => {
              setSending(false)
              if (!result.ok) {
                setError(result.error)
                return
              }
              saveNickname(name)
              toast("已经挂到广场上了")
              onOpenChange(false)
            })
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plaza-nick">绰号</FieldLabel>
              <Input
                id="plaza-nick"
                value={nickname}
                maxLength={16}
                placeholder="比如：路过的云"
                onChange={(event) => setNickname(event.target.value)}
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="plaza-story">小故事</FieldLabel>
              <Textarea
                id="plaza-story"
                value={story}
                maxLength={200}
                placeholder="做完之后，发生了什么小小的事"
                onChange={(event) => setStory(event.target.value)}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit" className="h-11 w-full" disabled={sending || !slip}>
              {sending ? "正在挂上…" : "挂到广场"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
