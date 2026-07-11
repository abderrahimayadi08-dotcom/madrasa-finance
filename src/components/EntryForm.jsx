import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { genId, log } from '../utils.js'
import Modal from './Modal.jsx'

export default function EntryForm({ open, onClose, sectionId, editEntry }) {
  const { dispatch } = useApp()
  const isEdit = !!editEntry

  const [type, setType] = useState('expense')
  const [mode, setMode] = useState('total')
  const [amount, setAmount] = useState('')
  const [qty, setQty] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  const computedTotal = mode === 'qty' ? (parseInt(qty || 0) * parseInt(unitPrice || 0)) : parseInt(amount || 0)

  useEffect(() => {
    if (open) {
      if (editEntry) {
        setType(editEntry.type)
        setAmount(String(editEntry.amount))
        setDate(editEntry.date)
        setNote(editEntry.note || '')
        setMode('total')
        setQty('')
        setUnitPrice('')
      } else {
        setType('expense')
        setAmount('')
        setMode('total')
        setQty('')
        setUnitPrice('')
        setDate(new Date().toISOString().slice(0, 10))
        setNote('')
      }
    }
  }, [open, editEntry])

  const handleSubmit = (e) => {
    e.preventDefault()
    const amt = computedTotal
    if (!amt || amt <= 0) return

    if (isEdit) {
      dispatch({ type: 'UPD_ENTRY', payload: { ...editEntry, type, amount: amt, date, note } })
      log('INFO', `updated entry: ${editEntry.id}`)
    } else {
      dispatch({ type: 'ADD_ENTRY', payload: { id: genId(), sectionId, type, amount: amt, date, note, cardType: null, cardData: null } })
      log('INFO', `added ${type} entry: ${amt} to ${sectionId}`)
    }
    onClose()
  }

  const toggleMode = () => setMode(mode === 'total' ? 'qty' : 'total')

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل الحركة' : 'إضافة حركة'}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>النوع</label>
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

        <div className="form-row" style={{ marginBottom: 12 }}>
          <button type="button" className={mode === 'total' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setMode('total')} style={{ flex: 1 }}>المبلغ الكلي</button>
          <button type="button" className={mode === 'qty' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setMode('qty')} style={{ flex: 1 }}>الكمية × السعر</button>
        </div>

        {mode === 'total' ? (
          <div className="form-group">
            <label>المبلغ (د.ج)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="مثال: 5000" min="1" required />
          </div>
        ) : (
          <div className="form-row">
            <div className="form-group">
              <label>العدد</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="مثال: 10" min="1" required />
            </div>
            <div className="form-group">
              <label>سعر الواحد (د.ج)</label>
              <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="مثال: 500" min="1" required />
            </div>
          </div>
        )}

        {mode === 'qty' && computedTotal > 0 && (
          <div style={{ textAlign: 'center', padding: '6px 0 10px', fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--primary)' }}>
            المجموع: {computedTotal.toLocaleString()} د.ج
          </div>
        )}

        <div className="form-group">
          <label>ملاحظة (اختياري)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="سبب الحركة..." />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn-primary">{isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
        </div>
      </form>
    </Modal>
  )
}
