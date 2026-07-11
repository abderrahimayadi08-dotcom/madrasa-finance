import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppProvider } from './store.jsx'
import { QuickProvider } from './quickStore.jsx'
import { VaultProvider } from './vaultStore.jsx'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <VaultProvider>
        <QuickProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </QuickProvider>
      </VaultProvider>
    </HashRouter>
  </StrictMode>
)
