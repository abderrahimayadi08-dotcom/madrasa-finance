import { createContext, useContext, useReducer, useEffect } from 'react'

const defaults = {
  sections: [],
  entries: [],
  upcoming: [],
  settings: { initialGeneralFund: 20000, tripSupplies: ['اكراميات', 'ماء', 'وجبات خفيفة', 'هدايا'], notifEnabled: false, notifInterval: 1 }
}

export function getVaultKey() {
  const activeId = localStorage.getItem('madrasa-finance-active-vault')
  if (activeId) return `madrasa-finance-vault-${activeId}`
  return 'madrasa-finance'
}

export function load() {
  try {
    const d = localStorage.getItem(getVaultKey())
    if (d) return { ...defaults, ...JSON.parse(d) }
  } catch (_) {}
  return { ...defaults }
}

function save(state) {
  try { localStorage.setItem(getVaultKey(), JSON.stringify(state)) } catch (_) {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_SECTION':
      return { ...state, sections: [...state.sections, action.payload] }
    case 'DEL_SECTION':
      return { ...state, sections: state.sections.filter(s => s.id !== action.payload), entries: state.entries.filter(e => e.sectionId !== action.payload) }
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] }
    case 'UPD_ENTRY':
      return { ...state, entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DEL_ENTRY':
      return { ...state, entries: state.entries.filter(e => e.id !== action.payload) }
    case 'ADD_UPCOMING':
      return { ...state, upcoming: [...state.upcoming, action.payload] }
    case 'DEL_UPCOMING':
      return { ...state, upcoming: state.upcoming.filter(u => u.id !== action.payload) }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'REPLACE_STATE':
      return action.payload
    case 'SWITCH_VAULT':
      return load()
    default:
      return state
  }
}

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  useEffect(() => { save(state) }, [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useApp() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp needs AppProvider')
  return c
}
