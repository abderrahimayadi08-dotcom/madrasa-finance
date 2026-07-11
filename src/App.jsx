import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './components/HomePage.jsx'
import SectionDetail from './components/SectionDetail.jsx'
import UpcomingPage from './components/UpcomingPage.jsx'
import QuickRecordPage from './components/QuickRecordPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import { useApp } from './store.jsx'
import { log } from './utils.js'

function NotificationScheduler() {
  const { state } = useApp()
  const timerRef = useRef(null)

  useEffect(() => {
    const { notifEnabled, notifInterval } = state.settings
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (!notifEnabled || !('Notification' in window) || Notification.permission !== 'granted') return

    const showNotif = () => {
      if (document.hidden) {
        try {
          new Notification('مالية المدرسة', {
            body: 'هل أدخلت المشتريات؟ لا تنسى إدخال التحديثات الجديدة',
          })
        } catch (_) {}
      }
    }

    timerRef.current = setInterval(showNotif, notifInterval * 60 * 1000)
    log('INFO', `notifications scheduled every ${notifInterval}min`)

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [state.settings.notifEnabled, state.settings.notifInterval])

  return null
}

function AutoBackup() {
  const { state } = useApp()
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    doneRef.current = true
    try {
      let vaults = []
      try { vaults = JSON.parse(localStorage.getItem('madrasa-finance-vaults')) || [] } catch (_) {}
      const vaultData = {}
      for (const v of vaults) {
        const d = localStorage.getItem(`madrasa-finance-vault-${v.id}`)
        if (d) vaultData[v.id] = JSON.parse(d)
      }
      const activeId = localStorage.getItem('madrasa-finance-active-vault')
      const payload = { version: 2, vaults, activeVaultId: activeId, vaultData }
      const json = JSON.stringify(payload, null, 2)
      localStorage.setItem('madrasa-finance-backup-json', json)
      localStorage.setItem('madrasa-finance-backup-timestamp', new Date().toISOString())
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `madrasa-finance-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      log('INFO', 'auto backup saved + downloaded')
    } catch (_) {}
  }, [])

  return null
}

export default function App() {
  return (
    <>
      <NotificationScheduler />
      <AutoBackup />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/section/:id" element={<SectionDetail />} />
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="/quick-record" element={<QuickRecordPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  )
}
