/* ══════════════════════════════════════════════════════════════
   FENN / NOOK NOTCH DYNAMIC ISLAND - renderer.js
   ══════════════════════════════════════════════════════════════ */

const island  = document.getElementById('island')
const pill    = document.getElementById('pill')
const panel   = document.getElementById('panel')

const NOTCH_W = 210
const NOTCH_H = 34
const EXPAN_W = 560
const EXPAN_H = 320

let isExpanded = false

// ─── EXPAND / COLLAPSE ───────────────────────────────────────
function expandIsland() {
  if (isExpanded) return
  isExpanded = true
  island.classList.add('expanded')
  window.api.expand({ w: EXPAN_W, h: EXPAN_H })
}

function collapseIsland() {
  if (!isExpanded) return
  isExpanded = false
  island.classList.remove('expanded')
  window.api.collapse()
  // Reset back to dashboard view on collapse
  switchView('dashboard')
}

pill.addEventListener('click', (e) => {
  e.stopPropagation()
  isExpanded ? collapseIsland() : expandIsland()
})

document.addEventListener('click', (e) => {
  if (isExpanded && !island.contains(e.target)) collapseIsland()
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') collapseIsland()
})

// ─── VIEW SWITCHING (Dashboard, Media, System, Calendar, Notes) ─
function switchView(viewName) {
  document.querySelectorAll('.fenn-view').forEach(v => v.classList.remove('active'))
  const target = document.getElementById('view-' + viewName)
  if (target) target.classList.add('active')
}

// Back buttons
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const backTo = btn.dataset.back || 'dashboard'
    switchView(backTo)
  })
})

// Card triggers to sub-views
document.getElementById('card-media-open').addEventListener('click', (e) => {
  e.stopPropagation()
  switchView('media')
})
document.getElementById('btn-open-media').addEventListener('click', (e) => {
  e.stopPropagation()
  switchView('media')
})
document.getElementById('btn-open-sys').addEventListener('click', (e) => {
  e.stopPropagation()
  switchView('system')
})
document.getElementById('dash-ram-circle').addEventListener('click', (e) => {
  e.stopPropagation()
  switchView('system')
})
document.getElementById('btn-open-cal').addEventListener('click', (e) => {
  e.stopPropagation()
  switchView('calendar')
})
document.getElementById('card-notes-open').addEventListener('click', (e) => {
  e.stopPropagation()
  switchView('notes')
})

// ─── CLOCK ───────────────────────────────────────────────────
function updateClock() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  document.getElementById('pill-time').textContent = `${hh}:${mm}`
}
updateClock()
setInterval(updateClock, 1000)

// ─── TIMER LOGIC ─────────────────────────────────────────────
let timerSeconds = 25 * 60
let timerInterval = null
let timerActive = false
const timerVal = document.getElementById('timer-val')
const timerToggle = document.getElementById('t-toggle')

function renderTimer() {
  const m = Math.floor(timerSeconds / 60)
  const s = timerSeconds % 60
  timerVal.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

timerToggle.addEventListener('click', (e) => {
  e.stopPropagation()
  timerActive = !timerActive
  timerToggle.textContent = timerActive ? '⏸' : '▶'
  if (timerActive) {
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--
        renderTimer()
      } else {
        clearInterval(timerInterval)
        timerActive = false
        timerToggle.textContent = '▶'
      }
    }, 1000)
  } else {
    clearInterval(timerInterval)
  }
})

document.getElementById('t-plus').addEventListener('click', (e) => {
  e.stopPropagation()
  timerSeconds += 5 * 60
  renderTimer()
})
document.getElementById('t-minus').addEventListener('click', (e) => {
  e.stopPropagation()
  if (timerSeconds >= 5 * 60) timerSeconds -= 5 * 60
  renderTimer()
})

// ─── COFFEE (KEEP AWAKE) TOGGLE ──────────────────────────────
const coffeeCheck = document.getElementById('coffee-check')
const coffeeSub   = document.getElementById('coffee-sub')
let wakeLockObj   = null

coffeeCheck.addEventListener('change', async (e) => {
  e.stopPropagation()
  if (coffeeCheck.checked) {
    coffeeSub.textContent = 'Always'
    try {
      if ('wakeLock' in navigator) wakeLockObj = await navigator.wakeLock.request('screen')
    } catch {}
  } else {
    coffeeSub.textContent = 'Off'
    if (wakeLockObj) { wakeLockObj.release(); wakeLockObj = null }
  }
})

// ─── SPOTIFY / MEDIA INTEGRATION & LYRICS ────────────────────
const currentTrack = {
  title: 'TAKA LA DENTRO',
  artist: 'SEKIMANE',
  art: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
  durationSec: 89,
  currentSec: 25,
  isPlaying: true
}

function updateMediaViews() {
  // Dash card
  document.getElementById('dash-track-title').textContent = currentTrack.title
  document.getElementById('dash-track-artist').textContent = currentTrack.artist
  document.getElementById('pill-track-name').textContent = currentTrack.title
  document.getElementById('dash-album-art').src = currentTrack.art
  
  // Full view
  document.getElementById('full-track-title').textContent = currentTrack.title
  document.getElementById('full-track-artist').textContent = currentTrack.artist
  document.getElementById('full-album-art').src = currentTrack.art
}
updateMediaViews()

// Query live Windows audio if running
async function checkLiveSpotify() {
  try {
    const live = await window.api.getMediaInfo()
    if (live && live.title) {
      if (live.title !== currentTrack.title) {
        currentTrack.title = live.title
        currentTrack.artist = live.artist || 'Unknown'
        updateMediaViews()
      }
    }
  } catch {}
}
setInterval(checkLiveSpotify, 4000)

// Lyrics auto scroll simulation
const lyricsScroll = document.getElementById('lyrics-scroll')
let lyricLines = document.querySelectorAll('.l-line')
let activeLyricIdx = 2

setInterval(() => {
  if (!currentTrack.isPlaying) return
  lyricLines.forEach(l => l.classList.remove('active'))
  activeLyricIdx = (activeLyricIdx + 1) % lyricLines.length
  lyricLines[activeLyricIdx].classList.add('active')
  lyricLines[activeLyricIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
}, 3500)

// ─── SYSTEM MONITOR (CANVAS CHARTS & STATS) ──────────────────
async function updateSysData() {
  try {
    const info = await window.api.sysinfo()
    const memPct = Math.round(((info.totalMem - info.freeMem) / info.totalMem) * 100)
    
    // Dash RAM
    document.getElementById('dash-ram-pct').textContent = `${memPct}%`
    
    // System view stats
    document.getElementById('sys-mem-pct').textContent = `${memPct}%`
    document.getElementById('sys-mem-meta').textContent = `${(info.totalMem - info.freeMem).toFixed(1)} GB of ${info.totalMem} GB in use`
    document.getElementById('mem-fill-bar').style.width = `${memPct}%`
    
    const cpuEl = document.getElementById('sys-cpu-pct')
    if (cpuEl) {
      const randCpu = Math.floor(Math.random() * 8) + 4
      cpuEl.textContent = `${randCpu}%`
    }
  } catch {}
}
updateSysData()
setInterval(updateSysData, 3000)

// Draw subtle sparkline charts
function drawSparkline(canvasId, color) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  let points = Array.from({length: 20}, () => Math.random() * (h - 8) + 4)
  ctx.clearRect(0, 0, w, h)
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  
  points.forEach((p, idx) => {
    const x = (idx / (points.length - 1)) * w
    if (idx === 0) ctx.moveTo(x, p)
    else ctx.lineTo(x, p)
  })
  ctx.stroke()
}
drawSparkline('cpu-chart', '#35C79E')
drawSparkline('net-chart', '#35C79E')

// ─── CALENDAR DAYS GENERATOR ─────────────────────────────────
function generateCalendar() {
  const calGrid = document.getElementById('fenn-cal-grid')
  calGrid.innerHTML = ''
  
  // Pad previous days
  for (let i = 29; i <= 30; i++) {
    const el = document.createElement('div')
    el.className = 'c-day dim'
    el.textContent = i
    calGrid.appendChild(el)
  }
  // Days 1..31
  for (let d = 1; d <= 31; d++) {
    const el = document.createElement('div')
    el.className = 'c-day'
    if (d === 16) el.classList.add('today')
    el.textContent = d
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      document.querySelectorAll('.c-day').forEach(cd => cd.classList.remove('today'))
      el.classList.add('today')
      document.getElementById('cal-selected-num').textContent = `${d} December`
    })
    calGrid.appendChild(el)
  }
}
generateCalendar()

// ─── NOTES PERSISTENCE ───────────────────────────────────────
const noteInput    = document.getElementById('fenn-note-input')
const dashNoteText = document.getElementById('dash-notes-text')
const niTitle      = document.getElementById('ni-preview-title')

noteInput.value = localStorage.getItem('fenn_note') || ''
if (noteInput.value.trim()) {
  const firstLine = noteInput.value.split('\n')[0]
  dashNoteText.textContent = firstLine
  niTitle.textContent = firstLine
}

noteInput.addEventListener('input', () => {
  localStorage.setItem('fenn_note', noteInput.value)
  const firstLine = noteInput.value.trim().split('\n')[0] || 'Write Something...'
  dashNoteText.textContent = firstLine
  niTitle.textContent = firstLine.length > 14 ? firstLine.slice(0, 14) + '…' : firstLine
})

// ─── MOCHI DRAG & DROP FILE INGESTION ────────────────────────
const mochiBar  = document.getElementById('mochi-drop-bar')
const mochiFill = document.getElementById('mochi-eat-fill')
const mochiText = document.getElementById('mochi-status-text')

document.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (!isExpanded) expandIsland()
  mochiBar.classList.add('show')
  mochiText.textContent = 'Mochi is ready to eat file! Drop here...'
})

document.addEventListener('dragleave', (e) => {
  if (!island.contains(e.relatedTarget)) {
    mochiBar.classList.remove('show')
  }
})

document.addEventListener('drop', (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (!file) return

  mochiText.textContent = `Nom nom! Eating ${file.name}…`
  let progress = 0
  const eatTimer = setInterval(() => {
    progress += 15
    mochiFill.style.width = `${progress}%`
    if (progress >= 100) {
      clearInterval(eatTimer)
      mochiText.textContent = `✨ ${file.name} successfully digested!`
      setTimeout(() => {
        mochiBar.classList.remove('show')
        mochiFill.style.width = '0%'
      }, 1800)
    }
  }, 120)
})
