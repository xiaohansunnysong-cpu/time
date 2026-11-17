import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { playRitual, playSoftBell } from "@/lib/audio"
import {
  canDraw,
  emptyDay,
  rescheduleSurprise,
  surpriseIsReady,
  toSlip,
} from "@/lib/draw"
import { pickSlipNumber, SLIP_TOTAL } from "@/lib/slip-pick"
import { loadSlip, storedToSnapshot } from "@/lib/slips"
import { localDateKey } from "@/lib/format"
import { fileToJpeg } from "@/lib/images"
import {
  deletePhoto,
  loadCustomChallenges,
  loadInitialDay,
  loadSeen,
  loadSettings,
  loadStories,
  saveCustomChallenges,
  saveDay,
  savePhoto,
  saveSeen,
  saveSettings,
  saveStories,
} from "@/lib/storage"
import type {
  Challenge,
  DayState,
  Settings,
  SlipSnapshot,
  Story,
  View,
} from "@/lib/types"

type RitualState = { slip: SlipSnapshot } | null

type AppContextValue = {
  settings: Settings
  day: DayState
  stories: Story[]
  custom: Challenge[]
  now: number
  view: View
  ritual: RitualState
  surpriseOpen: boolean
  setView: (view: View) => void
  setSurpriseOpen: (open: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
  requestDraw: () => void
  endRitual: () => void
  acceptDraw: (drawId: string) => void
  saveStory: (input: {
    drawId: string
    note: string
    file?: File | null
  }) => Promise<boolean>
  removeStory: (id: string) => Promise<void>
  addCustom: (challenge: Challenge) => void
  removeCustom: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function parseView(hash: string): View {
  if (hash === "#plaza") return "plaza"
  if (hash === "#log") return "log"
  if (hash === "#mine") return "mine"
  return "draw"
}

function hashFor(view: View): string {
  if (view === "plaza") return "#plaza"
  if (view === "log") return "#log"
  if (view === "mine") return "#mine"
  return "#draw"
}

function notifyReady() {
  try {
    const notification = new Notification("时间盲盒", {
      body: "签筒温了。今日还可以求一签。",
      icon: "/icons/icon-192.png",
      lang: "zh-CN",
    })
    notification.onclick = () => {
      window.focus()
      window.location.hash = "#draw"
    }
  } catch {
    /* notification is optional */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [day, setDay] = useState<DayState>(() => {
    const initial = loadInitialDay(new Date())
    saveDay(initial)
    return initial
  })
  const [stories, setStories] = useState<Story[]>(() => loadStories())
  const [custom, setCustom] = useState<Challenge[]>(() =>
    loadCustomChallenges()
  )
  const [now, setNow] = useState(() => Date.now())
  const [view, setViewState] = useState<View>(() =>
    parseView(window.location.hash)
  )
  const [ritual, setRitual] = useState<RitualState>(null)
  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const settingsRef = useRef(settings)
  const dayRef = useRef(day)
  const drawing = useRef(false)

  useEffect(() => {
    settingsRef.current = settings
    dayRef.current = day
  }, [settings, day])

  const setView = useCallback((next: View) => {
    const hash = hashFor(next)
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
    setViewState(next)
  }, [])

  useEffect(() => {
    const onHash = () => setViewState(parseView(window.location.hash))
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    const syncClock = () => {
      const nextNow = Date.now()
      setNow(nextNow)
      const settingsNow = settingsRef.current
      const current = dayRef.current
      const key = localDateKey(new Date(nextNow))
      let next =
        current.date === key
          ? current
          : rescheduleSurprise(emptyDay(key), settingsNow, new Date(nextNow))
      const shouldNotify =
        surpriseIsReady(next, settingsNow, nextNow) &&
        !next.surpriseNotified &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      if (shouldNotify) {
        next = { ...next, surpriseNotified: true }
        notifyReady()
      }
      if (next !== current) {
        dayRef.current = next
        saveDay(next)
        setDay(next)
      }
    }

    syncClock()
    const id = window.setInterval(syncClock, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (
      !settings.surpriseEnabled ||
      day.surpriseAt == null ||
      day.draws.length > 0
    ) {
      return
    }
    const delay = day.surpriseAt - Date.now()
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return
    const timer = window.setTimeout(() => {
      setNow(Date.now())
      if (settingsRef.current.sound && dayRef.current.draws.length === 0) {
        playSoftBell()
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [day.draws.length, day.surpriseAt, settings.surpriseEnabled])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveSettings(next)
      if (
        "surpriseEnabled" in patch ||
        "windowStart" in patch ||
        "windowEnd" in patch
      ) {
        setDay((currentDay) => {
          const rescheduled = rescheduleSurprise(currentDay, next, new Date())
          saveDay(rescheduled)
          dayRef.current = rescheduled
          return rescheduled
        })
      }
      return next
    })
  }, [])

  const requestDraw = useCallback(() => {
    if (drawing.current) return
    const currentDay = dayRef.current
    if (!canDraw(currentDay)) {
      toast("今日机缘已尽，明日再来")
      return
    }
    drawing.current = true
    void (async () => {
      try {
        const freshCustom = custom.filter(
          (challenge) =>
            !currentDay.draws.some(
              (item) => item.slip.challengeId === challenge.id
            )
        )
        const useCustom = freshCustom.length > 0 && Math.random() < 1 / 3
        const slip = useCustom
          ? toSlip(freshCustom[Math.floor(Math.random() * freshCustom.length)]!)
          : await (async () => {
              const todayNumbers = currentDay.draws
                .map((item) => (item.slip.custom ? 0 : item.slip.number))
                .filter((number) => number > 0)
              const seen = loadSeen()
              const number = pickSlipNumber(seen, SLIP_TOTAL, todayNumbers)
              const stored = await loadSlip(number)
              saveSeen(seen)
              return storedToSnapshot(stored)
            })()
        if (!canDraw(dayRef.current)) {
          drawing.current = false
          return
        }
        const item = {
          id: crypto.randomUUID(),
          at: Date.now(),
          slip,
        }
        const nextDay: DayState = {
          ...dayRef.current,
          draws: [...dayRef.current.draws, item],
          acceptedDrawId: null,
        }
        dayRef.current = nextDay
        setDay(nextDay)
        saveDay(nextDay)
        setRitual({ slip })
        if (settingsRef.current.sound) playRitual()
      } catch {
        drawing.current = false
        toast("签筒一时没应声，再试一次")
      }
    })()
  }, [custom])

  const endRitual = useCallback(() => {
    drawing.current = false
    setRitual(null)
  }, [])

  const acceptDraw = useCallback((drawId: string) => {
    setDay((current) => {
      if (!current.draws.some((item) => item.id === drawId)) return current
      const next = { ...current, acceptedDrawId: drawId }
      dayRef.current = next
      saveDay(next)
      return next
    })
  }, [])

  const saveStory = useCallback(
    async (input: { drawId: string; note: string; file?: File | null }) => {
      const note = input.note.trim()
      if (!note) {
        toast("写两句再收下")
        return false
      }
      const current = dayRef.current
      const draw = current.draws.find((item) => item.id === input.drawId)
      if (!draw || current.acceptedDrawId !== input.drawId) {
        toast("先收下这签，再记缘")
        return false
      }
      let photoId: string | undefined
      if (input.file) {
        try {
          const blob = await fileToJpeg(input.file)
          photoId = crypto.randomUUID()
          await savePhoto(photoId, blob)
        } catch {
          toast("照片没能收下，文字还是可以记")
        }
      }
      const story: Story = {
        id: crypto.randomUUID(),
        drawId: draw.id,
        slip: draw.slip,
        note,
        photoId,
        createdAt: Date.now(),
      }
      setStories((currentStories) => {
        if (currentStories.some((item) => item.drawId === input.drawId)) {
          return currentStories
        }
        const next = [story, ...currentStories]
        saveStories(next)
        return next
      })
      toast("这则缘分收好了")
      return true
    },
    []
  )

  const removeStory = useCallback(async (id: string) => {
    let photoId: string | undefined
    setStories((current) => {
      photoId = current.find((story) => story.id === id)?.photoId
      const next = current.filter((story) => story.id !== id)
      saveStories(next)
      return next
    })
    if (photoId) {
      try {
        await deletePhoto(photoId)
      } catch {
        /* the note is already gone */
      }
    }
  }, [])

  const addCustom = useCallback((challenge: Challenge) => {
    setCustom((current) => {
      const next = [challenge, ...current]
      saveCustomChallenges(next)
      return next
    })
    toast("这支签已放进签筒")
  }, [])

  const removeCustom = useCallback((id: string) => {
    setCustom((current) => {
      const next = current.filter((challenge) => challenge.id !== id)
      saveCustomChallenges(next)
      return next
    })
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      day,
      stories,
      custom,
      now,
      view,
      ritual,
      surpriseOpen,
      setView,
      setSurpriseOpen,
      updateSettings,
      requestDraw,
      endRitual,
      acceptDraw,
      saveStory,
      removeStory,
      addCustom,
      removeCustom,
    }),
    [
      settings,
      day,
      stories,
      custom,
      now,
      view,
      ritual,
      surpriseOpen,
      setView,
      updateSettings,
      requestDraw,
      endRitual,
      acceptDraw,
      saveStory,
      removeStory,
      addCustom,
      removeCustom,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error("useApp must be used within AppProvider")
  return value
}
