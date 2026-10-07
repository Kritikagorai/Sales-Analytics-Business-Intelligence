'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { buildRows } from './parse'
import type { Dataset, SalesRow } from './types'

const STORAGE_KEY = 'sales-insight-dataset'

let dataset: Dataset | null = null
let hydrated = false
const listeners = new Set<() => void>()

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY)
    if (saved) dataset = JSON.parse(saved) as Dataset
  } catch {
    dataset = null
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function persist() {
  try {
    if (dataset) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // File too big for sessionStorage: data stays in memory for this tab only.
  }
}

export function setDataset(next: Dataset | null) {
  dataset = next
  persist()
  emit()
}

export function updateDataset(patch: Partial<Dataset>) {
  if (!dataset) return
  setDataset({ ...dataset, ...patch })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  hydrate()
  return dataset
}

const getServerSnapshot = () => undefined

export function useDataset(): Dataset | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useSalesRows(): { dataset: Dataset | null | undefined; rows: SalesRow[] } {
  const current = useDataset()
  const rows = useMemo(
    () => (current ? buildRows(current.raw, current.mapping) : []),
    [current],
  )
  return { dataset: current, rows }
}
