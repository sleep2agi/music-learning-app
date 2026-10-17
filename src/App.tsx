import { useEffect, useState } from 'react'
import { GuitarView } from './components/GuitarView.tsx'
import { PianoView } from './components/PianoView.tsx'
import { PlayView } from './components/PlayView.tsx'
import { TheoryView } from './components/TheoryView.tsx'
import { readTab, writeHash, type Tab } from './nav.ts'
import { BADGE_DEFS } from './play/stats.ts'
import { PlayStatsProvider } from './storage/PlayStatsProvider.tsx'
import { usePlayStats } from './storage/usePlayStats.ts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'theory', label: '乐理' },
  { id: 'guitar', label: '吉他' },
  { id: 'piano', label: '钢琴' },
  { id: 'play', label: '玩' },
]

export default function App() {
  return (
    <PlayStatsProvider>
      <Shell />
    </PlayStatsProvider>
  )
}

function Shell() {
  const { stats } = usePlayStats()
  const [tab, setTab] = useState<Tab>(readTab)

  useEffect(() => {
    const onHash = () => setTab(readTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  function selectTab(next: Tab) {
    writeHash(next === 'play' ? 'play' : next)
    setTab(next)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="wrap topbar-inner">
          <div className="brand">
            <span className="logo" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22">
                <ellipse cx="12" cy="22" rx="5" ry="3.6" transform="rotate(-22 12 22)" fill="#e0b15a" />
                <rect x="16" y="6" width="2" height="16" rx="1" fill="#e0b15a" />
                <path d="M18 6.5c5 1.2 7 4.4 5 8" fill="none" stroke="#e0b15a" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h1>乐趣岛</h1>
              <p>边玩边学</p>
            </div>
          </div>
          <p className="streak-pill">
            {stats.streak} 天 · {stats.badges.length}/{BADGE_DEFS.length}
          </p>
          <nav className="tabs" aria-label="章节">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tab"
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="wrap stage" id="content">
        {tab === 'theory' && <TheoryView />}
        {tab === 'guitar' && <GuitarView />}
        {tab === 'piano' && <PianoView />}
        {tab === 'play' && <PlayView />}
      </main>
    </div>
  )
}
