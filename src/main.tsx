import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { sembrarSiHaceFalta } from './lib/ejemplo'

sembrarSiHaceFalta().catch((e) => console.error('No se pudo sembrar el ejemplo', e))

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter: así anda igual en Netlify, en el subdirectorio que sea y offline. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
