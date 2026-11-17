export function FateGears() {
  return (
    <div className="gears-on flex flex-col items-center gap-3 text-primary">
      <svg viewBox="0 0 240 120" className="h-28 w-full" aria-hidden>
        <g className="gear gear-a">
          <circle
            cx="52"
            cy="58"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeDasharray="3 4.2"
          />
          <circle cx="52" cy="58" r="7" fill="currentColor" />
        </g>
        <g className="gear gear-b">
          <circle
            cx="118"
            cy="56"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray="3.2 4.6"
          />
          <circle
            cx="118"
            cy="56"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle cx="118" cy="56" r="4" fill="currentColor" />
        </g>
        <g className="gear gear-c">
          <circle
            cx="186"
            cy="74"
            r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray="2.8 4"
          />
          <circle cx="186" cy="74" r="5" fill="currentColor" />
        </g>
      </svg>
      <p className="text-center font-serif text-xl tracking-[0.2em]">
        命运的齿轮开始转动
      </p>
    </div>
  )
}
