import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initButtonGlow } from './utils/buttonGlow.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialisation de l'effet glow sur tous les boutons du site.
// Appelé après le rendu initial pour que le DOM soit prêt.
initButtonGlow()
