import { createContext, useContext, useState, useEffect } from 'react'
import { genId, computeCurrentFund, log } from './utils.js'
import { load as loadVaultData } from './store.jsx'

const Ctx = createContext(null)

function init() {
  let vaults = []
  try { vaults = JSON.parse(localStorage.getItem('madrasa-finance-vaults')) || [] } catch (_) {}
  if (!vaults.length) {
    const oldData = localStorage.getItem('madrasa-finance')
    const id = genId()
    vaults = [{ id, name: 'الرئيسية', createdAt: new Date().toISOString() }]
    localStorage.setItem('madrasa-finance-vaults', JSON.stringify(vaults))
    if (oldData) {
      localStorage.setItem(`madrasa-finance-vault-${id}`, oldData)
      localStorage.removeItem('madrasa-finance')
    } else {
      localStorage.setItem(`madrasa-finance-vault-${id}`, JSON.stringify(loadVaultData()))
    }
    localStorage.setItem('madrasa-finance-active-vault', id)
    log('INFO', 'created default vault')
  }
  const activeId = localStorage.getItem('madrasa-finance-active-vault')
  if (!activeId || !vaults.find(v => v.id === activeId)) {
    localStorage.setItem('madrasa-finance-active-vault', vaults[0].id)
  }
  return vaults
}

export function VaultProvider({ children }) {
  const [vaults, setVaults] = useState(init)

  const refreshVaults = () => {
    try { setVaults(JSON.parse(localStorage.getItem('madrasa-finance-vaults')) || []) } catch (_) {}
  }

  useEffect(() => { refreshVaults() }, [])

  const createVault = (name) => {
    const cur = loadVaultData()
    const fund = computeCurrentFund(cur.settings.initialGeneralFund, cur.entries)
    const id = genId()
    const newData = {
      sections: cur.sections || [],
      entries: [],
      upcoming: [],
      settings: { ...cur.settings, initialGeneralFund: fund }
    }
    localStorage.setItem(`madrasa-finance-vault-${id}`, JSON.stringify(newData))
    const updated = [...vaults, { id, name, createdAt: new Date().toISOString() }]
    localStorage.setItem('madrasa-finance-vaults', JSON.stringify(updated))
    setVaults(updated)
    localStorage.setItem('madrasa-finance-active-vault', id)
    log('INFO', `created vault: ${name}`)
    window.location.reload()
  }

  const switchVault = (id) => {
    if (id === localStorage.getItem('madrasa-finance-active-vault')) return
    localStorage.setItem('madrasa-finance-active-vault', id)
    log('INFO', `switched to vault: ${id}`)
    window.location.reload()
  }

  const renameVault = (id, name) => {
    const updated = vaults.map(v => v.id === id ? { ...v, name } : v)
    localStorage.setItem('madrasa-finance-vaults', JSON.stringify(updated))
    setVaults(updated)
    log('INFO', `renamed vault ${id} to ${name}`)
  }

  const deleteVault = (id) => {
    if (vaults.length <= 1) { alert('لا يمكن حذف آخر تخزينة'); return }
    const updated = vaults.filter(v => v.id !== id)
    localStorage.setItem('madrasa-finance-vaults', JSON.stringify(updated))
    localStorage.removeItem(`madrasa-finance-vault-${id}`)
    setVaults(updated)
    if (localStorage.getItem('madrasa-finance-active-vault') === id) {
      localStorage.setItem('madrasa-finance-active-vault', updated[0].id)
      window.location.reload()
    }
    log('INFO', `deleted vault: ${id}`)
  }

  const activeVault = vaults.find(v => v.id === localStorage.getItem('madrasa-finance-active-vault')) || vaults[0]

  return <Ctx.Provider value={{ vaults, activeVault, createVault, switchVault, renameVault, deleteVault }}>{children}</Ctx.Provider>
}

export function useVault() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useVault needs VaultProvider')
  return c
}
