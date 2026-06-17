'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Listen for online events to flush queued writes
        window.addEventListener('online', () => {
          reg.active?.postMessage({ type: 'flush' })
        })
      })
      .catch(() => {
        // SW registration failed — app still works online
      })
  }, [])
  return null
}
