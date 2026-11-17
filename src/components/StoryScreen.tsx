import { useMemo, useState } from "react"

import { HangPlaque } from "@/components/HangPlaque"
import { ConfirmDelete } from "@/components/StorySheet"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CATEGORY_LABEL,
  DURATION_LABEL,
  formatClock,
  formatStoryDate,
  localDateKey,
  slipLabel,
} from "@/lib/format"
import type { Story } from "@/lib/types"
import { useApp } from "@/state/app-state"
import { usePhotoUrl } from "@/components/use-photo"

function StoryPhoto({ id, alt }: { id?: string; alt: string }) {
  const url = usePhotoUrl(id)
  if (!id) return null
  if (!url) {
    return <div className="h-40 w-full rounded-lg bg-muted" />
  }
  return (
    <img
      src={url}
      alt={alt}
      className="max-h-72 w-full rounded-lg object-cover"
    />
  )
}

function groupsOf(stories: Story[], today: Date) {
  const sorted = [...stories].sort((a, b) => b.createdAt - a.createdAt)
  const groups = new Map<string, Story[]>()
  for (const story of sorted) {
    const key = localDateKey(new Date(story.createdAt))
    const list = groups.get(key) ?? []
    list.push(story)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([date, items]) => ({
    date,
    label: formatStoryDate(date, today),
    items,
  }))
}

export function StoryScreen() {
  const { stories, now, removeStory, setView } = useApp()
  const groups = useMemo(() => groupsOf(stories, new Date(now)), [stories, now])
  const withPhotos = stories.filter((story) => story.photoId)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [hanging, setHanging] = useState<Story | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.42em] text-primary">时间盲盒</p>
        <h1 className="foil font-heading text-4xl">缘分日志</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          做过的小事，留两句在这里。它只待在这台设备上。
        </p>
      </header>

      {stories.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有记下的缘分</EmptyTitle>
            <EmptyDescription>
              求一签，去做，再回来写两句。没有照片也没关系。
            </EmptyDescription>
          </EmptyHeader>
          <Button className="h-11" onClick={() => setView("draw")}>
            去求签
          </Button>
        </Empty>
      ) : (
        <Tabs defaultValue="timeline">
          <TabsList className="w-full">
            <TabsTrigger value="timeline">时间线</TabsTrigger>
            <TabsTrigger value="gallery">画廊</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="flex flex-col gap-6 pt-4">
            {groups.map((group) => (
              <section key={group.date} className="flex flex-col gap-3">
                <h2 className="font-heading text-lg">{group.label}</h2>
                {group.items.map((story) => (
                  <Card key={story.id}>
                    <CardHeader>
                      <CardTitle>{story.slip.title}</CardTitle>
                      <CardDescription>
                        {slipLabel(story.slip)} · {story.slip.verse}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <StoryPhoto id={story.photoId} alt={story.slip.title} />
                      <p className="leading-relaxed">{story.note}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {CATEGORY_LABEL[story.slip.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {DURATION_LABEL[story.slip.duration]} ·{" "}
                          {formatClock(story.createdAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          className="h-10 px-2 text-primary"
                          onClick={() => setHanging(story)}
                        >
                          完成后，把小故事挂到广场
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-10 self-start"
                          onClick={() => setPendingDelete(story.id)}
                        >
                          删去
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            ))}
          </TabsContent>
          <TabsContent value="gallery" className="pt-4">
            {withPhotos.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>画廊还空着</EmptyTitle>
                  <EmptyDescription>
                    记下缘分时可以捎一张照片，它会出现在这里。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {withPhotos.map((story) => (
                  <GalleryTile key={story.id} story={story} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <ConfirmDelete
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) void removeStory(pendingDelete)
        }}
      />
      {hanging ? (
        <HangPlaque
          open
          onOpenChange={(open) => {
            if (!open) setHanging(null)
          }}
          slip={hanging.slip}
          initialStory={hanging.note}
        />
      ) : null}
    </div>
  )
}

function GalleryTile({ story }: { story: Story }) {
  const url = usePhotoUrl(story.photoId)
  return (
    <figure className="flex flex-col gap-1">
      {url ? (
        <img
          src={url}
          alt={story.slip.title}
          className="aspect-square w-full rounded-lg object-cover"
        />
      ) : (
        <div className="aspect-square w-full rounded-lg bg-muted" />
      )}
      <figcaption className="truncate text-xs text-muted-foreground">
        {story.slip.title}
      </figcaption>
    </figure>
  )
}
