import { useEffect, useRef } from "react"

type Wisp = {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  alpha: number
}

function makeWisp(width: number, height: number, random = Math.random): Wisp {
  return {
    x: width * (0.35 + random() * 0.3),
    y: height * (0.55 + random() * 0.5),
    r: 18 + random() * 46,
    speed: 0.15 + random() * 0.35,
    drift: (random() - 0.5) * 0.35,
    alpha: 0.04 + random() * 0.07,
  }
}

export function TempleAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let wisps: Wisp[] = []
    let frame = 0
    let stopped = false

    const resize = () => {
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth))
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight))
      wisps = Array.from({ length: reduced ? 8 : 26 }, () =>
        makeWisp(canvas.width, canvas.height),
      )
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      for (const wisp of wisps) {
        const gradient = context.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.r)
        gradient.addColorStop(0, `rgba(232, 214, 170, ${wisp.alpha})`)
        gradient.addColorStop(1, "rgba(232, 214, 170, 0)")
        context.fillStyle = gradient
        context.beginPath()
        context.arc(wisp.x, wisp.y, wisp.r, 0, Math.PI * 2)
        context.fill()
      }
    }

    const tick = () => {
      if (stopped) return
      if (document.hidden) {
        frame = window.requestAnimationFrame(tick)
        return
      }
      for (const wisp of wisps) {
        wisp.y -= wisp.speed
        wisp.x += wisp.drift
        if (wisp.y + wisp.r < 0) {
          Object.assign(wisp, makeWisp(canvas.width, canvas.height))
          wisp.y = canvas.height + wisp.r
        }
      }
      draw()
      frame = window.requestAnimationFrame(tick)
    }

    draw()
    if (!reduced) frame = window.requestAnimationFrame(tick)
    return () => {
      stopped = true
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div className="grain" aria-hidden />
      <div className="candle-glow" aria-hidden />
      <div className="lantern-glow" aria-hidden />
      <canvas ref={canvasRef} className="incense-canvas" aria-hidden />
      <div className="bagua-field" aria-hidden>
        <span className="bagua-ring ring-a" />
        <span className="bagua-ring ring-b" />
        <span className="bagua-ring ring-c" />
      </div>
    </>
  )
}
