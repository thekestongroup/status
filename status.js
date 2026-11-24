// Live checks run in the visitor's browser. A request with mode 'no-cors' can't read the
// response, but it succeeds only if DNS, TLS and the server all answer, and fails otherwise.
const SERVICES = [
  { id: 'id', name: 'Keston ID', url: 'https://id.keston.co/' },
  { id: 'admin', name: 'Keston Admin', url: 'https://admin.keston.co/' },
  { id: 'utilities', name: 'Keston Utilities', url: 'https://utilities.keston.co/' },
  { id: 'website', name: 'keston.co website', url: 'https://keston.co/' }
]
const el = (tag, props = {}, ...kids) => {
  const { dataset, ...rest } = props
  const n = Object.assign(document.createElement(tag), rest)
  if (dataset) Object.assign(n.dataset, dataset)
  n.append(...kids)
  return n
}
const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
const LABEL = { investigating: 'Investigating', identified: 'Identified', monitoring: 'Monitoring', resolved: 'Resolved' }

async function ping(url) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 8000)
  try {
    await fetch(url + '?status-check=' + Date.now(), { mode: 'no-cors', cache: 'no-store', credentials: 'omit', signal: ctl.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function loadIncidents() {
  try {
    const res = await fetch('incidents.json', { cache: 'no-store' })
    return res.ok ? (await res.json()).incidents ?? [] : []
  } catch {
    return []
  }
}

function incidentBlock(inc) {
  const list = el('ul')
  for (const u of [...inc.updates].reverse()) list.append(el('li', {}, el('time', { dateTime: u.time }, fmt(u.time)), u.text))
  return el('div', { className: 'inc' }, el('h3', {}, `${inc.title} — ${LABEL[inc.status] ?? inc.status}`), list)
}

async function run() {
  const banner = document.getElementById('banner')
  banner.dataset.s = 'checking'
  banner.textContent = 'Checking our services…'
  const [incidents, results] = await Promise.all([loadIncidents(), Promise.all(SERVICES.map((s) => ping(s.url)))])
  const open = incidents.filter((i) => i.status !== 'resolved')
  const box = document.getElementById('services')
  box.replaceChildren()
  let anyDown = false
  SERVICES.forEach((svc, i) => {
    const up = results[i]
    const mine = open.filter((inc) => inc.services.includes(svc.id))
    const down = !up || mine.length > 0
    anyDown ||= down
    const state = !up ? 'Not responding' : mine.length ? 'Issue reported' : 'Operational'
    const row = el('div', { className: 'svc' }, el('div', {}, el('strong', {}, svc.name), el('span', { className: 'pill', dataset: { s: down ? 'down' : 'ok' } }, state)))
    for (const inc of mine) row.append(incidentBlock(inc))
    // Down but nobody has written it up yet.
    if (!up && !mine.length) row.append(el('div', { className: 'inc' }, el('p', {}, 'We could not reach this service from your browser. If it is down for everyone we will post what is happening here. Check again in a minute, or contact support.')))
    box.append(row)
  })
  banner.dataset.s = anyDown ? 'down' : 'ok'
  banner.textContent = anyDown ? 'Some services have problems' : 'All services are running'
  const cutoff = Date.now() - 30 * 864e5
  const past = incidents.filter((i) => i.status === 'resolved' && new Date(i.updates.at(-1).time) > cutoff)
  const pastBox = document.getElementById('past')
  pastBox.replaceChildren(...(past.length ? past.map(incidentBlock) : [el('p', {}, 'None in the last 30 days.')]))
  document.getElementById('when').textContent = `Checked ${fmt(new Date().toISOString())}.`
}

document.getElementById('recheck').addEventListener('click', run)
run()
setInterval(run, 60000)
