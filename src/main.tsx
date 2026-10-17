import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { unlockAudio } from './audio/synth.ts'
import App from './App.tsx'
import './index.css'

function unlockOnce() {
  unlockAudio()
  window.removeEventListener('pointerdown', unlockOnce)
  window.removeEventListener('touchend', unlockOnce)
}

window.addEventListener('pointerdown', unlockOnce)
window.addEventListener('touchend', unlockOnce)

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
