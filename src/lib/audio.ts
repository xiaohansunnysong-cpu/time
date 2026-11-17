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
  type: OscillatorType,
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

function woodBlock(audio: AudioContext, when: number) {
  const duration = 0.09
  const length = Math.max(1, Math.floor(audio.sampleRate * duration))
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) {
    const decay = Math.exp(-index / (audio.sampleRate * 0.012))
    data[index] = (Math.random() * 2 - 1) * decay
  }
  const source = audio.createBufferSource()
  source.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.setValueAtTime(240 + Math.random() * 80, when)
  filter.Q.setValueAtTime(4, when)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(0.16, when + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)
  source.start(when)
  source.stop(when + duration)
}

export function playStickClicks() {
  const audio = context()
  const now = audio.currentTime
  for (let index = 0; index < 5; index += 1) {
    woodBlock(audio, now + index * 0.13)
  }
}

export function playTempleBell(at = 0) {
  const audio = context()
  const now = audio.currentTime + at
  const partials = [196, 293.7, 392, 587.3]
  partials.forEach((frequency, index) => {
    tone(audio, frequency, now, 2.4 + index * 0.25, 0.05 / (index + 1), "sine")
  })
}

export function playRitual() {
  try {
    playStickClicks()
    playTempleBell(1.15)
  } catch {
    /* sound is optional and stays silent if the browser blocks it */
  }
}

export function playSoftBell() {
  try {
    playTempleBell()
  } catch {
    /* ignore */
  }
}
