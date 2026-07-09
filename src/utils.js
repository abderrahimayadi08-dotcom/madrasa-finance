let _counter = Date.now()
export function genId() {
  return (++_counter).toString(36)
}

export function fmt(n) {
  return new Intl.NumberFormat('ar-DZ').format(n) + ' د.ج'
}

export function computeFundAt(initial, entries, date) {
  let fund = initial || 0
  for (const e of entries) {
    if (e.date <= date) fund += e.type === 'income' ? e.amount : -e.amount
  }
  return fund
}

export function computeCurrentFund(initial, entries) {
  return computeFundAt(initial, entries, '9999-12-31')
}

export function computeSectionNet(entries, sectionId) {
  let net = 0
  for (const e of entries) {
    if (e.sectionId === sectionId) net += e.type === 'income' ? e.amount : -e.amount
  }
  return net
}

export function computeTripNet(d) {
  if (!d) return 0
  const inc = (d.received || 0) + (d.grants || []).reduce((s, g) => s + (g.amount || 0), 0)
  const exp = (d.transportCost || 0) + (d.supplies || []).reduce((s, sp) => s + (sp.cost || 0), 0)
  return inc - exp
}

export function computeMaintNet(d) {
  if (!d) return 0
  const inc = (d.grants || []).reduce((s, g) => s + (g.amount || 0), 0)
  const exp = (d.purchases || []).reduce((s, p) => s + (p.price || 0), 0) + (d.workerPay || 0)
  return inc - exp
}

export const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
const _logQueue = []
let _logFlushing = false

function flushLogs() {
  if (!_logFlushing) return
  _logFlushing = false
  if (_logQueue.length) {
    const batch = _logQueue.splice(0)
    batch.forEach(l => console[l.level](`[${l.ts}] ${l.msg}`))
  }
}

export function log(level, msg) {
  _logQueue.push({ ts: new Date().toISOString(), level, msg })
  if (!_logFlushing) {
    _logFlushing = true
    setTimeout(flushLogs, 0)
  }
}
