import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store.jsx'
import { computeCurrentFund, computeSectionNet, fmt, genId, log } from '../utils.js'
import FundChart from './FundChart.jsx'
import Modal from './Modal.jsx'
import EntryForm from './EntryForm.jsx'

export default function HomePage() {
  const { state, dispatch } = useApp()
  const { sections, entries, settings, upcoming } = state
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [quickEntrySec, setQuickEntrySec] = useState(null)

  const fund = computeCurrentFund(settings.initialGeneralFund, entries)
  const upcomingTotal = upcoming.reduce((sum, u) => sum + (u.estimatedCost || 0), 0)
  const netAvailable = fund - upcomingTotal

  const handleAdd = () => {
    if (!name.trim()) return
    dispatch({ type: 'ADD_SECTION', payload: { id: genId(), name: name.trim() } })
    log('INFO', `added section: ${name}`)
    setName('')
    setShowAdd(false)
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (confirm('حذف القسم وكل حركاته؟')) {
      dispatch({ type: 'DEL_SECTION', payload: id })
      log('INFO', `deleted section: ${id}`)
    }
  }

  return (
    <>
      <div className="fund-card">
        <div className="fund-label">المال العام للمدرسة</div>
        <div className="fund-amount">{fmt(fund)}</div>
        <div className="fund-sub" style={{ marginTop: 'var(--space-4)' }}>
          <span style={{ opacity: 0.7 }}>المصاريف القادمة: {fmt(upcomingTotal)}</span>
        </div>
        <div className="fund-sub" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
          الصافي: {fmt(netAvailable)}
        </div>
      </div>

      <FundChart />

      <div className="section-list">
        <div className="section-header">
          <h2>الأقسام</h2>
          <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> إضافة قسم
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد أقسام بعد. أضف قسماً للبدء</p>
          </div>
        ) : (
          <div className="section-grid">
            {sections.map(sec => {
              const net = computeSectionNet(entries, sec.id)
              return (
                <Link key={sec.id} to={`/section/${sec.id}`} className="section-card">
                  <button className="del-btn" onClick={(e) => handleDelete(sec.id, e)} aria-label="حذف">
                    <Trash2 size={14} />
                  </button>
                  <div className="section-name">{sec.name}</div>
                  <div className={`section-balance ${net < 0 ? 'negative' : ''}`}>
                    {fmt(net)}
                  </div>
                  <button className="quick-entry-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickEntrySec(sec.id) }}>
                    <Plus size={12} /> إضافة حركة
                  </button>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة قسم جديد">
        <div className="form-group">
          <label>اسم القسم</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: الصيانة، الرحلات..."
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
        </div>
        <div className="form-actions">
          <button className="btn-ghost" onClick={() => setShowAdd(false)}>إلغاء</button>
          <button className="btn-primary" onClick={handleAdd}>إضافة</button>
        </div>
      </Modal>

      {quickEntrySec && (
        <EntryForm
          open={true}
          onClose={() => setQuickEntrySec(null)}
          sectionId={quickEntrySec}
          editEntry={null}
        />
      )}
    </>
  )
}
