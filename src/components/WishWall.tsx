import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getClientId } from "@/lib/client"
import { API_BASE } from "@/lib/plaza"

type Wish = { id: string; text: string; status: "open" | "claimed" | "fulfilled"; claimedByMe: boolean; source?: "starter" | "community" }

const WISH_IDEAS = [
  "希望有人推荐一首适合散步时听的歌。",
  "想找个人一起去看一次海边日落。",
  "希望有人告诉我，附近哪家面包店最值得试。",
  "想学会做一道简单又好吃的新菜。",
  "希望有人陪我逛一次花市，帮我挑一枝花。",
  "想找个人交换一本读完后还会想起的书。",
]

async function call(path: string, body?: unknown) {
  const response = await fetch(API_BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || "心愿墙暂时没有应声")
  return data
}

export function WishWall() {
  const clientId = useRef(getClientId())
  const [wishes, setWishes] = useState<Wish[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)

  async function refresh() {
    try {
      const data = await call("/api/wishes?clientId=" + encodeURIComponent(clientId.current))
      setWishes(data.wishes)
      setSelectedWish(current => current ? data.wishes.find((wish: Wish) => wish.id === current.id) ?? null : null)
    } catch (e) {
      toast(e instanceof Error ? e.message : "心愿墙暂时安静")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  async function publish() {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      await call("/api/wishes", { text: draft, clientId: clientId.current })
      setDraft("")
      toast("心愿已经挂上树了")
      await refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : "没有挂上，再试一次")
    } finally {
      setBusy(false)
    }
  }

  async function act(id: string, action: "claim" | "fulfill") {
    try {
      await call("/api/wishes/" + id + "/" + action, { clientId: clientId.current })
      toast(action === "claim" ? "你认领了这份心愿" : "这份心愿已还愿")
      await refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : "这次没有成功")
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-[#d9b85f]/30 bg-[#111522]/90 p-3 sm:p-4">
      <p className="text-xs tracking-[0.3em] text-[#e8cb72]">广场 · 心愿树</p>
      <h2 className="mt-1 font-heading text-2xl text-[#f1e8ce]">把一个愿望挂上去</h2>
      <p className="my-3 text-sm leading-relaxed text-[#bdb6a4]">匿名写下一个小愿望。看到的人可以认领，做到了再回来还愿。</p>
      <textarea
        aria-label="写下一个心愿"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        maxLength={120}
        rows={2}
        placeholder="比如：希望有人陪我去看一次海边日落"
        className="w-full min-w-0 resize-none rounded-xl border border-[#d9b85f]/25 bg-black/20 p-3 text-base text-[#f5eddb] placeholder:text-[#8f8a7e]"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-[#938c7d]">不留电话、地址等私人信息 · {draft.length}/120</span>
        <Button disabled={!draft.trim() || busy} onClick={() => void publish()} className="min-h-11 bg-[#e8cb72] text-[#24170e]">
          {busy ? "挂愿中…" : "挂上心愿"}
        </Button>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-[#e8cb72]">还没想到写什么？</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#989180]">点一个小愿望放进输入框，修改成你的话再挂上去。</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WISH_IDEAS.map(idea => (
            <button
              key={idea}
              type="button"
              onClick={() => setDraft(idea)}
              className="min-h-10 rounded-full border border-[#d9b85f]/20 bg-white/[0.04] px-3 py-2 text-left text-xs leading-relaxed text-[#e7dcc2] transition-colors hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8cb72]"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      <h3 className="mb-3 mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-[#e8cb72]">树上的心愿</h3>
      {loading ? <p className="text-sm text-[#bdb6a4]">正在听风…</p> : null}
      {!loading && wishes.length === 0 ? <p className="text-sm text-[#bdb6a4]">树上还空着，等第一份心愿来。</p> : null}
      <div className="space-y-3">
        {wishes.map(w => (
          <article key={w.id} className="min-w-0 rounded-xl border border-[#d9b85f]/15 bg-white/[0.035] p-3">
            <button
              type="button"
              onClick={() => setSelectedWish(w)}
              aria-label="打开这份心愿"
              className="block min-h-11 w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8cb72]"
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#f2ead8]">{w.text}</p>
              <span className="mt-2 inline-block text-xs text-[#e8cb72]">点开查看并回应 ›</span>
            </button>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#989180]">{w.source === "starter" ? "广场发起" : "匿名心愿"} · {w.status === "fulfilled" ? "✨ 已还愿" : w.status === "claimed" ? (w.claimedByMe ? "你已认领" : "有人正在帮忙") : "等待有缘人"}</span>
              <span className="sr-only">{w.status === "fulfilled" ? "✨ 已还愿" : w.status === "claimed" ? (w.claimedByMe ? "你已认领" : "有人正在帮忙") : "等待有缘人"}</span>
              {w.status === "open" ? <Button variant="outline" className="min-h-10" onClick={() => void act(w.id, "claim")}>我来帮你</Button> : null}
              {w.status === "claimed" && w.claimedByMe ? <Button variant="outline" className="min-h-10" onClick={() => void act(w.id, "fulfill")}>我已完成</Button> : null}
            </div>
          </article>
        ))}
      </div>
      {selectedWish ? (
        <Dialog open onOpenChange={open => { if (!open) setSelectedWish(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>这份小心愿</DialogTitle>
              <DialogDescription>愿意的话，可以帮它往前走一步。</DialogDescription>
            </DialogHeader>
            <p className="whitespace-pre-wrap break-words rounded-xl bg-white/[0.04] p-4 text-base leading-relaxed text-[#f2ead8]">{selectedWish.text}</p>
            <p className="text-sm text-muted-foreground">
              {selectedWish.status === "fulfilled" ? "✨ 已经实现" : selectedWish.status === "claimed" ? (selectedWish.claimedByMe ? "你已经认领，可以完成后回来还愿" : "已经有一位有缘人正在帮忙") : "等待有缘人"}
            </p>
            {selectedWish.status === "open" ? (
              <Button className="min-h-11 w-full" onClick={() => void act(selectedWish.id, "claim")}>我来帮你</Button>
            ) : null}
            {selectedWish.status === "claimed" && selectedWish.claimedByMe ? (
              <Button className="min-h-11 w-full" onClick={() => void act(selectedWish.id, "fulfill")}>我已完成</Button>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  )
}
