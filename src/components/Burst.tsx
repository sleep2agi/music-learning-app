import type { CSSProperties } from 'react'

export function Burst({ tick }: { tick: number }) {
  if (tick === 0) return null
  return (
    <span className="burst" key={tick} aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <i key={index} style={{ '--i': String(index) } as CSSProperties} />
      ))}
    </span>
  )
}

export function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count} 颗星`}>
      {[0, 1, 2].map((index) => (
        <span key={index} className={index < count ? 'star is-on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  )
}
