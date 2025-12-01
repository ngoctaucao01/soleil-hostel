import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function mountApp() {
  const container = document.getElementById('root')
  if (!container) {
    // Helpful debug message instead of throwing - avoids "Target container is not a DOM element"
    // when scripts execute before the body is parsed or the template doesn't include the mount node.
    // This makes the client more robust across server-rendered templates.
    console.error('React mount failed: #root element not found in the DOM.')
    return
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', mountApp)
} else {
  mountApp()
}
