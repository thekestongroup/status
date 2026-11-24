export interface Service {
  id: string
  name: string
  url: string
}

/** The services the page checks. The ids are what an incident's `services` list refers to. */
export const SERVICES: Service[] = [
  { id: 'id', name: 'Keston ID', url: 'https://id.keston.co/' },
  { id: 'admin', name: 'Keston Admin', url: 'https://admin.keston.co/' },
  { id: 'utilities', name: 'Keston Utilities', url: 'https://utilities.keston.co/' }
]
