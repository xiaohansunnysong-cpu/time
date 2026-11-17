import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getClientId } from "@/lib/client"
import { formatRelative, toChineseNumber } from "@/lib/format"
import { fetchPosts, reportPost, toggleLike, type PlazaPost } from "@/lib/plaza"
import { useApp } from "@/state/app-state"

function slipHeading(post: PlazaPost) {
  if (post.slipNumber <= 0) return "自拟签"
  return `第${toChineseNumber(post.slipNumber)}签`
}

function Plaque({
  post,
  now,
  onLike,
  onReport,
  armed,
  onArm,
}: {
  post: PlazaPost
  now: number
  onLike: () => void
  onReport: () => void
  armed: boolean
  onArm: () => void
}) {
  const lines = post.slipText.split("\n").map((line) => line.trim()).filter(Boolean)
  const verse = lines.length > 1 ? lines[0] : ""
  const body = lines.length > 1 ? lines.slice(1).join("\n") : post.slipText

  return (
    <article className="ema">
      <p className="text-xs tracking-[0.28em] text-[#8a5a22]">
        {post.nickname} · {slipHeading(post)}
      </p>
      {verse ? <p className="font-heading text-xl leading-snug">{verse}</p> : null}
      <p className="text-sm leading-relaxed whitespace-pre-line">{body}</p>
      <p className="text-sm leading-relaxed">{post.story}</p>
      <div className="flex items-center justify-between gap-2 pt-1">
        <time className="text-xs text-[#7a6248]" dateTime={post.createdAt}>
          {formatRelative(new Date(post.createdAt).getTime(), now)}
        </time>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="h-9 px-2 text-[#6b3a22]"
            aria-pressed={post.likedByMe}
            onClick={onLike}
          >
            {post.likedByMe ? "已同感" : "同感"} {post.likeCount}
          </Button>
          <Button
            variant="ghost"
            className="h-9 px-2 text-xs text-[#7a6248]"
            onClick={() => {
              if (!armed) {
                onArm()
                return
              }
              onReport()
            }}
          >
            {armed ? "确认举报" : "举报"}
          </Button>
        </div>
      </div>
    </article>
  )
}

export function PlazaScreen() {
  const { now } = useApp()
  const clientId = useRef(getClientId())
  const [posts, setPosts] = useState<PlazaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [armed, setArmed] = useState<string | null>(null)
  const cursorRef = useRef<string | null>(null)
  const doneRef = useRef(false)
  const loadingRef = useRef(false)
  const errorRef = useRef("")
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (reset: boolean) => {
    if (loadingRef.current) return
    if (!reset && (doneRef.current || errorRef.current)) return
    loadingRef.current = true
    setLoading(true)
    if (reset) {
      setError("")
      errorRef.current = ""
      doneRef.current = false
      cursorRef.current = null
    }
    try {
      const page = await fetchPosts(
        reset ? null : cursorRef.current,
        clientId.current,
        AbortSignal.timeout(60_000),
      )
      cursorRef.current = page.nextCursor
      doneRef.current = !page.nextCursor
      setPosts((current) => (reset ? page.posts : [...current, ...page.posts]))
    } catch (caught) {
      const message =
        caught instanceof Error && caught.name === "TimeoutError"
          ? "香火点得有点慢"
          : "香火还没点着"
      errorRef.current = message
      setError(message)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    loadingRef.current = true
    void (async () => {
      try {
        const page = await fetchPosts(null, clientId.current, controller.signal)
        if (cancelled) return
        cursorRef.current = page.nextCursor
        doneRef.current = !page.nextCursor
        errorRef.current = ""
        setPosts(page.posts)
        setError("")
      } catch (caught) {
        if (cancelled || (caught instanceof Error && caught.name === "AbortError")) return
        const message =
          caught instanceof Error && caught.name === "TimeoutError"
            ? "香火点得有点慢"
            : "香火还没点着"
        errorRef.current = message
        setError(message)
      } finally {
        loadingRef.current = false
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load(false)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [load, posts.length])

  const firstLoad = loading && posts.length === 0

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.42em] text-primary">时间盲盒</p>
        <h1 className="foil font-heading text-4xl">广场</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          别人做完签，把一小段故事挂在这里。像一排夜里的绘马。
        </p>
      </header>

      {firstLoad ? (
        <div className="incense-loader" role="status">
          <span className="candle candle-loader" aria-hidden />
          <p>香火正在点燃…</p>
          <p className="text-xs text-muted-foreground">广场有时要醒一会儿，求签不用等它。</p>
        </div>
      ) : null}

      {error && posts.length === 0 ? (
        <div className="incense-loader">
          <p>{error}</p>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              errorRef.current = ""
              void load(true)
            }}
          >
            再试一次
          </Button>
        </div>
      ) : null}

      <div className="plaza-wall">
        {posts.map((post) => (
          <Plaque
            key={post.id}
            post={post}
            now={now}
            armed={armed === post.id}
            onArm={() => setArmed(post.id)}
            onLike={() => {
              const liked = post.likedByMe
              setPosts((current) =>
                current.map((item) =>
                  item.id === post.id
                    ? {
                        ...item,
                        likedByMe: !liked,
                        likeCount: Math.max(0, item.likeCount + (liked ? -1 : 1)),
                      }
                    : item,
                ),
              )
              void toggleLike(post.id, clientId.current)
                .then((result) => {
                  setPosts((current) =>
                    current.map((item) =>
                      item.id === post.id
                        ? { ...item, likeCount: result.likeCount, likedByMe: result.likedByMe }
                        : item,
                    ),
                  )
                })
                .catch(() => {
                  setPosts((current) =>
                    current.map((item) =>
                      item.id === post.id
                        ? {
                            ...item,
                            likedByMe: liked,
                            likeCount: post.likeCount,
                          }
                        : item,
                    ),
                  )
                  toast("没能记下同感")
                })
            }}
            onReport={() => {
              setArmed(null)
              void reportPost(post.id, clientId.current)
                .then((result) => {
                  if (result.hidden) {
                    setPosts((current) => current.filter((item) => item.id !== post.id))
                  }
                  toast(result.hidden ? "这张牌子被收起来了" : "已记下这张举报")
                })
                .catch(() => toast("举报没送出去"))
            }}
          />
        ))}
      </div>

      {!firstLoad && !error && posts.length === 0 ? (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          墙上还空着。做完一签，可以把你的小故事挂上来。
        </p>
      ) : null}

      <div ref={sentinel} className="h-8">
        {loading && posts.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">还在翻牌子…</p>
        ) : null}
      </div>
    </div>
  )
}
