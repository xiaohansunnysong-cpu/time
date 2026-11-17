import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  listPosts,
  plazaSlipLabel,
  relativeTime,
  reportPost,
  toggleLike,
  type PlazaPost,
} from "@/lib/plaza"
import { useApp } from "@/state/app-state"

export function PlazaScreen() {
  const { now, setView } = useApp()
  const [posts, setPosts] = useState<PlazaPost[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const sentinel = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    void listPosts(null, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return
        setPosts(page.posts)
        setCursor(page.nextCursor)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message =
          reason instanceof Error ? reason.message : "广场暂时没有回应"
        if (message === "已取消") return
        setError(message)
        setLoading(false)
      })
    return () => controller.abort()
  }, [reloadKey])

  const loadMore = useCallback(() => {
    if (!cursor || loading || loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    setMoreError(null)
    void listPosts(cursor)
      .then((page) => {
        setPosts((current) => {
          const seen = new Set(current.map((post) => post.id))
          return [
            ...current,
            ...page.posts.filter((post) => !seen.has(post.id)),
          ]
        })
        setCursor(page.nextCursor)
      })
      .catch((reason: unknown) => {
        const message =
          reason instanceof Error ? reason.message : "再往下翻时没应声"
        setMoreError(message)
      })
      .finally(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      })
  }, [cursor, loading])

  useEffect(() => {
    const node = sentinel.current
    if (!node || !cursor || error) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [cursor, error, loadMore])

  async function onLike(post: PlazaPost) {
    if (busyId) return
    setBusyId(post.id)
    try {
      const result = await toggleLike(post.id)
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, liked: result.liked, likeCount: result.likeCount }
            : item
        )
      )
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "同感没送出去"
      toast(
        message === "香火还没点着" ? "香火正在点燃…过一会儿再点同感" : message
      )
    } finally {
      setBusyId(null)
    }
  }

  async function onReport(id: string) {
    if (busyId) return
    setBusyId(id)
    try {
      const result = await reportPost(id)
      if (result.hidden) {
        setPosts((current) => current.filter((post) => post.id !== id))
        toast("这则故事被收起来了")
      } else {
        toast("举报已记下")
      }
      setConfirming(null)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "举报没送出去"
      toast(message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.42em] text-primary">时间盲盒</p>
        <h1 className="font-heading text-3xl">广场</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          别人做完一签，把小故事挂在这里。没有账号，称呼是自己起的。
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-heading text-xl text-primary">香火正在点燃…</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            免费的香火有时要醒一会儿。求签还在本地，不受影响。
          </p>
        </div>
      ) : null}

      {!loading && error ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>广场暂时没应声</EmptyTitle>
            <EmptyDescription>
              {error === "香火还没点着"
                ? "香火正在点燃…过一会儿再来。求签不受影响。"
                : `${error} 求签不受影响。`}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="h-11"
            onClick={() => {
              setPosts([])
              setCursor(null)
              setError(null)
              setMoreError(null)
              setLoading(true)
              setReloadKey((key) => key + 1)
            }}
          >
            再试一次
          </Button>
        </Empty>
      ) : null}

      {!loading && !error && posts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>广场还静着</EmptyTitle>
            <EmptyDescription>
              做完一签，可以把小故事挂上来。第一炷香，也许就是你的。
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => setView("draw")}
          >
            回去求签
          </Button>
        </Empty>
      ) : null}

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="slip-paper relative overflow-hidden rounded-sm px-5 py-5 shadow-xl"
          >
            <div className="slip-edge" aria-hidden />
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-lg">{post.nickname}</h2>
                <p className="shrink-0 text-xs tracking-[0.2em] text-temple">
                  {plazaSlipLabel(post.slipNumber)}
                </p>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80">
                {post.slipText}
              </p>
              <div className="slip-rule" />
              <p className="font-serif text-base leading-relaxed">
                {post.story}
              </p>
              <div className="flex items-center justify-between gap-2">
                <time
                  dateTime={post.createdAt}
                  className="text-xs tracking-wide opacity-70"
                >
                  {relativeTime(post.createdAt, now)}
                </time>
                <div className="flex items-center gap-3">
                  {confirming === post.id ? (
                    <button
                      type="button"
                      className="text-xs text-destructive"
                      disabled={busyId === post.id}
                      onClick={() => void onReport(post.id)}
                    >
                      确定举报
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs opacity-60"
                      onClick={() => setConfirming(post.id)}
                    >
                      举报
                    </button>
                  )}
                  <button
                    type="button"
                    className={
                      post.liked
                        ? "text-sm font-medium text-temple"
                        : "text-sm text-temple/80"
                    }
                    aria-pressed={post.liked}
                    disabled={busyId === post.id}
                    onClick={() => void onLike(post)}
                  >
                    同感 {post.likeCount}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {posts.length > 0 ? (
        <div ref={sentinel} className="flex flex-col items-center gap-2 py-2">
          {loadingMore ? (
            <p className="text-sm text-primary">香火正在点燃…</p>
          ) : null}
          {moreError ? (
            <Button variant="outline" className="h-10" onClick={loadMore}>
              再试着往下翻
            </Button>
          ) : null}
          {!cursor && !loadingMore ? (
            <p className="text-xs tracking-[0.2em] text-muted-foreground">
              到底了
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
