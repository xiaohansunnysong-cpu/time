import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getClientId } from "@/lib/client"
import { API_BASE } from "@/lib/plaza"

type CommunitySlip = {
  id: string
  text: string
  createdAt: string
  drawCount: number
  completedCount: number
}

async function request(path: string, body?: unknown) {
  const response = await fetch(API_BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || "签筒暂时没有应声")
  return data
}

export function CommunitySlipBox() {
  const clientId = useRef(getClientId())
  const [slips, setSlips] = useState<CommunitySlip[]>([])
  const [draft, setDraft] = useState("")
  const [current, setCurrent] = useState<CommunitySlip | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showRecent, setShowRecent] = useState(false)

  async function refresh() {
    try {
      const data = await request("/api/community-slips")
      setSlips(data.slips)
    } catch (error) {
      toast(error instanceof Error ? error.message : "签池暂时没打开")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function publish() {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      const data = await request("/api/community-slips", {
        text: draft,
        clientId: clientId.current,
      })
      setSlips((currentSlips) =>
        [
          data.slip,
          ...currentSlips.filter((item) => item.id !== data.slip.id),
        ].slice(0, 30)
      )
      setDraft("")
      toast("你的签已放进大家的签筒")
    } catch (error) {
      toast(error instanceof Error ? error.message : "这支签没能放进签筒")
    } finally {
      setBusy(false)
    }
  }

  async function draw() {
    if (busy) return
    setBusy(true)
    setCompleted(false)
    try {
      const data = await request("/api/community-slips/draw", {
        clientId: clientId.current,
      })
      setCurrent(data.slip)
      setSlips((currentSlips) =>
        currentSlips.map((item) =>
          item.id === data.slip.id ? data.slip : item
        )
      )
    } catch (error) {
      toast(error instanceof Error ? error.message : "签筒暂时没有应声")
    } finally {
      setBusy(false)
    }
  }

  async function markComplete() {
    if (!current || busy || completed) return
    setBusy(true)
    try {
      const data = await request(
        "/api/community-slips/" + current.id + "/complete",
        { clientId: clientId.current }
      )
      const next = { ...current, completedCount: data.completedCount }
      setCurrent(next)
      setCompleted(true)
      setSlips((currentSlips) =>
        currentSlips.map((item) => (item.id === next.id ? next : item))
      )
      toast("完成打卡已记下")
    } catch (error) {
      toast(error instanceof Error ? error.message : "没能记下完成状态")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111522]/80 p-4 shadow-sm">
      <p className="text-xs tracking-[0.18em] text-[#e8cb72]">大家写的签</p>
      <h2 className="mt-1 font-heading text-2xl text-[#f1e8ce]">
        抽一件没做过的小事
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[#bdb6a4]">
        抽到别人的小愿望，试着把今天过得不一样一点。
      </p>

      <div className="mt-4 rounded-xl border border-[#d9b85f]/15 bg-black/15 p-3">
        {current ? (
          <div aria-live="polite">
            <p className="text-xs tracking-[0.2em] text-[#e8cb72]">
              你抽到了一支别人写的签
            </p>
            <p className="my-3 text-lg leading-relaxed break-words whitespace-pre-wrap text-[#f2ead8]">
              {current.text}
            </p>
            <p className="mb-3 text-xs text-[#989180]">
              被抽到 {current.drawCount} 次 · 已完成 {current.completedCount} 次
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || completed}
                onClick={() => void markComplete()}
                className="min-h-11"
              >
                {completed ? "已打卡，做得好" : "我做到了"}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void draw()}
                className="min-h-11"
              >
                再抽一支
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm leading-relaxed text-[#bdb6a4]">
              自己的签不会被自己抽到。抽到谁写的小事，就看这一刻的机缘。
            </p>
            <Button
              disabled={busy}
              onClick={() => void draw()}
              className="min-h-11 w-full sm:w-auto"
            >
              {busy ? "签筒转动中…" : "随机抽一支大家的签"}
            </Button>
          </div>
        )}
      </div>

      <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <summary className="min-h-10 cursor-pointer list-none py-2 text-sm font-medium text-[#e8cb72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8cb72]">
          写一件小事放进签筒
        </summary>
        <p className="mb-3 text-xs leading-relaxed text-[#bdb6a4]">
          其他人随机抽到后可以去做，完成后回来打卡。
        </p>
        <textarea
          aria-label="写一件想做却还没做过的小事"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={120}
          rows={3}
          placeholder="例如：坐一趟没坐过的公交，两站后下来走走。"
          className="w-full min-w-0 resize-y rounded-xl border border-[#d9b85f]/20 bg-black/20 p-3 text-base leading-relaxed text-[#f5eddb] placeholder:text-[#8f8a7e]"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs leading-relaxed text-[#938c7d]">
            安全、容易做到，不留联系方式 · {draft.length}/120
          </span>
          <Button
            disabled={!draft.trim() || busy}
            onClick={() => void publish()}
            className="min-h-11 bg-[#e8cb72] text-[#24170e]"
          >
            {busy ? "放进签筒…" : "写好，放进签筒"}
          </Button>
        </div>
      </details>

      <div className="mt-3 border-t border-white/10 pt-3">
        <button
          type="button"
          aria-expanded={showRecent}
          onClick={() => setShowRecent((value) => !value)}
          className="flex min-h-10 w-full items-center justify-between text-left text-sm font-semibold text-[#e8cb72]"
        >
          <span>最近放进签筒的小事</span>
          <span className="text-xs text-[#bdb6a4]">
            {showRecent ? "收起" : "展开"}
          </span>
        </button>
        {loading ? (
          <p className="mt-2 text-sm text-[#bdb6a4]">正在听签筒…</p>
        ) : null}
        {!loading && slips.length === 0 ? (
          <p className="mt-2 text-sm text-[#bdb6a4]">
            还没有人放签，写下第一支吧。
          </p>
        ) : null}
        {showRecent ? (
          <div className="mt-2 space-y-2">
            {slips.slice(0, 6).map((slip) => (
              <article
                key={slip.id}
                className="rounded-xl border border-[#d9b85f]/15 bg-white/[0.035] p-3"
              >
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-[#f2ead8]">
                  {slip.text}
                </p>
                <p className="mt-2 text-xs text-[#989180]">
                  被抽到 {slip.drawCount} 次 · 已完成 {slip.completedCount} 次
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
