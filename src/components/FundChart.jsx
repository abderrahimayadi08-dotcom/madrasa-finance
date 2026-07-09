import { useState, useMemo, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApp } from '../store.jsx'
import { computeFundAt, fmt } from '../utils.js'

const CHART_KEY = 'madrasa-finance-chart'

const granularities = [
  { value: 'day', label: 'أيام' },
  { value: 'week', label: 'أسابيع' },
  { value: 'month', label: 'أشهر' },
]

function getWeekId(d) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  const y = dt.getFullYear()
  const start = new Date(y, 0, 1)
  const diff = (dt - start) / 86400000
  return y + '-W' + String(Math.ceil((diff + start.getDay() + 1) / 7)).padStart(2, '0')
}

function getMonthId(d) { return d.slice(0, 7) }

function addStep(date, gran) {
  const d = new Date(date + 'T00:00:00Z')
  if (isNaN(d.getTime())) return date
  if (gran === 'day') d.setUTCDate(d.getUTCDate() + 1)
  else if (gran === 'week') d.setUTCDate(d.getUTCDate() + 7)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function loadChartPrefs(today, defaultFrom) {
  try {
    const d = localStorage.getItem(CHART_KEY)
    if (d) {
      const p = JSON.parse(d)
      return { from: p.from || defaultFrom, to: p.to || today, gran: p.gran || 'week' }
    }
  } catch (_) {}
  return { from: defaultFrom, to: today, gran: 'week' }
}

function saveChartPrefs(from, to, gran) {
  try { localStorage.setItem(CHART_KEY, JSON.stringify({ from, to, gran })) } catch (_) {}
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>{payload[0].payload.label}</p>
      <p style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function FundChart() {
  const { state } = useApp()
  const { settings, entries } = state
  const today = new Date().toISOString().slice(0, 10)
  const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

  const [from, setFrom] = useState(threeMonthsAgo)
  const [to, setTo] = useState(today)
  const [gran, setGran] = useState('week')
  const fromRef = useRef(from)
  const toRef = useRef(to)
  const granRef = useRef(gran)
  fromRef.current = from; toRef.current = to; granRef.current = gran

  useEffect(() => {
    const saved = loadChartPrefs(today, threeMonthsAgo)
    setFrom(saved.from); setTo(saved.to); setGran(saved.gran)
  }, [])

  const handleFrom = (val) => { setFrom(val); saveChartPrefs(val, toRef.current, granRef.current) }
  const handleTo = (val) => { setTo(val); saveChartPrefs(fromRef.current, val, granRef.current) }
  const handleGran = (val) => { setGran(val); saveChartPrefs(fromRef.current, toRef.current, val) }

  const data = useMemo(() => {
    const pts = []
    let cur = from
    const seen = new Set()
    if (!cur || !to || cur > to) return pts
    while (cur <= to) {
      let key
      if (gran === 'day') key = cur
      else if (gran === 'week') key = getWeekId(cur)
      else key = getMonthId(cur)

      if (!seen.has(key)) {
        seen.add(key)
        const fund = computeFundAt(settings.initialGeneralFund, entries, cur)
        pts.push({ date: cur, value: fund, label: key })
      }
      cur = addStep(cur, gran)
    }
    return pts
  }, [entries, settings.initialGeneralFund, from, to, gran])

  return (
    <div className="chart-card">
      <div className="chart-controls">
        <input type="date" value={from} onChange={e => handleFrom(e.target.value)} />
        <input type="date" value={to} onChange={e => handleTo(e.target.value)} />
        <select value={gran} onChange={e => handleGran(e.target.value)}>
          {granularities.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>
      {data.length > 1 ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#1B6B5E" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#1B6B5E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">بيانات غير كافية للرسم البياني</div>
      )}
    </div>
  )
}
