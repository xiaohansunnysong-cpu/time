import type { Challenge, DayState, Settings, Story } from "@/lib/types"
import { emptyDay, rescheduleSurprise } from "@/lib/draw"
import { localDateKey } from "@/lib/format"
import { createSeen } from "@/lib/slip-pick"

const SETTINGS_KEY = "tbb.settings.v1"
const DAY_KEY = "tbb.day.v1"
const STORIES_KEY = "tbb.stories.v1"
const CUSTOM_KEY = "tbb.custom.v1"
const SEEN_KEY = "tbb.seen.v1"
const DB_NAME = "tbb"
const DB_STORE = "photos"

export const defaultSettings = (): Settings => ({
  surpriseEnabled: false,
  windowStart: "10:00",
  windowEnd: "20:00",
  sound: false,
  installHintDismissed: false,
})

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function loadSettings(): Settings {
  const fallback = defaultSettings()
  const value = readRaw(SETTINGS_KEY)
  if (!isRecord(value)) return fallback
  return {
    surpriseEnabled: value.surpriseEnabled === true,
    windowStart:
      typeof value.windowStart === "string"
        ? value.windowStart
        : fallback.windowStart,
    windowEnd:
      typeof value.windowEnd === "string"
        ? value.windowEnd
        : fallback.windowEnd,
    sound: value.sound === true,
    installHintDismissed: value.installHintDismissed === true,
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadDay(now = new Date()): DayState {
  const today = localDateKey(now)
  const value = readRaw(DAY_KEY)
  if (!isRecord(value) || value.date !== today || !Array.isArray(value.draws)) {
    return emptyDay(today)
  }
  return {
    date: today,
    draws: value.draws as DayState["draws"],
    acceptedDrawId:
      typeof value.acceptedDrawId === "string" ? value.acceptedDrawId : null,
    surpriseAt: typeof value.surpriseAt === "number" ? value.surpriseAt : null,
    surpriseNotified: value.surpriseNotified === true,
  }
}

export function saveDay(day: DayState) {
  localStorage.setItem(DAY_KEY, JSON.stringify(day))
}

export function loadStories(): Story[] {
  const value = readRaw(STORIES_KEY)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Story => {
    if (!isRecord(item)) return false
    return (
      typeof item.id === "string" &&
      typeof item.drawId === "string" &&
      typeof item.note === "string" &&
      typeof item.createdAt === "number" &&
      isRecord(item.slip)
    )
  })
}

export function saveStories(stories: Story[]) {
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories))
}

export function loadCustomChallenges(): Challenge[] {
  const value = readRaw(CUSTOM_KEY)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Challenge => {
    if (!isRecord(item)) return false
    return (
      typeof item.id === "string" &&
      item.custom === true &&
      typeof item.title === "string"
    )
  })
}

export function saveCustomChallenges(challenges: Challenge[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(challenges))
}

export function loadInitialDay(now = new Date()): DayState {
  const settings = loadSettings()
  const day = loadDay(now)
  return rescheduleSurprise(day, settings, now)
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("打不开本地相册"))
  })
}

export async function savePhoto(id: string, blob: Blob) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite")
    tx.objectStore(DB_STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("照片没有收下"))
  })
  db.close()
}

export async function loadPhoto(id: string): Promise<Blob | null> {
  const db = await openDb()
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly")
    const request = tx.objectStore(DB_STORE).get(id)
    request.onsuccess = () => {
      const result = request.result as unknown
      resolve(result instanceof Blob ? result : null)
    }
    request.onerror = () => reject(request.error ?? new Error("照片读不出来"))
  })
  db.close()
  return blob
}

export function loadSeen() {
  const bits = createSeen()
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return bits
    const binary = atob(raw)
    for (let index = 0; index < Math.min(binary.length, bits.length); index += 1) {
      bits[index] = binary.charCodeAt(index)
    }
  } catch {
    return createSeen()
  }
  return bits
}

export function saveSeen(bits: Uint8Array) {
  let binary = ""
  for (const value of bits) binary += String.fromCharCode(value)
  localStorage.setItem(SEEN_KEY, btoa(binary))
}

export async function deletePhoto(id: string) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite")
    tx.objectStore(DB_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("照片删不掉"))
  })
  db.close()
}
