import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useApp } from '../store.jsx'
import { fmt, genId, log } from '../utils.js'

export default function UpcomingPage() {
  const { state, dispatch } = useApp()
  const { upcoming } = state

  const [title, setTitle] = useState('')
  const [cost, setCost] = useState('')
  const [note, setNote] = useState('')

  const total = upcoming.reduce((s, u) => s + (u.estimatedCost || 0), 0)

  const handleAdd = () => {
    if (!title.trim() || !cost) return
    dispatch({ type: 'ADD_UPCOMING', payload: { id: genId(), title: title.trim(), estimatedCost: parseInt(cost), note } })
    log('INFO', `added upcoming expense: ${title}`)
    setTitle(''); setCost(''); setNote('')
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DEL_UPCOMING', payload: id })
    log('INFO', `deleted upcoming expense: ${id}`)
  }

  return (
    <>
      <div className="upcoming-total">
        <div className="label">مجموع المصاريف القادمة</div>
        <div className="amount">{fmt(total)}</div>
      </div>

      {upcoming.length > 0 && (
        <div className="entry-list">
          {upcoming.map(u => (
            <div key={u.id} className="upcoming-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="title">{u.title}</div>
                {u.note && <div className="note">{u.note}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="cost">{fmt(u.estimatedCost)}</div>
                <button className="btn-ghost" onClick={() => handleDelete(u.id)} style={{ padding: 4, color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="empty-state"><p>لا توجد مصاريف قادمة</p></div>
      )}

      <div className="add-form">
        <h3 style={{ fontSize: '0.938rem', fontWeight: 700 }}>إضافة مصروف قادم</h3>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="عنوان المصروف"
        />
        <div className="form-row">
          <input
            type="number"
            value={cost}
            onChange={e => setCost(e.target.value)}
            placeholder="السعر التقديري (د.ج)"
          />
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري)"
          />
        </div>
        <button className="btn-primary" onClick={handleAdd} disabled={!title.trim() || !cost}>
          <Plus size={16} /> إضافة
        </button>
      </div>
    </>
  )
}
