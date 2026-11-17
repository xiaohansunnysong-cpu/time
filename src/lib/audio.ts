let audioContext: AudioContext | null = null

function context(): AudioContext {
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) throw new Error("no audio")
    audioContext = new Ctx()
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume()
  }
  return audioContext
}

function tone(
  audio: AudioContext,
  frequency: number,
  when: number,
  duration: number,
  peak: number,
  type: OscillatorType
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, when)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(when)
  osc.stop(when + duration + 0.05)
}

export function playStickClicks() {
  const audio = context()
  const now = audio.currentTime
  for (let index = 0; index < 7; index += 1) {
    tone(
      audio,
      140 + ((index * 37) % 90),
      now + index * 0.11,
      0.08,
      0.04,
      "triangle"
    )
  }
}

export function playTempleBell() {
  const audio = context()
  const now = audio.currentTime
  const partials = [196, 293.7, 392, 587.3]
  partials.forEach((frequency, index) => {
    tone(audio, frequency, now, 2.8 + index * 0.35, 0.07 / (index + 1), "sine")
  })
}

export function playRitual() {
  try {
    playStickClicks()
    window.setTimeout(() => {
      try {
        playTempleBell()
      } catch {
        /* autoplay can fail after a delay */
      }
    }, 1400)
  } catch {
    /* sound is optional */
  }
}

export function playSoftBell() {
  try {
    playTempleBell()
  } catch {
    /* ignore */
  }
}
