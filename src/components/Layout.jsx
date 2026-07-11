import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, CalendarRange, NotebookText, Settings, ArrowLeft } from 'lucide-react'
import VoiceRecorderFAB from './VoiceRecorderFAB.jsx'

export default function Layout() {
  const loc = useLocation()
  const isDetail = loc.pathname.startsWith('/section/')

  return (
    <div className="app-layout">
      <header className="app-header">
        {isDetail ? (
          <NavLink to="/" className="back-btn" aria-label="رجوع">
            <ArrowLeft size={22} />
          </NavLink>
        ) : <div />}
        <h1>مالية المدرسة</h1>
        <div style={{ width: 36 }} />
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <Home size={24} />
          <span>الرئيسية</span>
        </NavLink>
        <NavLink to="/upcoming" className={({ isActive }) => isActive ? 'active' : ''}>
          <CalendarRange size={24} />
          <span>القادمة</span>
        </NavLink>
        <VoiceRecorderFAB />
        <NavLink to="/quick-record" className={({ isActive }) => isActive ? 'active' : ''}>
          <NotebookText size={24} />
          <span>تدوين سريع</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          <Settings size={24} />
          <span>الإعدادات</span>
        </NavLink>
      </nav>
    </div>
  )
}
