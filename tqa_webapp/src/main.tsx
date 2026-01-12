import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApplyTelegramTheme } from './telegram/theme';
import './index.css'
import App from './App.tsx'

ApplyTelegramTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
