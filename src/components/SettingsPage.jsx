import { useState, useRef } from 'react'
import { Plus, X, Download, Upload, CheckCircle } from 'lucide-react'
import { useApp } from '../store.jsx'
import { log } from '../utils.js'

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { settings } = state
  const fileRef = useRef()

  const [fund, setFund] = useState(String(settings.initialGeneralFund || ''))
  const [newSupply, setNewSupply] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSaveFund = () => {
    const v = parseInt(fund)
    if (isNaN(v)) return
    dispatch({ type: 'SET_SETTINGS', payload: { initialGeneralFund: v } })
    log('INFO', `updated initial general fund: ${v}`)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddSupply = () => {
    const s = newSupply.trim()
    if (!s || settings.tripSupplies.includes(s)) return
    dispatch({ type: 'SET_SETTINGS', payload: { tripSupplies: [...settings.tripSupplies, s] } })
    log('INFO', `added trip supply: ${s}`)
    setNewSupply('')
  }

  const handleRemoveSupply = (s) => {
    dispatch({ type: 'SET_SETTINGS', payload: { tripSupplies: settings.tripSupplies.filter(x => x !== s) } })
    log('INFO', `removed trip supply: ${s}`)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `madrasa-finance-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    log('INFO', 'exported data to file')
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.sections || !data.entries || !data.upcoming || !data.settings) {
          alert('الملف غير صالح: بنية البيانات غير مكتملة')
          return
        }
        if (confirm('استبدال جميع البيانات الحالية؟')) {
          dispatch({ type: 'REPLACE_STATE', payload: data })
          log('INFO', 'imported data from file')
        }
      } catch {
        alert('الملف غير صالح: لا يمكن قراءة JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <div className="settings-section">
        <h2>رأس المال العام الابتدائي</h2>
        <div className="form-row">
          <input
            type="number"
            value={fund}
            onChange={e => setFund(e.target.value)}
            placeholder="المبلغ بالدينار"
          />
          <button className="btn-primary" onClick={handleSaveFund}>
            {saved ? <span className="saved-indicator"><CheckCircle size={16} /> تم</span> : 'حفظ'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2>مستلزمات الرحلات</h2>
        <div className="supply-tags">
          {settings.tripSupplies.map(s => (
            <span key={s} className="supply-tag">
              {s}
              <button className="remove-tag" onClick={() => handleRemoveSupply(s)}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="form-row">
          <input
            value={newSupply}
            onChange={e => setNewSupply(e.target.value)}
            placeholder="إضافة مستلزم جديد"
            onKeyDown={e => { if (e.key === 'Enter') handleAddSupply() }}
          />
          <button className="btn-primary btn-sm" onClick={handleAddSupply}>
            <Plus size={16} /> إضافة
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2>البيانات</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary btn-sm" onClick={handleExport} style={{ flex: 1 }}>
            <Download size={16} /> تصدير
          </button>
          <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()} style={{ flex: 1, background: 'var(--primary-dark)' }}>
            <Upload size={16} /> استيراد
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="settings-section">
        <h2>حول التطبيق</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          نظام إدارة مالية المدرسة القرآنية. الإصدار 1.0.0
        </p>
      </div>
    </>
  )
}
