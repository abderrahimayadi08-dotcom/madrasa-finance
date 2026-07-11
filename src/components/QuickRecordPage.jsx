import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Mic, Square, Play, Pause, Archive, Trash2, Headphones } from 'lucide-react'
import { useQuick } from '../quickStore.jsx'
import { genId, log } from '../utils.js'
import { getRecording, saveRecording, deleteRecording } from '../audioDB.js'
import QuickArchiveForm from './QuickArchiveForm.jsx'

function fmtDuration(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function VoiceRecorder({ onSave }) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setRecording(false)
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      setElapsed(0)

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        onSave(blob, elapsed)
      }

      recorder.start()
      setRecording(true)

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } catch (_) {
      alert('لا يمكن الوصول إلى الميكروفون. تأكد من السماح بالتسجيل.')
    }
  }, [onSave, elapsed])

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        className={`mic-btn ${recording ? 'listening' : 'idle'}`}
        onClick={recording ? stopRecording : startRecording}
        aria-label={recording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
      >
        {recording ? <Square size={28} /> : <Mic size={28} />}
      </button>
      {recording && (
        <div className="mic-pulse-text">
          {fmtDuration(elapsed)}
        </div>
      )}
    </div>
  )
}

function VoiceItem({ item, index, onDelete, onArchive }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loadingAudio, setLoadingAudio] = useState(true)
  const audioRef = useRef(null)
  const urlRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoadingAudio(true)
    getRecording(item.id).then(blob => {
      if (cancelled) return
      if (blob) {
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setAudioUrl(url)
      }
      setLoadingAudio(false)
    })
    return () => { cancelled = true }
  }, [item.id])

  useEffect(() => {
    return () => {
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    setCurrentTime(0)
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', handleEnded)
    el.addEventListener('timeupdate', handleTimeUpdate)
    el.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', handleEnded)
      el.removeEventListener('timeupdate', handleTimeUpdate)
      el.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="quick-item voice">
      <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: 'none' }} />
      <div className="qi-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Headphones size={16} style={{ color: 'var(--primary)' }} />
          <span className="qi-name" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {loadingAudio ? 'جارٍ التحميل...' : 'تسجيل صوتي'}
          </span>
        </div>
        <div className="qi-date">{item.date} · {fmtDuration(item.duration || duration)}</div>
        {!loadingAudio && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button className="qi-play-btn" onClick={togglePlay}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <div className="qi-progress-track">
              <div
                className="qi-progress-fill"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-light)', minWidth: 60, textAlign: 'center', direction: 'ltr' }}>
              {fmtDuration(currentTime)} / {fmtDuration(item.duration || duration)}
            </span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="qi-archive-btn" onClick={() => onArchive(index)}>
          <Archive size={14} /> أرشفة
        </button>
        <button className="qi-del-btn" onClick={() => onDelete(index)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function QuickRecordPage() {
  const { state: quickState, dispatch: quickDispatch } = useQuick()
  const [tab, setTab] = useState('text')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [archiveTarget, setArchiveTarget] = useState(null)

  const handleTextSubmit = () => {
    if (!name.trim() || !price) return
    const amt = parseInt(price)
    if (!amt || amt <= 0) return
    quickDispatch({
      type: 'ADD_QUICK_ITEM',
      payload: {
        id: genId(),
        type: 'text',
        name: name.trim(),
        price: amt,
        note: itemNote.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
    })
    log('INFO', `quick text record: ${name.trim()} ${amt}`)
    setName('')
    setPrice('')
    setItemNote('')
  }

  const handleVoiceSave = useCallback(async (blob, duration) => {
    const id = genId()
    try {
      await saveRecording(id, blob, duration)
      quickDispatch({
        type: 'ADD_QUICK_ITEM',
        payload: {
          id,
          type: 'voice',
          name: '',
          price: 0,
          note: '',
          duration,
          date: new Date().toISOString().slice(0, 10),
        },
      })
      log('INFO', `quick voice record: ${fmtDuration(duration)}`)
    } catch (err) {
      log('ERROR', `failed to save voice recording: ${err}`)
      alert('فشل حفظ التسجيل الصوتي. قد تكون سعة التخزين ممتلئة.')
    }
  }, [quickDispatch])

  const handleDelete = async (index) => {
    const item = quickState.items[index]
    const label = item.type === 'voice' ? 'التسجيل الصوتي' : 'هذا التدوين'
    if (confirm(`حذف ${label}؟`)) {
      if (item.type === 'voice') {
        try { await deleteRecording(item.id) } catch (err) {
          log('ERROR', `deleteRecording failed: ${err}`)
        }
      }
      quickDispatch({ type: 'DEL_QUICK_ITEM', payload: index })
      log('INFO', `deleted quick item index=${index}`)
    }
  }

  const textItems = quickState.items.filter(i => i.type !== 'voice')
  const voiceItems = quickState.items.filter(i => i.type === 'voice')

  return (
    <>
      <div className="quick-tabs">
        <button className={`quick-tab${tab === 'text' ? ' active' : ''}`} onClick={() => setTab('text')}>
          تدوين كتابي
        </button>
        <button className={`quick-tab${tab === 'voice' ? ' active' : ''}`} onClick={() => setTab('voice')}>
          تدوين صوتي
        </button>
      </div>

      {tab === 'text' ? (
        <div className="quick-input-area">
          <div className="form-group">
            <label>اسم الغرض</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: ممسحة أرضية" />
          </div>
          <div className="form-group">
            <label>الثمن (د.ج)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="مثال: 550" min="1" />
          </div>
          <div className="form-group">
            <label>ملاحظة (اختياري)</label>
            <textarea value={itemNote} onChange={e => setItemNote(e.target.value)} placeholder="..." />
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={handleTextSubmit}>
            <Plus size={16} /> إضافة تدوين
          </button>
        </div>
      ) : (
        <div className="quick-input-area">
          <VoiceRecorder onSave={handleVoiceSave} />
        </div>
      )}

      {voiceItems.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Headphones size={16} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: 'var(--text-body)', fontWeight: 700 }}>التسجيلات الصوتية</h2>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-light)', marginRight: 'auto' }}>
              {voiceItems.length}
            </span>
          </div>
          <div className="quick-list">
            {voiceItems.map(item => {
              const realIndex = quickState.items.indexOf(item)
              return (
                <VoiceItem key={item.id} item={item} index={realIndex} onDelete={handleDelete} onArchive={(idx) => setArchiveTarget({ item: quickState.items[idx], index: idx })} />
              )
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: voiceItems.length > 0 ? 16 : 0 }}>
        <h2 style={{ fontSize: 'var(--text-body)', fontWeight: 700 }}>التدوينات الكتابية</h2>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-light)' }}>
          {textItems.length} تدوين
        </span>
      </div>

      {textItems.length === 0 ? (
        <div className="empty-state">
          <p>لا توجد تدوينات كتابية بعد</p>
        </div>
      ) : (
        <div className="quick-list">
          {textItems.map(item => {
            const realIndex = quickState.items.indexOf(item)
            return (
              <div key={item.id} className="quick-item">
                <div className="qi-info">
                  <div className="qi-name">{item.name}</div>
                  {item.price > 0 && <div className="qi-price">{item.price.toLocaleString()} د.ج</div>}
                  <div className="qi-date">{item.date}</div>
                  {item.note && <div className="qi-note">{item.note}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="qi-archive-btn" onClick={() => setArchiveTarget({ item, index: realIndex })}>
                    <Archive size={14} /> أرشفة
                  </button>
                  <button className="qi-del-btn" onClick={() => handleDelete(realIndex)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <QuickArchiveForm
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        item={archiveTarget?.item || null}
        index={archiveTarget?.index ?? -1}
      />
    </>
  )
}
