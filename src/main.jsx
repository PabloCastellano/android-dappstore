import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from './serviceWorkerRegistration'

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// register service worker (graceful)
registerSW();
