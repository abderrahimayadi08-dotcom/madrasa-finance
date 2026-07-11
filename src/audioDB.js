import { log } from './utils.js'

const DB_NAME = 'madrasa-finance-audio'
const STORE = 'recordings'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      log('ERROR', `IndexedDB open failed: ${req.error}`)
      reject(req.error)
    }
  })
}

export async function saveRecording(id, blob, duration) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ id, blob, duration })
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => {
      log('ERROR', `saveRecording ${id} failed: ${tx.error}`)
      db.close(); reject(tx.error)
    }
  })
}

export async function getRecording(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => { db.close(); resolve(req.result ? req.result.blob : null) }
    req.onerror = () => {
      log('ERROR', `getRecording ${id} failed: ${req.error}`)
      db.close(); reject(req.error)
    }
  })
}

export async function deleteRecording(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => {
      log('ERROR', `deleteRecording ${id} failed: ${tx.error}`)
      db.close(); reject(tx.error)
    }
  })
}
