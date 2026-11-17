import { CalendarDays, Clock3 } from "lucide-react"

const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
const lunarDigits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
const almanacPrompts = [
  ["给生活加一段小插曲", "把喜欢的歌听到最后"],
  ["走一条没走过的路", "把惊喜留到以后"],
  ["给自己买一束花", "等心情完美才出发"],
  ["向重要的人问声好", "把小愿望藏起来"],
  ["试一杯新饮品", "忘记抬头看一眼天"],
  ["做一件想了很久的小事", "对自己说‘下次吧’"],
]

function lunarDayName(day: number) {
  if (day <= 10) return `初${lunarDigits[day] || "十"}`
  if (day < 20) return `十${lunarDigits[day - 10]}`
  if (day === 20) return "二十"
  if (day < 30) return `廿${lunarDigits[day - 20]}`
  return "三十"
}

export function MysticScene({ now }: { now: number }) {
  const date = new Date(now)
  const parts = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
    month: "long",
    day: "numeric",
  }).formatToParts(date)
  const lunarMonth = parts.find((part) => part.type === "month")?.value || "农历"
  const lunarDay = Number(parts.find((part) => part.type === "day")?.value || 1)
  const hour = date.getHours()
  const branch = earthlyBranches[Math.floor((hour + 1) / 2) % 12]
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(date)
  const [宜, 忌] = almanacPrompts[Math.floor(date.getTime() / 86_400_000) % almanacPrompts.length]

  return (
    <section className="mystic-scene" aria-label="今日寺庙时辰与趣味黄历">
      <img
        className="mystic-scene-image"
        src="/images/mystic-temple.jpg"
        alt="云雾环绕的中国古寺，殿内供奉观音，前景香炉升起袅袅香烟，竹叶与飞燕掠过天际。"
        fetchPriority="high"
      />
      <div className="mystic-scene-shade" aria-hidden="true" />
      <div className="mystic-scene-topline">
        <span className="scene-brand">时间盲盒 · 山门已开</span>
        <span className="scene-time"><Clock3 size={14} aria-hidden="true" />{branch}时 {time}</span>
      </div>
      <div className="mystic-scene-bottom">
        <p className="scene-title">一炷香的时间，遇见今日机缘</p>
        <div className="almanac-panel">
          <div className="almanac-heading">
            <span><CalendarDays size={15} aria-hidden="true" /> 黄道吉日 · 趣味黄历</span>
            <span>{lunarMonth}{lunarDayName(lunarDay)} · {weekday}</span>
          </div>
          <div className="almanac-guidance">
            <p><b>宜</b>{宜}</p>
            <p><b>忌</b>{忌}</p>
          </div>
          <p className="almanac-note">传统日历氛围灵感 · 趣味内容，不作择日依据</p>
        </div>
      </div>
    </section>
  )
}
