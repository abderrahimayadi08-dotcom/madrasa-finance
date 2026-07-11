import { useState, useMemo, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { FileText } from 'lucide-react'
import { useApp } from '../store.jsx'
import { computeFundAt, fmt, computeSectionNet } from '../utils.js'

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
  const { sections, settings, entries } = state
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
      <button className="btn-sm" style={{ marginTop: 8, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }} onClick={() => {
        const w = window.open('', '_blank')
        const secRows = sections.map(s => ({ name: s.name, net: computeSectionNet(entries, s.id) }))
        const filtered = entries.filter(e => e.date >= from && e.date <= to)
        const totalInc = filtered.reduce((s, e) => s + (e.type === 'income' ? e.amount : 0), 0)
        const totalExp = filtered.reduce((s, e) => s + (e.type === 'expense' ? e.amount : 0), 0)
        w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>تقرير مالية المدرسة</title><style>
          body{font-family:'Segoe UI',sans-serif;margin:20px;color:#111;direction:rtl}
          h1{color:#1B6B5E;font-size:22px;margin-bottom:4px}
          .period{color:#6B7280;font-size:13px;margin-bottom:20px}
          table{width:100%;border-collapse:collapse;margin-bottom:20px}
          th,td{padding:8px 10px;text-align:center;border:1px solid #E5E7EB;font-size:13px}
          th{background:#1B6B5E;color:#fff;font-weight:600}
          .inc{color:#16A34A;font-weight:600}
          .exp{color:#DC2626;font-weight:600}
          .total-row{background:#F3F4F6;font-weight:700}
          h2{font-size:16px;margin:20px 0 10px;color:#1B6B5E;border-bottom:2px solid #1B6B5E;padding-bottom:4px}
          .summary{display:flex;gap:20px;margin-bottom:20px}
          .summary-card{flex:1;padding:12px;border-radius:8px;text-align:center;font-weight:700;font-size:15px}
          .summary-card.inc{background:#DCFCE7;color:#16A34A}
          .summary-card.exp{background:#FEE2E2;color:#DC2626}
          .summary-card.net{background:#E8F3F0;color:#1B6B5E}
          @media print{body{margin:10mm}button{display:none}}
        </style></head><body>
          <h1>تقرير مالية المدرسة</h1>
          <div class="period">${from} → ${to}</div>
          <div class="summary">
            <div class="summary-card inc">المداخيل<br>${fmt(totalInc)}</div>
            <div class="summary-card exp">المخارج<br>${fmt(totalExp)}</div>
            <div class="summary-card net">الصافي<br>${fmt(totalInc - totalExp)}</div>
          </div>
          <h2>ملخص الأقسام</h2>
          <table><thead><tr><th>القسم</th><th>الصافي</th></tr></thead><tbody>
            ${secRows.filter(r => r.net !== 0).map(r => `<tr><td>${r.name}</td><td class="${r.net > 0 ? 'inc' : 'exp'}">${fmt(r.net)}</td></tr>`).join('')}
          </tbody></table>
          <h2>كل الحركات (${from} → ${to})</h2>
          <table><thead><tr><th>التاريخ</th><th>القسم</th><th>البيان</th><th>النوع</th><th>المبلغ</th></tr></thead><tbody>
            ${filtered.sort((a,b) => a.date.localeCompare(b.date)).map(e => {
              const sec = sections.find(s => s.id === e.sectionId)
              return `<tr><td>${e.date}</td><td>${sec ? sec.name : '—'}</td><td>${e.note || '—'}</td><td>${e.type === 'income' ? 'مدخول' : 'مخرج'}</td><td class="${e.type === 'income' ? 'inc' : 'exp'}">${fmt(e.amount)}</td></tr>`
            }).join('')}
          </tbody></table>
          <button onclick="window.print()" style="padding:10px 24px;background:#1B6B5E;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">طباعة / حفظ PDF</button>
          <script>window.onload=function(){setTimeout(function(){window.print()},500)}</script>
        </body></html>`)
        w.document.close()
      }}>
        <FileText size={14} /> تقرير PDF
      </button>
      {data.length > 1 ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">بيانات غير كافية للرسم البياني</div>
      )}
    </div>
  )
}
