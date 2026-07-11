import { useState, useRef } from 'react'
import { Plus, X, Download, Upload, CheckCircle, Bell, BellOff, Edit2 } from 'lucide-react'
import { useApp } from '../store.jsx'
import { useVault } from '../vaultStore.jsx'
import { log } from '../utils.js'

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { settings } = state
  const { vaults, activeVault, createVault, switchVault, renameVault, deleteVault } = useVault()
  const fileRef = useRef()

  const [fund, setFund] = useState(String(settings.initialGeneralFund || ''))
  const [newSupply, setNewSupply] = useState('')
  const [saved, setSaved] = useState(false)
  const [showNewVault, setShowNewVault] = useState(false)
  const [vaultName, setVaultName] = useState('')
  const [renameId, setRenameId] = useState(null)
  const [renameVal, setRenameVal] = useState('')

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

  function loadAllVaults() {
    const all = {}
    for (const v of vaults) {
      try {
        const d = localStorage.getItem(`madrasa-finance-vault-${v.id}`)
        if (d) all[v.id] = JSON.parse(d)
      } catch (_) {}
    }
    return all
  }

  const handleExport = () => {
    const payload = { version: 2, vaults: vaults.map(v => ({ id: v.id, name: v.name, createdAt: v.createdAt })), activeVaultId: activeVault.id, vaultData: loadAllVaults() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `madrasa-finance-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    log('INFO', 'exported all vaults')
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.version === 2 && data.vaults && data.vaultData) {
          if (!confirm('استبدال جميع التخزائن الحالية؟')) return
          for (const v of data.vaults) {
            const vd = data.vaultData[v.id]
            if (vd) localStorage.setItem(`madrasa-finance-vault-${v.id}`, JSON.stringify(vd))
          }
          localStorage.setItem('madrasa-finance-vaults', JSON.stringify(data.vaults))
          localStorage.setItem('madrasa-finance-active-vault', data.activeVaultId)
          log('INFO', 'imported all vaults')
          window.location.reload()
        } else if (data.sections && data.entries && data.upcoming && data.settings) {
          if (!confirm('استبدال جميع البيانات الحالية؟')) return
          dispatch({ type: 'REPLACE_STATE', payload: data })
          log('INFO', 'imported legacy data')
        } else {
          alert('الملف غير صالح: بنية البيانات غير مكتملة')
        }
      } catch {
        alert('الملف غير صالح: لا يمكن قراءة JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleCreateVault = () => {
    const n = vaultName.trim()
    if (!n) return
    createVault(n)
    setShowNewVault(false)
    setVaultName('')
  }

  const handleRename = (id) => {
    const n = renameVal.trim()
    if (!n) return
    renameVault(id, n)
    setRenameId(null)
    setRenameVal('')
  }

  return (
    <>
      <div className="settings-section">
        <h2>التخزائن</h2>
        <div className="vault-list">
          {vaults.map(v => (
            <div key={v.id} className={`vault-item${v.id === activeVault.id ? ' active' : ''}`}>
              <div className="vault-info" onClick={() => switchVault(v.id)}>
                <span className="vault-name">
                  {renameId === v.id ? (
                    <input value={renameVal} onChange={e => setRenameVal(e.target.value)} onBlur={() => handleRename(v.id)} onKeyDown={e => { if (e.key === 'Enter') handleRename(v.id); if (e.key === 'Escape') setRenameId(null) }} autoFocus />
                  ) : (
                    <>{v.name}{v.id === activeVault.id && <span className="vault-badge">نشط</span>}</>
                  )}
                </span>
                <span className="vault-meta">{v.id === activeVault.id ? 'التخزينة الحالية' : 'اضغط للتبديل'}</span>
              </div>
              <div className="vault-actions">
                <button className="btn-icon" onClick={() => { setRenameId(v.id); setRenameVal(v.name) }} title="تغيير الاسم"><Edit2 size={14} /></button>
                {vaults.length > 1 && <button className="btn-icon btn-icon-danger" onClick={() => deleteVault(v.id)} title="حذف"><X size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowNewVault(true)} style={{ marginTop: 8 }}><Plus size={16} /> إضافة تخزينة جديدة</button>
      </div>

      {showNewVault && (
        <div className="settings-section">
          <h2>تسمية التخزينة الجديدة</h2>
          <div className="form-row">
            <input value={vaultName} onChange={e => setVaultName(e.target.value)} placeholder="اسم التخزينة" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleCreateVault() }} />
            <button className="btn-primary" onClick={handleCreateVault}>إنشاء</button>
            <button className="btn-ghost" onClick={() => { setShowNewVault(false); setVaultName('') }}>إلغاء</button>
          </div>
        </div>
      )}

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
            <Download size={16} /> تصدير الكل
          </button>
          <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()} style={{ flex: 1, background: 'var(--primary-dark)' }}>
            <Upload size={16} /> استيراد
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="settings-section">
        <h2>الإشعارات</h2>
        <div className="form-row" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 500, flex: 1 }}>
            {settings.notifEnabled ? 'الإشعارات مفعلة' : 'الإشعارات متوقفة'}
          </span>
          <button
            className={settings.notifEnabled ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
            onClick={async () => {
              const enable = !settings.notifEnabled
              if (enable && 'Notification' in window) {
                if (Notification.permission === 'default') {
                  const result = await Notification.requestPermission()
                  if (result !== 'granted') { alert('الرجاء السماح بالإشعارات في إعدادات المتصفح'); return }
                } else if (Notification.permission === 'denied') {
                  alert('الإشعارات ممنوعة في المتصفح. غير الإعدادات من إعدادات الموقع')
                  return
                }
              }
              dispatch({ type: 'SET_SETTINGS', payload: { notifEnabled: enable } })
              log('INFO', `notifications ${enable ? 'enabled' : 'disabled'}`)
            }}
          >
            {settings.notifEnabled ? <BellOff size={16} /> : <Bell size={16} />}
            {settings.notifEnabled ? 'إيقاف' : 'تفعيل'}
          </button>
        </div>
        {settings.notifEnabled && (
          <>
            <div className="form-row" style={{ marginTop: 8 }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>التكرار (دقائق)</label>
                <select
                  value={settings.notifInterval}
                  onChange={e => {
                    dispatch({ type: 'SET_SETTINGS', payload: { notifInterval: parseInt(e.target.value) } })
                    log('INFO', `notif interval set to ${e.target.value}min`)
                  }}
                >
                  <option value={1}>1 دقيقة</option>
                  <option value={5}>5 دقائق</option>
                  <option value={15}>15 دقيقة</option>
                  <option value={30}>30 دقيقة</option>
                  <option value={60}>كل ساعة</option>
                  <option value={120}>كل ساعتين</option>
                  <option value={180}>كل 3 ساعات</option>
                  <option value={360}>كل 6 ساعات</option>
                  <option value={720}>كل 12 ساعة</option>
                </select>
              </div>
            </div>
            <button type="button" className="btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, padding: '6px 14px', borderRadius: 'var(--radius-sm)' }} onClick={() => {
              if ('Notification' in window && Notification.permission === 'granted') {
                try { new Notification('مالية المدرسة', { body: 'الإشعارات تعمل بنجاح ✓' }) } catch (_) {}
              }
            }}>اختبار الإشعار</button>
          </>
        )}
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
