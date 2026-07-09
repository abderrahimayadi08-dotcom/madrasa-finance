import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './components/HomePage.jsx'
import SectionDetail from './components/SectionDetail.jsx'
import UpcomingPage from './components/UpcomingPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/section/:id" element={<SectionDetail />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
