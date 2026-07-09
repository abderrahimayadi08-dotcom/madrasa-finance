import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { genId, log } from '../utils.js'
import Modal from './Modal.jsx'

export default function EntryForm({ open, onClose, sectionId, editEntry }) {
  const { dispatch } = useApp()
  const isEdit = !!editEntry

  const [type, setType] = useState('income')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      if (editEntry) {
        setType(editEntry.type)
        setAmount(String(editEntry.amount))
        setDate(editEntry.date)
        setNote(editEntry.note || '')
      } else {
        setType('income')
        setAmount('')
        setDate(new Date().toISOString().slice(0, 10))
        setNote('')
      }
    }
  }, [open, editEntry])

  const handleSubmit = (e) => {
    e.preventDefault()
    const amt = parseInt(amount)
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

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل الحركة' : 'إضافة حركة'}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>النوع</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="income">مدخل</option>
              <option value="expense">مخرج</option>
            </select>
          </div>
          <div className="form-group">
            <label>التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label>المبلغ (د.ج)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="مثال: 5000" min="1" required />
        </div>
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
