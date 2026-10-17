export type Tab = 'theory' | 'guitar' | 'piano' | 'play'
export type PlayMode = 'ear' | 'simon' | 'guitar' | 'badges'

export function readTab(): Tab {
  const value = window.location.hash.replace('#', '')
  if (value === 'guitar' || value === 'piano' || value === 'theory') return value
  if (value.startsWith('play')) return 'play'
  return 'theory'
}

export function readPlayMode(): PlayMode {
  const value = window.location.hash.replace('#', '')
  if (value === 'play-simon') return 'simon'
  if (value === 'play-guitar') return 'guitar'
  if (value === 'play-badges') return 'badges'
  return 'ear'
}

export function writeHash(hash: string) {
  const next = hash.startsWith('#') ? hash : `#${hash}`
  if (window.location.hash === next) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.location.hash = next
}
