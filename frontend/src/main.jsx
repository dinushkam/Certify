import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ✅ Migrate old token keys to new keys on startup
const migrate = () => {
  const oldKeys = { token: 'token', refresh: 'refreshToken', user: 'user' }
  const newKeys = { token: 'cv_token', refresh: 'cv_refresh', user: 'cv_user' }

  for (const [field, oldKey] of Object.entries(oldKeys)) {
    const newKey = newKeys[field]
    // Check localStorage
    const localVal = localStorage.getItem(oldKey)
    if (localVal && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, localVal)
      localStorage.removeItem(oldKey)
    }
    // Check sessionStorage
    const sessionVal = sessionStorage.getItem(oldKey)
    if (sessionVal && !sessionStorage.getItem(newKey)) {
      sessionStorage.setItem(newKey, sessionVal)
      sessionStorage.removeItem(oldKey)
    }
  }
}
migrate()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)