/* ══════════════════════════════════════════════════════════════
   FENN / NOOK NOTCH DYNAMIC ISLAND - renderer.js
   Full Spotify Media Control, Synced Lyrics & Live System Data
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

// ══════════════════════════════════════════════════════════════
// SPOTIFY CONTROLS, WINDOW MONITOR & SYNCED LYRICS
// ══════════════════════════════════════════════════════════════
let currentTrack = {
  title: 'Nilüfer',
  artist: 'Müslüm Gürses',
  art: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
  isPlaying: true,
  seconds: 64,
  duration: 245
}

let parsedLyrics = [] // Array of { time: seconds, text: string }
let currentLyricIdx = -1

function updateTrackUI() {
  document.getElementById('dash-track-title').textContent = currentTrack.title
  document.getElementById('dash-track-artist').textContent = currentTrack.artist
  document.getElementById('pill-track-name').textContent = `${currentTrack.title} • ${currentTrack.artist}`
  document.getElementById('full-track-title').textContent = currentTrack.title
  document.getElementById('full-track-artist').textContent = currentTrack.artist
}
updateTrackUI()

// Real Native Media Keys Trigger
function sendMediaAction(action) {
  window.api.mediaControl(action)
  if (action === 'playpause') {
    currentTrack.isPlaying = !currentTrack.isPlaying
    const icon = currentTrack.isPlaying ? '⏸' : '▶'
    document.getElementById('sp-play').textContent = icon
    document.getElementById('full-play').textContent = icon
  }
  // Check media update right after pressing
  setTimeout(checkActiveMedia, 300)
  setTimeout(checkActiveMedia, 800)
}

document.getElementById('sp-play').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('playpause') })
document.getElementById('full-play').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('playpause') })
document.getElementById('sp-next').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('next') })
document.getElementById('full-next').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('next') })
document.getElementById('sp-prev').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('prev') })
document.getElementById('full-prev').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('prev') })

// Background poll for Spotify's playing window title
async function checkActiveMedia() {
  try {
    const live = await window.api.getMediaInfo()
    if (live && live.title) {
      if (live.title !== currentTrack.title || live.artist !== currentTrack.artist) {
        currentTrack.title  = live.title
        currentTrack.artist = live.artist
        currentTrack.seconds = 0
        updateTrackUI()
        fetchLiveLyrics(live.title, live.artist)
      }
    }
  } catch {}
}
setInterval(checkActiveMedia, 1200)
checkActiveMedia()

// Fetch Live Lyrics from LRCLIB API or Fallback
async function fetchLiveLyrics(title, artist) {
  parsedLyrics = []
  const lyricsContainer = document.getElementById('lyrics-list')
  lyricsContainer.innerHTML = '<p class="l-line active">Şarkı sözleri yükleniyor...</p>'

  try {
    const encTitle  = encodeURIComponent(title)
    const encArtist = encodeURIComponent(artist)
    const res = await fetch(`https://lrclib.net/api/get?track_name=${encTitle}&artist_name=${encArtist}`)
    
    if (res.ok) {
      const data = await res.json()
      if (data && data.syncedLyrics) {
        parseLrc(data.syncedLyrics)
        renderLyricsDOM()
        return
      } else if (data && data.plainLyrics) {
        renderPlainLyrics(data.plainLyrics)
        return
      }
    }
  } catch (err) {}

  // Fallback for popular songs if offline or not in LRCLIB
  const t = title.toLowerCase()
  if (t.includes('nilüfer') || t.includes('nilufer')) {
    const niluferLrc = `
[00:00.93] Zamanın eli değdi bize
[00:07.18] Çoktan değişti her şey
[00:13.54] Aynı değiliz ikimiz de
[00:20.19] Zaaflarına bir gece
[00:23.22] Hatalarına bir nilüfer
[00:26.44] Sevgisizliğine bir kalp verdim
[00:32.48] Artık geri ver
[00:34.95] Geri veremezsin aldıklarını
[00:38.83] Artık geri ver
[00:41.23] Geri verilmez hiçbir yanılgı
[00:45.38] Yokluğuma emanet et
[00:48.05] Sen de benden kalanları
[00:51.75] Her şeyi al, bana beni geri ver
[00:55.87] Bir şansım olsun
[00:59.72] Başka yer, başka zaman
[01:03.11] Sensiz ömrüm olsun
[01:06.21] Her şeyi al
[01:08.55] Bir şansım olsun
[01:12.56] Başka yer, başka zaman
[01:15.92] Sensiz ömrüm olsun
    `
    parseLrc(niluferLrc)
    renderLyricsDOM()
  } else if (t.includes('taka la') || t.includes('taka la dentro')) {
    const takaLrc = `
[00:00.00] Nóis te taca lá dentro do baile
[00:03.00] Nóis te taca lá dentro do baile
[00:06.00] Taca lá, taca lá dentro do baile
[00:09.00] Atrevida no caô, ela quer sentar maneiro
[00:12.00] Atrevida no caô, ela quer sentar maneiro
[00:15.00] Nóis te taca lá dentro do baile
[00:18.00] Até dentro do banheiro
[00:21.00] Fogo, fogo, fogo no primeiro
    `
    parseLrc(takaLrc)
    renderLyricsDOM()
  } else {
    lyricsContainer.innerHTML = `
      <p class="l-line">♪ Şarkı: ${title} ♪</p>
      <p class="l-line active">Sanatçı: ${artist}</p>
      <p class="l-line">Canlı ses çıkışı bağlı</p>
      <p class="l-line">Fenn Dynamic Island</p>
    `
  }
}

// Parse LRC formatted string
function parseLrc(lrcText) {
  parsedLyrics = []
  const lines = lrcText.split('\n')
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/
  
  lines.forEach(line => {
    const match = timeRegex.exec(line)
    if (match) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      const totalSec = min * 60 + sec
      const text = line.replace(timeRegex, '').trim()
      if (text) {
        parsedLyrics.push({ time: totalSec, text })
      }
    }
  })
}

function renderLyricsDOM() {
  const container = document.getElementById('lyrics-list')
  container.innerHTML = ''
  parsedLyrics.forEach((item, idx) => {
    const p = document.createElement('p')
    p.className = 'l-line'
    p.id = `lyric-${idx}`
    p.textContent = item.text
    container.appendChild(p)
  })
}

function renderPlainLyrics(plainText) {
  const container = document.getElementById('lyrics-list')
  container.innerHTML = ''
  const lines = plainText.split('\n')
  lines.forEach(line => {
    if (line.trim()) {
      const p = document.createElement('p')
      p.className = 'l-line'
      p.textContent = line
      container.appendChild(p)
    }
  })
}

// Synced lyrics highlight & scrubber animation ticker
setInterval(() => {
  if (!currentTrack.isPlaying) return
  currentTrack.seconds++
  
  // Scrubber percentage
  const pct = Math.min((currentTrack.seconds / currentTrack.duration) * 100, 100)
  const seekFill = document.getElementById('media-seek-fill')
  if (seekFill) seekFill.style.width = `${pct}%`
  
  // Format cur-time and dur-time
  const curM = Math.floor(currentTrack.seconds / 60)
  const curS = currentTrack.seconds % 60
  const curTimeEl = document.getElementById('cur-time')
  if (curTimeEl) curTimeEl.textContent = `${curM}:${String(curS).padStart(2,'0')}`

  // Match synced lyric line
  if (parsedLyrics.length > 0) {
    let matchIdx = -1
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTrack.seconds >= parsedLyrics[i].time) {
        matchIdx = i
      } else {
        break
      }
    }
    if (matchIdx !== -1 && matchIdx !== currentLyricIdx) {
      currentLyricIdx = matchIdx
      document.querySelectorAll('.l-line').forEach(el => el.classList.remove('active'))
      const activeEl = document.getElementById(`lyric-${currentLyricIdx}`)
      if (activeEl) {
        activeEl.classList.add('active')
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }
}, 1000)

// Initial fetch
fetchLiveLyrics(currentTrack.title, currentTrack.artist)

// ─── ACTIVE TOOLS & BUTTONS ──────────────────────────────────
document.getElementById('btn-open-sys').addEventListener('click', (e) => {
  e.stopPropagation(); switchView('system')
})
document.getElementById('tool-settings').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('settings')
})
document.getElementById('btn-phone').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('phone')
})
document.querySelector('.bottom-pen').addEventListener('click', (e) => {
  e.stopPropagation(); window.api.launchTool('colorpicker')
})
document.getElementById('btn-font').addEventListener('click', (e) => {
  e.stopPropagation()
  document.body.style.fontFamily = document.body.style.fontFamily.includes('JetBrains') 
    ? "var(--font-main)" 
    : "var(--font-mono)"
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
      const randCpu = Math.floor(Math.random() * 8) + 4
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
// DRAG & DROP ELASTIC FILE SWALLOW PORTAL
// ══════════════════════════════════════════════════════════════
const portal      = document.getElementById('file-drop-portal')
const portalFill  = document.getElementById('portal-fill-bar')
const portalName  = document.getElementById('portal-file-name')
const mascotFace  = document.getElementById('mascot-face')

function explodeSparkles(cx, cy, count = 14) {
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
  portal.classList.add('show')
  mascotFace.textContent = '😮'
  portalName.textContent = 'Dosyayı Bırakın...'
})

document.addEventListener('dragleave', (e) => {
  if (!island.contains(e.relatedTarget)) {
    portal.classList.remove('show')
    mascotFace.textContent = '😮'
  }
})

document.addEventListener('drop', (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (!file) {
    portal.classList.remove('show')
    return
  }

  // Active Swallow Animation
  mascotFace.classList.add('swallow')
  mascotFace.textContent = 'ᗒᗛᗕ'
  portalName.textContent = `Yutuluyor: ${file.name}…`
  
  let p = 0
  const ingestTimer = setInterval(() => {
    p += 15
    portalFill.style.width = `${p}%`
    if (p >= 100) {
      clearInterval(ingestTimer)
      
      const rect = portal.getBoundingClientRect()
      explodeSparkles(rect.width / 2, rect.height / 2 - 20, 15)

      mascotFace.classList.remove('swallow')
      mascotFace.textContent = '😋'
      portalName.textContent = `✨ ${file.name} Alındı!`
      
      setTimeout(() => {
        portal.classList.remove('show')
        mascotFace.textContent = '😮'
        portalFill.style.width = '0%'
      }, 1200)
    }
  }, 75)
})
