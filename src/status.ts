export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export interface Incident {
  id: string
  title: string
  services: string[]
  status: IncidentStatus
  updates: { time: string; text: string }[]
}

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved'
}

/**
 * Whether a service answers from this browser. A 'no-cors' request can't read the response, but it only
 * succeeds if DNS, TLS and the server all answer, so a rejection means it can't be reached.
 */
export async function reachable(url: string, timeoutMs = 8000): Promise<boolean> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    await fetch(`${url}?status-check=${Date.now()}`, { mode: 'no-cors', cache: 'no-store', credentials: 'omit', signal: ctl.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function loadIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch('./incidents.json', { cache: 'no-store' })
    return res.ok ? ((await res.json()).incidents ?? []) : []
  } catch {
    return []
  }
}

export const formatTime = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
