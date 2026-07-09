import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, ArrowLeft, Trash2 } from 'lucide-react'
import { useApp } from '../store.jsx'
import { computeSectionNet, fmt, log } from '../utils.js'
import EntryForm from './EntryForm.jsx'
import SpecialCardForm from './SpecialCardForm.jsx'

const typeMeta = {
  income: { label: 'مدخل', cls: 'income' },
  expense: { label: 'مخرج', cls: 'expense' },
  trip: { label: 'رحلة', cls: 'trip' },
  maintenance: { label: 'صيانة', cls: 'maint' },
}

export default function SectionDetail() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const { sections, entries } = state
  const section = sections.find(s => s.id === id)
  const sectionEntries = entries.filter(e => e.sectionId === id).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  const [showEntryForm, setShowEntryForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [editing, setEditing] = useState(null)

  if (!section) return <div className="empty-state"><p>القسم غير موجود</p></div>

  const net = computeSectionNet(entries, id)

  const handleDelete = (entryId) => {
    if (confirm('حذف هذه الحركة؟')) {
      dispatch({ type: 'DEL_ENTRY', payload: entryId })
      log('INFO', `deleted entry: ${entryId}`)
    }
  }

  const handleEdit = (entry) => {
    setEditing(entry)
    if (entry.cardType) setShowCardForm(true)
    else setShowEntryForm(true)
  }

  return (
    <>
      <div className="detail-header">
        <Link to="/" className="back-btn" aria-label="رجوع"><ArrowLeft size={22} /></Link>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{section.name}</h2>
      </div>

      <div className="detail-meta">
        <div className={`detail-net ${net >= 0 ? 'positive' : 'negative'}`}>{fmt(net)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowEntryForm(true) }} style={{ padding: '8px 12px', fontSize: '0.813rem' }}>
            <Plus size={16} /> إضافة
          </button>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowCardForm(true) }} style={{ padding: '8px 12px', fontSize: '0.813rem', background: 'var(--gold)' }}>
            <Plus size={16} /> بطاقة خاصة
          </button>
        </div>
      </div>

      {sectionEntries.length === 0 ? (
        <div className="empty-state"><p>لا توجد حركات في هذا القسم</p></div>
      ) : (
        <div className="entry-list">
          {sectionEntries.map(entry => {
            const meta = entry.cardType ? typeMeta[entry.cardType] : typeMeta[entry.type]
            return (
              <div key={entry.id} className="entry-card" onClick={() => handleEdit(entry)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <span className={`entry-type-badge ${meta.cls}`}>{meta.label}</span>
                  </div>
                  <div className="entry-date">{entry.date}</div>
                  {entry.note && <div className="entry-note">{entry.note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className={`entry-amount ${entry.type === 'expense' ? 'negative' : 'positive'}`}>
                    {entry.type === 'expense' ? '-' : '+'}{fmt(entry.amount)}
                  </div>
                  <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }} style={{ padding: 4, color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EntryForm
        open={showEntryForm}
        onClose={() => { setShowEntryForm(false); setEditing(null) }}
        sectionId={id}
        editEntry={editing && !editing.cardType ? editing : null}
      />

      <SpecialCardForm
        open={showCardForm}
        onClose={() => { setShowCardForm(false); setEditing(null) }}
        sectionId={id}
        editEntry={editing && editing.cardType ? editing : null}
      />
    </>
  )
}
