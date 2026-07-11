import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Trash2 } from 'lucide-react'
import { useQuick } from '../quickStore.jsx'
import { saveRecording, deleteRecording } from '../audioDB.js'
import { genId, log } from '../utils.js'

const LONG_PRESS_MS = 400

export default function VoiceRecorderFAB() {
  const { dispatch: qDispatch } = useQuick()
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const intervalRef = useRef(null)
  const mrRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startRef = useRef(0)
  const idRef = useRef(null)
  const trashRef = useRef(null)
  const recRef = useRef(false)
  const longRef = useRef(false)
  const justRef = useRef(false)

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => setElapsed(Math.round((Date.now() - startRef.current) / 1000)), 500)
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      setElapsed(0)
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
  }, [recording])

  const isInTrash = useCallback((clientX, clientY) => {
    if (!trashRef.current) return false
    const r = trashRef.current.getBoundingClientRect()
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }, [])

  const stopRec = useCallback(async (save) => {
    const mr = mrRef.current
    if (!mr || mr.state === 'inactive') return
    return new Promise(resolve => {
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        const dur = Math.round((Date.now() - startRef.current) / 1000)
        if (save && idRef.current) {
          await saveRecording(idRef.current, blob, dur)
          qDispatch({ type: 'ADD_QUICK_ITEM', payload: { id: idRef.current, type: 'voice', name: 'تسجيل سريع', note: '', duration: dur, createdAt: new Date().toISOString() } })
          log('INFO', `voice saved ${idRef.current}`)
        } else if (idRef.current) {
          await deleteRecording(idRef.current)
        }
        streamRef.current?.getTracks().forEach(t => t.stop())
        mrRef.current = null; streamRef.current = null; chunksRef.current = []; idRef.current = null
        resolve()
      }
      mr.stop()
    })
  }, [qDispatch])

  const startRec = useCallback(async (long) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.start()
      mrRef.current = mr; streamRef.current = stream; chunksRef.current = chunks
      startRef.current = Date.now(); idRef.current = genId()
      recRef.current = true; longRef.current = long
      setRecording(true)
      log('INFO', 'rec started')
    } catch { alert('الرجاء السماح بالميكروفون'); setRecording(false); recRef.current = false; longRef.current = false }
  }, [])

  const cancelRec = useCallback(async () => {
    recRef.current = false; longRef.current = false
    setRecording(false)
    await stopRec(false)
  }, [stopRec])

  useEffect(() => {
    if (!recRef.current) return
    const onMove = (e) => { e.preventDefault(); if (recRef.current && isInTrash(e.clientX, e.clientY)) cancelRec() }
    const onUp = () => { if (recRef.current && longRef.current) { recRef.current = false; longRef.current = false; setRecording(false); stopRec(true) } }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [recording])

  const handleDown = useCallback(() => {
    if (recRef.current) { justRef.current = true; recRef.current = false; setRecording(false); stopRec(true); return }
    justRef.current = false
    timerRef.current = setTimeout(() => { timerRef.current = null; startRec(true) }, LONG_PRESS_MS)
  }, [startRec, stopRec])

  const handleUp = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; if (!justRef.current) startRec(false); justRef.current = false; return }
    if (recRef.current && longRef.current) { recRef.current = false; longRef.current = false; setRecording(false); stopRec(true) }
  }, [startRec, stopRec])

  return (
    <div className="vrfab-wrap">
      {recording && <div ref={trashRef} className="vrfab-trash" onPointerDown={(e) => { e.stopPropagation(); cancelRec() }}><Trash2 size={24} /><span>إلغاء</span></div>}
      <button className={`vrfab-btn${recording ? ' recording' : ''}`} onPointerDown={handleDown} onPointerUp={handleUp} aria-label="تسجيل صوتي">
        <Mic size={24} />
        {recording && <span className="vrfab-dot" />}
      </button>
      {recording && <div className="vrfab-timer">{elapsed}ث</div>}
    </div>
  )
}
