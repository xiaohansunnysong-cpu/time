import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useApp } from "@/state/app-state"
import { CameraIcon } from "lucide-react"

export function StorySheet({
  open,
  onOpenChange,
  drawId,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  drawId: string
  title: string
}) {
  const { saveStory } = useApp()
  const [note, setNote] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [saving, setSaving] = useState(false)

  function reset() {
    setNote("")
    setFile(null)
    setInvalid(false)
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <SheetContent side="bottom" className="max-h-[88svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>记下这段缘</SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!note.trim()) {
              setInvalid(true)
              return
            }
            setSaving(true)
            void saveStory({ drawId, note, file }).then((ok) => {
              setSaving(false)
              if (ok) {
                reset()
                onOpenChange(false)
              }
            })
          }}
        >
          <FieldGroup>
            <Field data-invalid={invalid || undefined}>
              <FieldLabel htmlFor="story-note">两句就够</FieldLabel>
              <Textarea
                id="story-note"
                value={note}
                maxLength={200}
                aria-invalid={invalid || undefined}
                placeholder="发生了什么，或者什么都没发生。"
                onChange={(event) => {
                  setNote(event.target.value)
                  setInvalid(false)
                }}
              />
              <FieldDescription>{note.trim().length}/200</FieldDescription>
              {invalid ? (
                <FieldError>先写一点点，再收进日志。</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="story-photo">照片，可有可无</FieldLabel>
              <input
                id="story-photo"
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null
                  setFile(next)
                  setPreview((current) => {
                    if (current) URL.revokeObjectURL(current)
                    return next ? URL.createObjectURL(next) : null
                  })
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => document.getElementById("story-photo")?.click()}
              >
                <CameraIcon data-icon="inline-start" />
                {file ? "换一张照片" : "添一张照片"}
              </Button>
              {preview ? (
                <img
                  src={preview}
                  alt="即将收进缘分日志的照片"
                  className="max-h-56 w-full rounded-lg object-cover"
                />
              ) : null}
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit" className="h-11 w-full" disabled={saving}>
              {saving ? "收着…" : "收进缘分日志"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删去这则缘分？</DialogTitle>
          <DialogDescription>
            它只存在这台设备上。删掉之后，文字和照片都会消失。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            留下
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            删去
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
