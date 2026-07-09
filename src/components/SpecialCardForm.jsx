import { useState, useEffect } from 'react'
import { Plus, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { useApp } from '../store.jsx'
import { genId, computeTripNet, computeMaintNet, log } from '../utils.js'
import Modal from './Modal.jsx'

export default function SpecialCardForm({ open, onClose, sectionId, editEntry }) {
  const { state, dispatch } = useApp()
  const isEdit = !!editEntry

  const [cardType, setCardType] = useState('trip')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  // Trip fields
  const [studentCount, setStudentCount] = useState('')
  const [feePerStudent, setFeePerStudent] = useState('')
  const [received, setReceived] = useState('')
  const [transportCost, setTransportCost] = useState('')
  const [tripGrants, setTripGrants] = useState([])
  const [tripSupplies, setTripSupplies] = useState([])

  // Maintenance fields
  const [maintGrants, setMaintGrants] = useState([])
  const [purchases, setPurchases] = useState([])
  const [workerPay, setWorkerPay] = useState('')

  const tripSuppliesList = state.settings.tripSupplies || []
  const expectedTotal = parseInt(studentCount || 0) * parseInt(feePerStudent || 0)
  const receivedVal = parseInt(received || 0)
  const diff = expectedTotal - receivedVal

  useEffect(() => {
    if (open) {
      if (editEntry && editEntry.cardType) {
        setCardType(editEntry.cardType)
        setDate(editEntry.date)
        setNote(editEntry.note || '')
        const d = editEntry.cardData || {}
        if (editEntry.cardType === 'trip') {
          setStudentCount(String(d.studentCount || ''))
          setFeePerStudent(String(d.feePerStudent || ''))
          setReceived(String(d.received || ''))
          setTransportCost(String(d.transportCost || ''))
          setTripGrants(d.grants || [])
          setTripSupplies(d.supplies || [])
        } else {
          setWorkerPay(String(d.workerPay || ''))
          setMaintGrants(d.grants || [])
          setPurchases(d.purchases || [])
        }
      } else {
        setCardType('trip')
        setDate(new Date().toISOString().slice(0, 10))
        setNote('')
        setStudentCount(''); setFeePerStudent(''); setReceived('')
        setTransportCost(''); setTripGrants([]); setTripSupplies([])
        setWorkerPay(''); setMaintGrants([]); setPurchases([])
      }
    }
  }, [open, editEntry])

  const handleSubmit = (e) => {
    e.preventDefault()

    let amount, cardData
    if (cardType === 'trip') {
      cardData = {
        studentCount: parseInt(studentCount) || 0,
        feePerStudent: parseInt(feePerStudent) || 0,
        received: parseInt(received) || 0,
        transportCost: parseInt(transportCost) || 0,
        grants: tripGrants,
        supplies: tripSupplies,
      }
      amount = computeTripNet(cardData)
      if (amount >= 0) { /* income */ } else { /* expense - stored as positive, type handles sign */ }
    } else {
      cardData = {
        workerPay: parseInt(workerPay) || 0,
        grants: maintGrants,
        purchases: purchases,
      }
      amount = computeMaintNet(cardData)
    }

    const actualType = amount >= 0 ? 'income' : 'expense'

    const payload = {
      id: isEdit ? editEntry.id : genId(),
      sectionId,
      type: actualType,
      amount: Math.abs(amount),
      date,
      note,
      cardType,
      cardData,
    }

    if (isEdit) dispatch({ type: 'UPD_ENTRY', payload })
    else dispatch({ type: 'ADD_ENTRY', payload })
    log('INFO', `${isEdit ? 'updated' : 'added'} ${cardType} card net=${amount}`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل البطاقة' : 'بطاقة خاصة'}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>نوع البطاقة</label>
            <select value={cardType} onChange={e => setCardType(e.target.value)}>
              <option value="trip">رحلة</option>
              <option value="maintenance">صيانة</option>
            </select>
          </div>
          <div className="form-group">
            <label>التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
        </div>

        {cardType === 'trip' ? (
          <>
            <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>عدد التلاميذ</label>
                  <input type="number" value={studentCount} onChange={e => setStudentCount(e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>مبلغ الاشتراك</label>
                  <input type="number" value={feePerStudent} onChange={e => setFeePerStudent(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label>المبلغ المستلم</label>
                <input type="number" value={received} onChange={e => setReceived(e.target.value)} placeholder="0" />
              </div>
              {expectedTotal > 0 && (
                <div className={`warning-badge ${diff === 0 ? 'ok' : 'warn'}`}>
                  {diff === 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {diff === 0
                    ? `المبلغ كامل (${expectedTotal.toLocaleString()} د.ج)`
                    : diff > 0
                      ? `نقص: ${diff.toLocaleString()} د.ج متبقي`
                      : `زيادة: ${Math.abs(diff).toLocaleString()} د.ج`
                  }
                </div>
              )}
            </div>

            <div className="form-group">
              <label>تكلفة النقل</label>
              <input type="number" value={transportCost} onChange={e => setTransportCost(e.target.value)} placeholder="0" />
            </div>

            <div className="sub-section">
              <h3>الإعانات</h3>
              {tripGrants.map((g, i) => (
                <div key={i} className="sub-row">
                  <input type="number" value={g.amount} onChange={e => {
                    const copy = [...tripGrants]; copy[i] = { ...copy[i], amount: parseInt(e.target.value) || 0 }; setTripGrants(copy)
                  }} placeholder="المبلغ" />
                  <input value={g.note} onChange={e => {
                    const copy = [...tripGrants]; copy[i] = { ...copy[i], note: e.target.value }; setTripGrants(copy)
                  }} placeholder="ملاحظة" style={{ flex: 0.7 }} />
                  <button type="button" className="remove-btn" onClick={() => setTripGrants(tripGrants.filter((_, j) => j !== i))}><X size={16} /></button>
                </div>
              ))}
              <button type="button" className="add-sub-btn" onClick={() => setTripGrants([...tripGrants, { amount: 0, note: '' }])}>
                <Plus size={14} /> إضافة إعانة
              </button>
            </div>

            <div className="sub-section">
              <h3>المستلزمات</h3>
              {tripSupplies.map((sp, i) => (
                <div key={i} className="sub-row">
                  <select value={sp.type} onChange={e => {
                    const copy = [...tripSupplies]; copy[i] = { ...copy[i], type: e.target.value }; setTripSupplies(copy)
                  }}>
                    <option value="">اختر النوع</option>
                    {tripSuppliesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" value={sp.cost} onChange={e => {
                    const copy = [...tripSupplies]; copy[i] = { ...copy[i], cost: parseInt(e.target.value) || 0 }; setTripSupplies(copy)
                  }} placeholder="التكلفة" />
                  <button type="button" className="remove-btn" onClick={() => setTripSupplies(tripSupplies.filter((_, j) => j !== i))}><X size={16} /></button>
                </div>
              ))}
              <button type="button" className="add-sub-btn" onClick={() => setTripSupplies([...tripSupplies, { type: '', cost: 0 }])}>
                <Plus size={14} /> إضافة مستلزم
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="sub-section" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
              <h3>الإعانات</h3>
              {maintGrants.map((g, i) => (
                <div key={i} className="sub-row">
                  <input type="number" value={g.amount} onChange={e => {
                    const copy = [...maintGrants]; copy[i] = { ...copy[i], amount: parseInt(e.target.value) || 0 }; setMaintGrants(copy)
                  }} placeholder="المبلغ" />
                  <input value={g.note} onChange={e => {
                    const copy = [...maintGrants]; copy[i] = { ...copy[i], note: e.target.value }; setMaintGrants(copy)
                  }} placeholder="ملاحظة" style={{ flex: 0.7 }} />
                  <button type="button" className="remove-btn" onClick={() => setMaintGrants(maintGrants.filter((_, j) => j !== i))}><X size={16} /></button>
                </div>
              ))}
              <button type="button" className="add-sub-btn" onClick={() => setMaintGrants([...maintGrants, { amount: 0, note: '' }])}>
                <Plus size={14} /> إضافة إعانة
              </button>
            </div>

            <div className="sub-section">
              <h3>مشتريات الصيانة</h3>
              {purchases.map((p, i) => (
                <div key={i} className="sub-row">
                  <input value={p.name} onChange={e => {
                    const copy = [...purchases]; copy[i] = { ...copy[i], name: e.target.value }; setPurchases(copy)
                  }} placeholder="اسم المنتج" />
                  <input type="number" value={p.price} onChange={e => {
                    const copy = [...purchases]; copy[i] = { ...copy[i], price: parseInt(e.target.value) || 0 }; setPurchases(copy)
                  }} placeholder="السعر" />
                  <button type="button" className="remove-btn" onClick={() => setPurchases(purchases.filter((_, j) => j !== i))}><X size={16} /></button>
                </div>
              ))}
              <button type="button" className="add-sub-btn" onClick={() => setPurchases([...purchases, { name: '', price: 0 }])}>
                <Plus size={14} /> إضافة منتج
              </button>
            </div>

            <div className="form-group">
              <label>أجرة عامل الصيانة</label>
              <input type="number" value={workerPay} onChange={e => setWorkerPay(e.target.value)} placeholder="0" />
            </div>
          </>
        )}

        <div className="form-group">
          <label>ملاحظة (اختياري)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظة عامة..." />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn-primary">{isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
        </div>
      </form>
    </Modal>
  )
}
