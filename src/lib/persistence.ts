/**
 * Unified persistence layer for TLK Hub.
 *
 * Source of truth = Supabase. localStorage is a read-only offline cache.
 *
 * Pattern:
 *   1. Read: try network → on success, update cache + return data
 *            on failure (offline), fall back to cache
 *   2. Write: try network first
 *              on success, update cache in background
 *              on failure, queue in IndexedDB via SW message; show offline indicator
 *
 * Components should NOT touch localStorage directly. They go through these helpers.
 */

import { supabase } from './supabase'

const CACHE_PREFIX = 'tlk-cache-'

/** Try to read from Supabase, fall back to cached value on network error */
export async function readWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cacheKey = CACHE_PREFIX + key
  try {
    const fresh = await fetcher()
    // Update cache in background — don't await, don't block on storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: fresh }))
      } catch { /* quota exceeded, ignore */ }
    }
    return fresh
  } catch (e) {
    // Network failure — try cache
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const { data } = JSON.parse(cached)
          return data as T
        } catch { /* corrupted cache, ignore */ }
      }
    }
    throw e
  }
}

/** Read only from cache (for instant first-paint before network resolves) */
export function readCacheOnly<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const cached = localStorage.getItem(CACHE_PREFIX + key)
  if (!cached) return null
  try {
    const { data } = JSON.parse(cached)
    return data as T
  } catch {
    return null
  }
}

/** Write to Supabase. On success, update local cache. On failure, queue for replay. */
export async function writeWithCache<T>(
  key: string,
  data: T,
  writer: () => Promise<void>
): Promise<{ ok: boolean; queued: boolean }> {
  try {
    await writer()
    // Update cache after successful write
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }))
      } catch { /* ignore */ }
    }
    return { ok: true, queued: false }
  } catch (e) {
    // Write failed — queue in IndexedDB via service worker
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'queue-write',
        url: `/api/cache-write?key=${encodeURIComponent(key)}`,
        method: 'POST',
        body: JSON.stringify(data),
      })
    }
    // Also update local cache optimistically so UI doesn't lose state
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data, dirty: true }))
      } catch { /* ignore */ }
    }
    return { ok: false, queued: true }
  }
}

/** Invalidate cache for a key (after deletes or to force refetch) */
export function invalidateCache(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_PREFIX + key)
}

/** Check if user has unsynced writes (best-effort) */
export function hasDirtyWrites(): boolean {
  if (typeof window === 'undefined') return false
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const { dirty } = JSON.parse(localStorage.getItem(key) || '{}')
        if (dirty) return true
      } catch { /* ignore */ }
    }
  }
  return false
}

/** Migrate legacy localStorage keys to the cache system. Run once on app load. */
export function migrateLegacyCache(): void {
  if (typeof window === 'undefined') return
  const migrations: Record<string, string> = {
    'tlk-songs-v2': 'songs',
    'tlk-songs': 'songs-legacy',
    'tlk-setlists-v2': 'setlists',
    'tlk-setlists': 'setlists-legacy',
    'tlk-events-v2': 'events',
    'tlk-instrument': 'profile.instrument',
    'tlk-band-id': 'profile.bandId',
  }
  for (const [oldKey, newKey] of Object.entries(migrations)) {
    const value = localStorage.getItem(oldKey)
    if (value && !localStorage.getItem(CACHE_PREFIX + newKey)) {
      try {
        // Try to parse as JSON, fall back to raw string
        const parsed = JSON.parse(value)
        localStorage.setItem(CACHE_PREFIX + newKey, JSON.stringify({ ts: Date.now(), data: parsed, migrated: true }))
      } catch {
        localStorage.setItem(CACHE_PREFIX + newKey, JSON.stringify({ ts: Date.now(), data: value, migrated: true }))
      }
      localStorage.removeItem(oldKey)
    }
  }
}
