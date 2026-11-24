<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AppLauncher, Button, Card, Footer, Header, Badge } from '@thekestongroup/ui'
import { SERVICES } from './services'
import { formatTime, loadIncidents, reachable, STATUS_LABEL, type Incident } from './status'

const footer = { appName: 'Keston status', version: __APP_VERSION__, build: __APP_BUILD__ || undefined }

const checking = ref(true)
const checkedAt = ref('')
const incidents = ref<Incident[]>([])
const up = ref<Record<string, boolean>>({})

async function run() {
  checking.value = true
  const [list, results] = await Promise.all([loadIncidents(), Promise.all(SERVICES.map((s) => reachable(s.url)))])
  incidents.value = list
  up.value = Object.fromEntries(SERVICES.map((s, i) => [s.id, results[i]]))
  checkedAt.value = new Date().toISOString()
  checking.value = false
}

const open = computed(() => incidents.value.filter((i) => i.status !== 'resolved'))
const rows = computed(() =>
  SERVICES.map((svc) => {
    const reachableNow = up.value[svc.id] ?? true
    const mine = open.value.filter((i) => i.services.includes(svc.id))
    const state: 'ok' | 'issue' | 'down' = !reachableNow ? 'down' : mine.length ? 'issue' : 'ok'
    return { svc, state, mine, unreported: !reachableNow && !mine.length }
  })
)
const anyProblem = computed(() => rows.value.some((r) => r.state !== 'ok'))
const recent = computed(() => {
  const cutoff = Date.now() - 30 * 864e5
  return incidents.value.filter((i) => i.status === 'resolved' && i.updates.length && new Date(i.updates[i.updates.length - 1].time).getTime() > cutoff)
})
const LABEL = { ok: 'Operational', issue: 'Issue reported', down: 'Not responding' } as const
const COLOUR = { ok: 'green', issue: 'red', down: 'red' } as const

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  run()
  timer = setInterval(run, 60000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background text-black">
    <Header title="Keston status" :sign-in="false">
      <template #trailing><AppLauncher /></template>
    </Header>
    <main class="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 class="text-3xl font-bold">Service status</h1>

      <p
        role="status"
        :class="[
          'mt-4 rounded-lg border border-black/15 border-l-8 bg-white p-4 text-lg font-bold',
          checking && !checkedAt ? 'border-l-yellow' : anyProblem ? 'border-l-red' : 'border-l-green'
        ]"
      >
        {{ checking && !checkedAt ? 'Checking our services…' : anyProblem ? 'Some services have problems' : 'All services are running' }}
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-black/65">
        <span v-if="checkedAt">Checked {{ formatTime(checkedAt) }}.</span>
        <Button size="sm" :disabled="checking" @click="run">Check again</Button>
      </div>

      <div class="mt-6 flex flex-col gap-4">
        <Card v-for="row in rows" :key="row.svc.id" :title="row.svc.name" :heading-level="2">
          <template #actions>
            <Badge :color="COLOUR[row.state]">{{ LABEL[row.state] }}</Badge>
          </template>
          <div v-for="inc in row.mine" :key="inc.id" class="mb-3 last:mb-0">
            <h3 class="font-bold">{{ inc.title }} <span class="font-normal text-black/65">— {{ STATUS_LABEL[inc.status] }}</span></h3>
            <ul class="mt-1 space-y-2 text-sm">
              <li v-for="u in [...inc.updates].reverse()" :key="u.time">
                <time class="block text-black/65" :datetime="u.time">{{ formatTime(u.time) }}</time>
                {{ u.text }}
              </li>
            </ul>
          </div>
          <p v-if="row.unreported" class="text-sm">
            We could not reach this service from your browser. If it is down for everyone we will post what is happening here. Check
            again in a minute, or contact support.
          </p>
          <p v-else-if="!row.mine.length" class="text-sm text-black/65">No problems reported.</p>
        </Card>
      </div>

      <h2 class="mt-10 text-xl font-bold">Recent incidents</h2>
      <p v-if="!recent.length" class="mt-2 text-sm text-black/65">None in the last 30 days.</p>
      <Card v-for="inc in recent" :key="inc.id" :title="inc.title" :description="STATUS_LABEL[inc.status]" :heading-level="3" class="mt-3">
        <ul class="space-y-2 text-sm">
          <li v-for="u in [...inc.updates].reverse()" :key="u.time">
            <time class="block text-black/65" :datetime="u.time">{{ formatTime(u.time) }}</time>
            {{ u.text }}
          </li>
        </ul>
      </Card>

      <p class="mt-10 text-sm text-black/65">
        These checks run in your browser, so they show whether <em>you</em> can reach each service. This page is hosted separately from the
        services it reports on, so it stays up when they do not.
      </p>
    </main>
    <Footer v-bind="footer" />
  </div>
</template>
