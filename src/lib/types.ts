export const DURATIONS = [5, 15, 30, 60] as const
export type Duration = (typeof DURATIONS)[number]

export const MOODS = ["lazy", "steady", "adventure"] as const
export type Mood = (typeof MOODS)[number]

export const COMPANIES = ["alone", "child", "friend"] as const
export type Company = (typeof COMPANIES)[number]

export const CATEGORIES = [
  "city",
  "kindness",
  "sense",
  "create",
  "family",
  "slow",
  "food",
  "nature",
  "music",
  "book",
  "photo",
  "memory",
  "friend",
  "home",
] as const
export type Category = (typeof CATEGORIES)[number]

export const RANKS = ["上上签", "上签", "中签"] as const
export type Rank = (typeof RANKS)[number]

export const DAILY_DRAW_LIMIT = 3

export type Challenge = {
  id: string
  number: number
  rank: Rank
  verse: string
  title: string
  description: string
  duration: Duration
  category: Category
  moods: Mood[]
  company: Company[]
  custom?: boolean
}

export type SlipSnapshot = {
  challengeId: string
  number: number
  rank: Rank
  verse: string
  title: string
  description: string
  duration: Duration
  category: Category
  custom?: boolean
}

export type Draw = {
  id: string
  at: number
  slip: SlipSnapshot
}

export type DayState = {
  date: string
  draws: Draw[]
  acceptedDrawId: string | null
  surpriseAt: number | null
  surpriseNotified: boolean
}

export type Story = {
  id: string
  drawId: string
  slip: SlipSnapshot
  note: string
  photoId?: string
  createdAt: number
}

export type Settings = {
  surpriseEnabled: boolean
  windowStart: string
  windowEnd: string
  sound: boolean
  installHintDismissed: boolean
}

export type View = "draw" | "log" | "mine"
