import { useState } from "react"

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CATEGORY_LABEL } from "@/lib/format"
import type { Category, Duration, Rank } from "@/lib/types"
import { CATEGORIES, DURATIONS } from "@/lib/types"
import { useApp } from "@/state/app-state"

export function CustomSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addCustom } = useApp()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [verse, setVerse] = useState("")
  const [duration, setDuration] = useState<Duration>(15)
  const [category, setCategory] = useState<Category>("slow")
  const [invalid, setInvalid] = useState(false)

  function reset() {
    setTitle("")
    setDescription("")
    setVerse("")
    setDuration(15)
    setCategory("slow")
    setInvalid(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>写一支自己的签</SheetTitle>
          <SheetDescription>
            它会进入签筒，和常备签一起被求到。仍然只是一件小事，不是占卜。
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4 pb-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!title.trim() || !description.trim()) {
              setInvalid(true)
              return
            }
            addCustom({
              id: crypto.randomUUID(),
              number: 0,
              rank: "上签" satisfies Rank,
              verse: verse.trim() || "这是你自己写下的弯路",
              title: title.trim(),
              description: description.trim(),
              duration,
              category,
              moods: ["lazy", "steady", "adventure"],
              company: ["alone", "child", "friend"],
              custom: true,
            })
            reset()
            onOpenChange(false)
          }}
        >
          <FieldGroup>
            <Field data-invalid={invalid && !title.trim() ? true : undefined}>
              <FieldLabel htmlFor="custom-title">签上的事</FieldLabel>
              <Input
                id="custom-title"
                value={title}
                maxLength={40}
                aria-invalid={invalid && !title.trim() ? true : undefined}
                onChange={(event) => setTitle(event.target.value)}
              />
              {invalid && !title.trim() ? (
                <FieldError>先写这件小事叫什么。</FieldError>
              ) : null}
            </Field>
            <Field
              data-invalid={invalid && !description.trim() ? true : undefined}
            >
              <FieldLabel htmlFor="custom-desc">怎么做</FieldLabel>
              <Textarea
                id="custom-desc"
                value={description}
                maxLength={120}
                aria-invalid={invalid && !description.trim() ? true : undefined}
                onChange={(event) => setDescription(event.target.value)}
              />
              {invalid && !description.trim() ? (
                <FieldError>用一句白话写清怎么做。</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="custom-verse">一句诗意的话，可空</FieldLabel>
              <Input
                id="custom-verse"
                value={verse}
                maxLength={28}
                onChange={(event) => setVerse(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>大概要多久</FieldLabel>
              <ToggleGroup
                type="single"
                value={String(duration)}
                variant="outline"
                spacing={2}
                className="flex flex-wrap"
                onValueChange={(value) => {
                  if (!value) return
                  setDuration(Number(value) as Duration)
                }}
              >
                {DURATIONS.map((item) => (
                  <ToggleGroupItem key={item} value={String(item)}>
                    {item} 分钟
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel>归在哪一类</FieldLabel>
              <ToggleGroup
                type="single"
                value={category}
                variant="outline"
                spacing={2}
                className="flex flex-wrap"
                onValueChange={(value) => {
                  if (!value) return
                  setCategory(value as Category)
                }}
              >
                {CATEGORIES.map((item) => (
                  <ToggleGroupItem key={item} value={item}>
                    {CATEGORY_LABEL[item]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit" className="h-11 w-full">
              放进签筒
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
