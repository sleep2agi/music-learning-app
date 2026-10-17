import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { unlockAudio } from './audio/synth.ts'
import App from './App.tsx'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

const unlockOnFirstTap = () => {
  unlockAudio()
  window.removeEventListener('pointerdown', unlockOnFirstTap)
  window.removeEventListener('touchend', unlockOnFirstTap)
}
window.addEventListener('pointerdown', unlockOnFirstTap)
window.addEventListener('touchend', unlockOnFirstTap)

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
