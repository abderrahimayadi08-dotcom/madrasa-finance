import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { saveRecording, deleteRecording } from './audioDB.js'
import { log } from './utils.js'

const KEY = 'madrasa-finance-quick-record'
const defaults = { items: [] }

function load() {
  try {
    const d = localStorage.getItem(KEY)
    if (d) return { ...defaults, ...JSON.parse(d) }
  } catch (_) {}
  return { ...defaults }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (_) {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_QUICK_ITEM':
      return { ...state, items: [action.payload, ...state.items] }
    case 'DEL_QUICK_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.payload) }
    case 'CLEAN_AUDIO_DATA':
      return {
        ...state,
        items: state.items.map(it => {
          if (it.type === 'voice' && it.audioData) {
            const { audioData, ...rest } = it
            return rest
          }
          return it
        }),
      }
    default:
      return state
  }
}

const Ctx = createContext(null)

export function QuickProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  const migrated = useRef(false)

  useEffect(() => { save(state) }, [state])

  useEffect(() => {
    if (migrated.current) return
    migrated.current = true

    const migrate = async () => {
      const toMigrate = state.items.filter(it => it.type === 'voice' && it.audioData)
      if (toMigrate.length === 0) return

      let count = 0
      for (const it of toMigrate) {
        try {
          const response = await fetch(it.audioData)
          const blob = await response.blob()
          await saveRecording(it.id, blob, it.duration || 0)
          count++
        } catch (err) {
          log('ERROR', `migration failed for voice item ${it.id}: ${err}`)
        }
      }

      if (count > 0) {
        dispatch({ type: 'CLEAN_AUDIO_DATA' })
        log('INFO', `migrated ${count} voice recording(s) from base64 to IndexedDB`)
      }
    }

    migrate()
  }, [])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useQuick() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useQuick needs QuickProvider')
  return c
}
