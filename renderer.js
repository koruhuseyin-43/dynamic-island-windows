/* ══════════════════════════════════════════════════════════════
   FENN / NOOK NOTCH DYNAMIC ISLAND - renderer.js (Ultra Smooth & Active)
   ══════════════════════════════════════════════════════════════ */

const island    = document.getElementById('island')
const pill      = document.getElementById('pill')
const panel     = document.getElementById('panel')
const closeBtn  = document.getElementById('pill-close-btn')

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
  setTimeout(() => switchView('dashboard'), 200)
}

pill.addEventListener('click', (e) => {
  if (!isExpanded) {
    e.stopPropagation()
    expandIsland()
  }
})

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  collapseIsland()
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') collapseIsland()
})

// ─── VIEW SWITCHING ──────────────────────────────────────────
function switchView(viewName) {
  document.querySelectorAll('.fenn-view').forEach(v => v.classList.remove('active'))
  const target = document.getElementById('view-' + viewName)
  if (target) target.classList.add('active')
}

document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    switchView(btn.dataset.back || 'dashboard')
  })
})

document.getElementById('card-media-open').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('media')
})
document.getElementById('btn-open-media').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('media')
})
document.getElementById('btn-open-sys').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('system')
})
document.getElementById('dash-ram-circle').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('system')
})
document.getElementById('btn-open-cal').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('calendar')
})
document.getElementById('card-notes-open').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('notes')
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

// ─── DYNAMIC TIMER (WITH ANIMATED DIAL BORDER) ───────────────
const TOTAL_TIMER_SECS = 25 * 60
let timerSeconds = TOTAL_TIMER_SECS
let timerInterval = null
let timerActive = false
const timerVal = document.getElementById('timer-val')
const timerToggle = document.getElementById('t-toggle')
const dialCircle = document.querySelector('.dial-circle')

function renderTimer() {
  const m = Math.floor(timerSeconds / 60)
  const s = timerSeconds % 60
  timerVal.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  
  const pct = (timerSeconds / TOTAL_TIMER_SECS) * 360
  dialCircle.style.background = `conic-gradient(#FFFFFF ${pct}deg, rgba(255,255,255,0.08) 0deg)`
}
renderTimer()

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

// ─── COFFEE TOGGLE (KEEP AWAKE) ──────────────────────────────
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

// ─── SPOTIFY / MEDIA CONTROLS & REAL-TIME SYNC ──────────────
const currentTrack = {
  title: 'Nilüfer',
  artist: 'Müslüm Gürses',
  art: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
  isPlaying: true
}

function updateTrackUI() {
  document.getElementById('dash-track-title').textContent = currentTrack.title
  document.getElementById('dash-track-artist').textContent = currentTrack.artist
  document.getElementById('pill-track-name').textContent = `${currentTrack.title} • ${currentTrack.artist}`
  document.getElementById('full-track-title').textContent = currentTrack.title
  document.getElementById('full-track-artist').textContent = currentTrack.artist
}
updateTrackUI()

function triggerPlayPause(e) {
  e.stopPropagation()
  window.api.mediaControl('playpause')
  currentTrack.isPlaying = !currentTrack.isPlaying
  const icon = currentTrack.isPlaying ? '⏸' : '▶'
  document.getElementById('sp-play').textContent = icon
  document.getElementById('full-play').textContent = icon
}

function triggerNext(e) {
  e.stopPropagation()
  window.api.mediaControl('next')
  setTimeout(checkActiveMedia, 400)
}

function triggerPrev(e) {
  e.stopPropagation()
  window.api.mediaControl('prev')
  setTimeout(checkActiveMedia, 400)
}

document.getElementById('sp-play').addEventListener('click', triggerPlayPause)
document.getElementById('full-play').addEventListener('click', triggerPlayPause)
document.getElementById('sp-next').addEventListener('click', triggerNext)
document.getElementById('full-next').addEventListener('click', triggerNext)
document.getElementById('sp-prev').addEventListener('click', triggerPrev)
document.getElementById('full-prev').addEventListener('click', triggerPrev)

// Background poll for whatever is playing on Spotify (with UTF-8 support)
async function checkActiveMedia() {
  try {
    const live = await window.api.getMediaInfo()
    if (live && live.title) {
      if (live.title !== currentTrack.title || live.artist !== currentTrack.artist) {
        currentTrack.title  = live.title
        currentTrack.artist = live.artist
        updateTrackUI()
        updateLyricsForSong(live.title, live.artist)
      }
    }
  } catch {}
}
setInterval(checkActiveMedia, 1500)
checkActiveMedia()

function updateLyricsForSong(title, artist) {
  const container = document.getElementById('lyrics-scroll')
  const t = title.toLowerCase()
  if (t.includes('nilüfer') || t.includes('nilufer')) {
    container.innerHTML = `
      <p class="l-line">Yine karlar yağdı gönül dağıma</p>
      <p class="l-line active">Zaman durdu sanki gün batımında</p>
      <p class="l-line">Gülmedi bu bahtım karaymış yazı</p>
      <p class="l-line">İçimde sönmeyen bir ateş sızı</p>
      <p class="l-line">Unutmak kolay mı sevilen yüzü?</p>
      <p class="l-line">Her mevsim ayrılık, her bahar hüzün...</p>
    `
  } else if (t.includes('sebebi yar') || artist.toLowerCase().includes('blok3')) {
    container.innerHTML = `
      <p class="l-line">Dalıyo' gözlerim, yanıyo' yüreğim</p>
      <p class="l-line active">Kayıyo' yıldızlar, kanıyo' yaralarım</p>
      <p class="l-line">Ben delirmişim, kime ne ki?</p>
      <p class="l-line">Sebebi yar, sebebi yar...</p>
      <p class="l-line">Yine geceler zehir zıkkım</p>
      <p class="l-line">Gözümün önünde anılarım</p>
    `
  } else {
    container.innerHTML = `
      <p class="l-line">♪ Şarkı: ${title} ♪</p>
      <p class="l-line active">Sanatçı: ${artist}</p>
      <p class="l-line">Canlı ses çıkışı oynatılıyor</p>
      <p class="l-line">Dynamic island bağlı</p>
    `
  }
}

// ─── ACTIVE TOOLS & BUTTONS ──────────────────────────────────
document.getElementById('tool-volume').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('volume')
})
document.getElementById('tool-settings').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('settings')
})
document.getElementById('btn-phone').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('phone')
})
document.querySelector('.bottom-label').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('colorpicker')
})
document.getElementById('btn-font').addEventListener('click', (e) => {
  e.stopPropagation()
  document.body.style.fontFamily = document.body.style.fontFamily.includes('Space Grotesk') 
    ? "var(--font-main)" 
    : "var(--font-display)"
})

// ─── SYSTEM MONITOR STATS ────────────────────────────────────
async function updateSysData() {
  try {
    const info = await window.api.sysinfo()
    document.getElementById('dash-ram-pct').textContent = `${info.memPct}%`
    document.getElementById('sys-mem-pct').textContent = `${info.memPct}%`
    document.getElementById('sys-mem-meta').textContent = `${info.usedMem} GB of ${info.totalMem} GB in use`
    document.getElementById('mem-fill-bar').style.width = `${info.memPct}%`
    
    const cpuEl = document.getElementById('sys-cpu-pct')
    if (cpuEl) {
      const randCpu = Math.floor(Math.random() * 9) + 3
      cpuEl.textContent = `${randCpu}%`
    }
  } catch {}
}
updateSysData()
setInterval(updateSysData, 2000)

// Sparkline Charts
function drawSparkline(canvasId, color) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  let points = Array.from({length: 22}, () => Math.random() * (h - 10) + 5)
  ctx.clearRect(0, 0, w, h)
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.8
  
  points.forEach((p, idx) => {
    const x = (idx / (points.length - 1)) * w
    if (idx === 0) ctx.moveTo(x, p)
    else ctx.lineTo(x, p)
  })
  ctx.stroke()
}
drawSparkline('cpu-chart', '#35C79E')
drawSparkline('net-chart', '#35C79E')
setInterval(() => {
  drawSparkline('cpu-chart', '#35C79E')
  drawSparkline('net-chart', '#35C79E')
}, 2500)

// ─── CALENDAR DAYS GENERATOR ─────────────────────────────────
function generateCalendar() {
  const calGrid = document.getElementById('fenn-cal-grid')
  calGrid.innerHTML = ''
  
  for (let i = 29; i <= 30; i++) {
    const el = document.createElement('div')
    el.className = 'c-day dim'
    el.textContent = i
    calGrid.appendChild(el)
  }
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

// ══════════════════════════════════════════════════════════════
// REEL 3 MOCHI CHARACTER FILE INGESTION EFFECT
// ══════════════════════════════════════════════════════════════
const mochiPortal   = document.getElementById('mochi-portal')
const mochiTubeFill = document.getElementById('mochi-tube-fill')
const mochiFilename = document.getElementById('mochi-filename-text')
const mochiMouth    = document.getElementById('mochi-mouth-anim')

function explodeSparkles(cx, cy, count = 12) {
  const icons = ['✨', '⭐', '✦', '💫', '💖']
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div')
    s.className = 'sparkle-burst'
    s.textContent = icons[Math.floor(Math.random() * icons.length)]
    s.style.left = cx + 'px'
    s.style.top = cy + 'px'
    const angle = (i / count) * 2 * Math.PI
    const dist = 50 + Math.random() * 60
    s.style.setProperty('--tx', `${Math.cos(angle) * dist}px`)
    s.style.setProperty('--ty', `${Math.sin(angle) * dist}px`)
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 700)
  }
}

document.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (!isExpanded) expandIsland()
  mochiPortal.classList.add('show')
  mochiMouth.textContent = '😮'
  mochiMouth.classList.add('eating')
  mochiFilename.textContent = "Mochi dosyanızı bekliyor..."
})

document.addEventListener('dragleave', (e) => {
  if (!island.contains(e.relatedTarget)) {
    mochiPortal.classList.remove('show')
    mochiMouth.textContent = '‿'
    mochiMouth.classList.remove('eating')
  }
})

document.addEventListener('drop', (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (!file) {
    mochiPortal.classList.remove('show')
    mochiMouth.textContent = '‿'
    mochiMouth.classList.remove('eating')
    return
  }

  // Active eating state
  mochiMouth.textContent = 'ᗒᗛᗕ'
  mochiFilename.textContent = `Mochi yutuyor: ${file.name}…`
  
  let p = 0
  const chewTimer = setInterval(() => {
    p += 14
    mochiTubeFill.style.width = `${p}%`
    if (p >= 100) {
      clearInterval(chewTimer)
      
      const rect = mochiPortal.getBoundingClientRect()
      explodeSparkles(rect.width / 2, rect.height / 2 - 20, 14)

      mochiMouth.classList.remove('eating')
      mochiMouth.textContent = '😋'
      mochiFilename.textContent = `✨ ${file.name} afiyetle yendi!`
      setTimeout(() => {
        mochiPortal.classList.remove('show')
        mochiMouth.textContent = '‿'
        mochiTubeFill.style.width = '0%'
      }, 1400)
    }
  }, 80)
})
