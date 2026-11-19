import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/state/app-state"

const STEPS = [
  "拉开窗帘，喝几口水。今天先从醒来开始。",
  "听完一首喜欢的歌，留意它带给你的第一个画面。",
  "到门外或窗边待五分钟，看看今天的天色。",
  "给一个让你安心的人发一句简单问候。",
  "整理桌面的一小块，只整理巴掌大的地方。",
  "慢慢走五分钟，走到哪里都可以再回来。",
  "给自己准备一样简单、喜欢吃的东西。",
  "做一件曾经喜欢的小事，哪怕只做两分钟。",
  "找一本手边的书，读两页就可以停。",
  "把一件拖着的小事缩小到第一步，先做那一步。",
  "给自己泡杯热饮，坐下来好好喝完几口。",
  "到户外走一小段，找一种你以前没注意的颜色。",
  "给熟悉的人分享一首歌，不用解释太多。",
  "写下今天一件‘勉强也做到了’的小事。",
  "换一条熟悉路线上的小路，安全地走十分钟。",
  "做一顿简单的饭，或认真吃完一顿饭。",
  "给一个亲近的人发消息：最近有空一起散步吗？",
  "找一张旧照片，回想当时一个温柔的小细节。",
  "听听周围的声音一分钟，不需要改变任何事。",
  "把一个小心愿写下来；可以自己留着，也可以匿名挂上树。",
  "做一件让身体舒服一点的小事：伸展、洗澡或换件软衣服。",
  "给自己留十分钟不安排任务的时间。",
  "去附近看看一处平时路过却没停下来的地方。",
  "对自己说一句具体的话：今天我做到了____。",
  "联系一个你信任的人，告诉TA你最近真实的状态。",
  "重新做一件第一周做过的小事，看看感受有没有不同。",
  "写下最近一个小小的期待，不用很远大。",
  "回看这段时间：挑一件想继续保留的小习惯。",
]

const MOODS = ["有点低落", "普通的一天", "有一点亮"]
const KEY = "timeblindbox.care28.v1"
type Progress = { startedAt: number; done: number[]; moods: Record<number, string> }

function readProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Progress) : null
  } catch {
    return null
  }
}

export function DailyCareCard() {
  const { now, setView } = useApp()
  const [progress, setProgress] = useState<Progress | null>(null)
  useEffect(() => setProgress(readProgress()), [])

  const day = useMemo(() => {
    if (!progress) return 1
    return Math.min(28, Math.max(1, Math.floor((now - progress.startedAt) / 86_400_000) + 1))
  }, [now, progress])

  function save(next: Progress) {
    localStorage.setItem(KEY, JSON.stringify(next))
    setProgress(next)
  }

  const todayMood = progress?.moods[day]
  const completed = progress?.done.includes(day) ?? false

  return (
    <section className="rounded-2xl border border-[#e8cb72]/20 bg-[#111522]/90 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-[#e8cb72]">28天 · 轻轻陪自己</p>
          <h2 className="mt-1 font-heading text-xl text-[#f6edd9]">每天，只做一小步</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#c9bea7]">
          {progress ? `${progress.done.length}/28` : "随时开始"}
        </span>
      </div>

      {!progress ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#bdb6a4]">不打卡惩罚，不要求每天完美。今天愿意开始，就已经算一步。</p>
          <button onClick={() => save({ startedAt: Date.now(), done: [], moods: {} })} className="mt-4 min-h-11 w-full rounded-xl bg-[#e8cb72] px-4 font-medium text-[#24170e]">开始这段小旅程</button>
        </>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-[#d7c99f]">第 {day} 天的小任务</p>
            <p className="mt-1 leading-relaxed text-[#f5eddb]">{STEPS[day - 1]}</p>
            <button
              disabled={completed}
              onClick={() => save({ ...progress, done: [...progress.done, day] })}
              className="mt-3 min-h-10 rounded-full bg-[#e8cb72] px-4 text-sm font-medium text-[#24170e] disabled:opacity-60"
            >{completed ? "今天这一步，已经记下" : "我做到了"}</button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-[#d8d0bd]">此刻的心情，更像哪一个？</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {MOODS.map((mood) => (
                <button key={mood} onClick={() => save({ ...progress, moods: { ...progress.moods, [day]: mood } })} aria-pressed={todayMood === mood} className={`min-h-10 rounded-xl border px-1 text-xs ${todayMood === mood ? "border-[#e8cb72] bg-[#e8cb72]/15 text-[#f4d98f]" : "border-white/10 text-[#bdb6a4]"}`}>{mood}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#989180]">
            <span>记录只保存在这台设备</span>
            <button className="min-h-10 px-2 text-[#e8cb72]" onClick={() => setView("plaza")}>去心愿树看看 →</button>
          </div>
        </>
      )}
      <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-[#898577]">这是日常陪伴，不是心理治疗；如果情绪持续影响生活，请联系专业人员。</p>
    </section>
  )
}
