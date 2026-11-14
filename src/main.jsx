import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { preload } from '@pages'
import './styles.css'

// Load the current page's code first, so the prerendered HTML is replaced without an empty flash.
preload(window.location.pathname)
  .catch(() => {})
  .then(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    )
  })
