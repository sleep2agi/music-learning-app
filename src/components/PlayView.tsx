import { useEffect, useState } from 'react'
import { readPlayMode, writeHash, type PlayMode } from '../nav.ts'
import { BADGE_DEFS } from '../play/stats.ts'
import { usePlayStats } from '../storage/usePlayStats.ts'
import { EarGame } from './EarGame.tsx'
import { GuitarChallenge } from './GuitarChallenge.tsx'
import { SimonGame } from './SimonGame.tsx'

const MODES: { id: PlayMode; hash: string; label: string }[] = [
  { id: 'ear', hash: 'play', label: '听辨' },
  { id: 'simon', hash: 'play-simon', label: '跟灯' },
  { id: 'guitar', hash: 'play-guitar', label: '抢音' },
  { id: 'badges', hash: 'play-badges', label: '徽章' },
]

export function PlayView() {
  const { stats } = usePlayStats()
  const [mode, setMode] = useState<PlayMode>(readPlayMode)

  useEffect(() => {
    const onHash = () => setMode(readPlayMode())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function select(next: PlayMode) {
    const item = MODES.find((modeItem) => modeItem.id === next)
    writeHash(item?.hash ?? 'play')
    setMode(next)
  }

  return (
    <div className="stack">
      <section className="card play-hero">
        <span className="mascot" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="30" fill="#241c12" stroke="#e0b15a" strokeWidth="2" />
            <ellipse cx="24" cy="44" rx="8" ry="6" transform="rotate(-18 24 44)" fill="#e0b15a" />
            <rect x="30" y="14" width="3" height="28" rx="1.5" fill="#e0b15a" />
            <circle cx="24" cy="28" r="2.2" fill="#f6f1e7" />
            <circle cx="38" cy="28" r="2.2" fill="#f6f1e7" />
            <path d="M24 36c3 4 11 4 14 0" fill="none" stroke="#f6f1e7" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h2>来玩一把</h2>
          <p>
            连续 {stats.streak} 天 · 徽章 {stats.badges.length}/{BADGE_DEFS.length}
          </p>
        </div>
      </section>
      <div className="mode-switch" role="tablist" aria-label="小游戏">
        {MODES.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} onClick={() => select(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {mode === 'ear' && <EarGame />}
      {mode === 'simon' && <SimonGame />}
      {mode === 'guitar' && <GuitarChallenge />}
      {mode === 'badges' && <BadgeShelf unlocked={stats.badges} />}
    </div>
  )
}

function BadgeShelf({ unlocked }: { unlocked: readonly string[] }) {
  const owned = new Set(unlocked)
  return (
    <section className="card">
      <div className="section-head">
        <h2>徽章</h2>
        <p>都记在这台设备上。</p>
      </div>
      <ul className="badge-grid">
        {BADGE_DEFS.map((badge) => {
          const on = owned.has(badge.id)
          return (
            <li key={badge.id} className={on ? 'badge is-on' : 'badge'}>
              <span className="badge-mark" aria-hidden="true">
                {on ? badge.mark : '·'}
              </span>
              <strong>{badge.title}</strong>
              <small>{badge.detail}</small>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
