import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" ref={ref}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="إغلاق">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
