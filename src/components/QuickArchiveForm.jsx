import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useApp } from '../store.jsx'
import { useQuick } from '../quickStore.jsx'
import { genId, log } from '../utils.js'
import { getRecording, deleteRecording } from '../audioDB.js'
import Modal from './Modal.jsx'

export default function QuickArchiveForm({ open, onClose, item, index }) {
  const { state, dispatch } = useApp()
  const { dispatch: quickDispatch } = useQuick()
  const isVoice = item?.type === 'voice'
  const urlRef = useRef(null)

  const [items, setItems] = useState([{ name: '', price: '', sectionId: '', note: '' }])
  const [type, setType] = useState('expense')
  const [date, setDate] = useState('')
  const [audioBlobUrl, setAudioBlobUrl] = useState(null)
  const [loadingAudio, setLoadingAudio] = useState(false)

  useEffect(() => {
    if (open && item) {
      setItems([{ name: item.name || '', price: String(item.price || ''), sectionId: '', note: item.note || '' }])
      setType('expense')
      setDate(item.date || new Date().toISOString().slice(0, 10))
    }
  }, [open, item])

  useEffect(() => {
    if (open && isVoice && item) {
      setLoadingAudio(true)
      getRecording(item.id).then(blob => {
        if (blob) {
          urlRef.current = URL.createObjectURL(blob)
          setAudioBlobUrl(urlRef.current)
        }
        setLoadingAudio(false)
      })
    }
    return () => {
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; setAudioBlobUrl(null) }
    }
  }, [open, item?.id, isVoice])

  const addItem = () => {
    setItems([...items, { name: '', price: '', sectionId: '', note: '' }])
  }

  const updateItem = (idx, field, value) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    setItems(next)
  }

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validItems = items.filter(it => parseInt(it.price) > 0 && it.sectionId)
    if (validItems.length === 0) return

    validItems.forEach(it => {
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          id: genId(),
          sectionId: it.sectionId,
          type,
          amount: parseInt(it.price),
          date,
          note: it.note.trim() || '',
          cardType: null,
          cardData: null,
        },
      })
    })

    if (item.type === 'voice') {
      try { await deleteRecording(item.id) } catch (err) {
        log('ERROR', `deleteRecording failed: ${err}`)
      }
    }

    quickDispatch({ type: 'DEL_QUICK_ITEM', payload: index })
    log('INFO', `archived ${validItems.length} item(s) from quick record`)
    onClose()
  }

  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} title="أرشفة التدوين">
      <form onSubmit={handleSubmit}>
        {isVoice && loadingAudio && (
          <div style={{ textAlign: 'center', padding: 16, fontSize: 'var(--text-sm)', color: 'var(--text-light)' }}>جارٍ تحميل التسجيل الصوتي...</div>
        )}
        {isVoice && !loadingAudio && audioBlobUrl && (
          <div style={{ position: 'sticky', top: -20, background: 'var(--bg-card)', zIndex: 2, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <audio src={audioBlobUrl} controls style={{ width: '100%' }} />
          </div>
        )}

        {!isVoice && (
          <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{item.name}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
              {item.price?.toLocaleString()} د.ج
            </div>
          </div>
        )}

        {items.map((it, idx) => (
          <div key={idx} className="sub-section" style={idx === 0 ? { marginTop: 0, borderTop: 'none', paddingTop: 0 } : {}}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3>الغرض {idx + 1}</h3>
              {items.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeItem(idx)} title="حذف الغرض"><X size={14} /></button>
              )}
            </div>
            <div className="form-group">
              <label>اسم الغرض</label>
              <input type="text" value={it.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="مثال: ممسحة أرضية" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>السعر (د.ج)</label>
                <input type="number" value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} placeholder="550" min="1" required />
              </div>
              <div className="form-group">
                <label>القسم</label>
                <select value={it.sectionId} onChange={e => updateItem(idx, 'sectionId', e.target.value)} required>
                  <option value="">اختر القسم</option>
                  {state.sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>ملاحظة (اختياري)</label>
              <input type="text" value={it.note} onChange={e => updateItem(idx, 'note', e.target.value)} placeholder="..." />
            </div>
          </div>
        ))}

        <button type="button" className="add-sub-btn" onClick={addItem} style={{ marginTop: 8, marginBottom: 16 }}>
          <Plus size={14} /> إضافة غرض
        </button>

        <div className="form-row">
          <div className="form-group">
            <label>نوع العملية</label>
            <div className="type-toggle">
              <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>مدخل</button>
              <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>مخرج</button>
            </div>
          </div>
          <div className="form-group">
            <label>التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn-primary">إضافة {items.length > 1 ? 'الحركات' : 'حركة'}</button>
        </div>
      </form>
    </Modal>
  )
}
