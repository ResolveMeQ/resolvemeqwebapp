import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'
import { applyThemeToDocument, getLocalTheme } from './utils/theme'

applyThemeToDocument(getLocalTheme())

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

const appTree = googleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>{appTree}</BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

document.getElementById('rmq-h1')?.remove()
