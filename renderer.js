/* ══════════════════════════════════════════════
   DYNAMIC ISLAND FOR WINDOWS — renderer.js v2.0
   ══════════════════════════════════════════════ */

const island   = document.getElementById('island')
const pill     = document.getElementById('pill')
const closeBtn = document.getElementById('close-btn')

const EXPAND_W = 460
const EXPAND_H = 400

let expanded = false

// ─── EXPAND / COLLAPSE ───────────────────────────────────────────
function expand() {
  if (expanded) return
  expanded = true
  island.classList.add('expanded')
  window.api.expand({ w: EXPAND_W, h: EXPAND_H })
}

function collapse() {
  if (!expanded) return
  expanded = false
  island.classList.remove('expanded')
  window.api.collapse()
}

pill.addEventListener('click', e => {
  e.stopPropagation()
  expanded ? collapse() : expand()
})
closeBtn.addEventListener('click', e => { e.stopPropagation(); collapse() })
document.addEventListener('click', e => {
  if (expanded && !island.contains(e.target)) collapse()
})
document.addEventListener('keydown', e => { if (e.key === 'Escape') collapse() })

// ─── CLOCK ───────────────────────────────────────────────────────
function updateClock() {
  const now = new Date()
  const hh  = String(now.getHours()).padStart(2,'0')
  const mm  = String(now.getMinutes()).padStart(2,'0')
  const t   = `${hh}:${mm}`
  document.getElementById('pill-time').textContent = t
  document.getElementById('ph-time').textContent   = t

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  document.getElementById('ph-date').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
}
updateClock()
setInterval(updateClock, 1000)

// ─── TABS ─────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active')
  })
})

// ─── SLIDERS ─────────────────────────────────────────────────────
function updateTrack(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100
  slider.style.setProperty('--pct', pct + '%')
}

const volSlider    = document.getElementById('vol-slider')
const volVal       = document.getElementById('vol-val')
const brightSlider = document.getElementById('bright-slider')
const brightVal    = document.getElementById('bright-val')
const seekBar      = document.getElementById('seek-bar')

volSlider.addEventListener('input', () => {
  volVal.textContent = volSlider.value + '%'
  updateTrack(volSlider)
})
brightSlider.addEventListener('input', () => {
  brightVal.textContent = brightSlider.value + '%'
  updateTrack(brightSlider)
})
seekBar.addEventListener('input', () => updateTrack(seekBar))

;[volSlider, brightSlider, seekBar].forEach(s => {
  updateTrack(s)
  s.addEventListener('click', e => e.stopPropagation())
})

// ─── TIMER ───────────────────────────────────────────────────────
let timerRunning = false, timerSecs = 0, timerIv = null
const timerDisplay = document.getElementById('timer-display')
const timerBtn     = document.getElementById('timer-btn')

const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

timerBtn.addEventListener('click', e => {
  e.stopPropagation()
  timerRunning = !timerRunning
  timerBtn.textContent = timerRunning ? '⏸' : '▶'
  if (timerRunning) {
    timerIv = setInterval(() => { timerSecs++; timerDisplay.textContent = fmt(timerSecs) }, 1000)
  } else {
    clearInterval(timerIv)
  }
})
timerDisplay.addEventListener('dblclick', e => {
  e.stopPropagation()
  clearInterval(timerIv); timerRunning = false; timerSecs = 0
  timerDisplay.textContent = '00:00'; timerBtn.textContent = '▶'
})

// ─── CAFFEINE ────────────────────────────────────────────────────
const caffeineTgl  = document.getElementById('caffeine-toggle')
const caffStat     = document.getElementById('caffeine-status')
const caffTile     = document.getElementById('tile-caffeine')
let wakeLock = null

caffeineTgl.addEventListener('change', async () => {
  if (caffeineTgl.checked) {
    caffStat.textContent = 'ON ☕'
    caffTile.classList.add('on')
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen') } catch {}
  } else {
    caffStat.textContent = 'OFF'
    caffTile.classList.remove('on')
    if (wakeLock) { wakeLock.release(); wakeLock = null }
  }
})

// ─── NOTES ───────────────────────────────────────────────────────
const notesArea  = document.getElementById('notes-area')
const notesCount = document.getElementById('notes-count')

notesArea.value = localStorage.getItem('di-notes') || ''
updateWordCount()

notesArea.addEventListener('input', () => { localStorage.setItem('di-notes', notesArea.value); updateWordCount() })
notesArea.addEventListener('click', e => e.stopPropagation())
notesArea.addEventListener('keydown', e => e.stopPropagation())

function updateWordCount() {
  const w = notesArea.value.trim() ? notesArea.value.trim().split(/\s+/).length : 0
  notesCount.textContent = `${w} word${w !== 1 ? 's' : ''}`
}

document.getElementById('notes-clear').addEventListener('click', e => {
  e.stopPropagation()
  notesArea.value = ''
  localStorage.removeItem('di-notes')
  updateWordCount()
})

// ─── CALENDAR ────────────────────────────────────────────────────
let calY, calM
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function renderCalendar() {
  document.getElementById('cal-title').textContent = `${MONTHS[calM]} ${calY}`
  const grid  = document.getElementById('cal-grid')
  const today = new Date()
  grid.innerHTML = ''

  let startDay = new Date(calY, calM, 1).getDay() - 1
  if (startDay < 0) startDay = 6

  const prevDays = new Date(calY, calM, 0).getDate()
  const curDays  = new Date(calY, calM + 1, 0).getDate()

  for (let i = startDay - 1; i >= 0; i--) {
    const d = document.createElement('div')
    d.className = 'cal-day other-month'
    d.textContent = prevDays - i
    grid.appendChild(d)
  }
  for (let d = 1; d <= curDays; d++) {
    const el = document.createElement('div')
    el.className = 'cal-day'
    el.textContent = d
    if (d === today.getDate() && calM === today.getMonth() && calY === today.getFullYear())
      el.classList.add('today')
    el.addEventListener('click', e => e.stopPropagation())
    grid.appendChild(el)
  }
  const rem = grid.children.length % 7 === 0 ? 0 : 7 - grid.children.length % 7
  for (let i = 1; i <= rem; i++) {
    const d = document.createElement('div')
    d.className = 'cal-day other-month'
    d.textContent = i
    grid.appendChild(d)
  }
}

;(function initCal() {
  const now = new Date(); calY = now.getFullYear(); calM = now.getMonth()
  renderCalendar()
})()

document.getElementById('cal-prev').addEventListener('click', e => {
  e.stopPropagation(); calM--; if (calM < 0) { calM = 11; calY-- }; renderCalendar()
})
document.getElementById('cal-next').addEventListener('click', e => {
  e.stopPropagation(); calM++; if (calM > 11) { calM = 0; calY++ }; renderCalendar()
})

// ─── SYSTEM INFO ─────────────────────────────────────────────────
async function loadSysInfo() {
  try {
    const info = await window.api.sysinfo()
    document.getElementById('sys-cpu').textContent    = `${info.cpus} cores`
    document.getElementById('sys-ram').textContent    = `${info.freeMem} / ${info.totalMem} GB`
    document.getElementById('sys-uptime').textContent = `${info.uptime}h`
  } catch {}
}
loadSysInfo()
setInterval(loadSysInfo, 30000)

// ─── MEDIA / SPOTIFY ─────────────────────────────────────────────
const playlist = [
  { title: 'Midnight City',    artist: 'M83',              art: '🌃', color: '#6366f1' },
  { title: 'Blinding Lights',  artist: 'The Weeknd',       art: '💡', color: '#f59e0b' },
  { title: 'Levitating',       artist: 'Dua Lipa',         art: '🪩', color: '#ec4899' },
  { title: 'Heat Waves',       artist: 'Glass Animals',    art: '🌊', color: '#06b6d4' },
  { title: 'Stay',             artist: 'Kid LAROI',        art: '💜', color: '#8b5cf6' },
]
const lyrics = [
  ['♪ Waiting in a car ♪', 'Waiting for a ride in the dark'],
  ['♪ Blinded by the lights ♪', "Can't sleep until I feel your touch"],
  ['♪ I got you, moonlight ♪', "You're my starlight"],
  ['♪ Breathe me in ♪', 'Breathe me out'],
  ['♪ I\'ll always want you ♪', 'Stay'],
]

let mediaIdx = 0, mediaPlay = false, seekTimer = null

function renderMedia(fromSpotify = false) {
  const track = playlist[mediaIdx]
  const artEl  = document.getElementById('media-art')
  const srcEl  = document.getElementById('media-source')

  artEl.innerHTML = track.art
  document.getElementById('media-title').textContent  = track.title
  document.getElementById('media-artist').textContent = track.artist
  seekBar.value = 0; updateTrack(seekBar)

  if (fromSpotify) {
    srcEl.innerHTML = '<span class="sp-dot"></span> Spotify'
    srcEl.style.display = 'flex'
    artEl.classList.add('playing')
  }

  const ly = lyrics[mediaIdx]
  document.getElementById('lyrics-box').innerHTML = `
    <p class="lyric-line active">${ly[0]}</p>
    <p class="lyric-line muted">${ly[1]}</p>
  `
  // Update pill spotify mini info
  document.getElementById('pill-spotify-text').textContent = `${track.title} — ${track.artist}`
}
renderMedia()

function startSeek() {
  seekTimer = setInterval(() => {
    const v = parseInt(seekBar.value)
    if (v >= 100) { nextTrack() } else { seekBar.value = v + 1; updateTrack(seekBar) }
  }, 500)
}
function stopSeek() { clearInterval(seekTimer) }

document.getElementById('btn-play').addEventListener('click', e => {
  e.stopPropagation()
  mediaPlay = !mediaPlay
  document.getElementById('btn-play').textContent = mediaPlay ? '⏸' : '▶'
  document.getElementById('media-art').classList.toggle('playing', mediaPlay)
  const pillSp = document.getElementById('pill-spotify')
  pillSp.classList.toggle('show', mediaPlay)
  mediaPlay ? startSeek() : stopSeek()
})

function nextTrack() { mediaIdx = (mediaIdx+1)%playlist.length; renderMedia(); if(mediaPlay){stopSeek();startSeek()} }
function prevTrack() { mediaIdx = (mediaIdx-1+playlist.length)%playlist.length; renderMedia(); if(mediaPlay){stopSeek();startSeek()} }

document.getElementById('btn-next').addEventListener('click', e => { e.stopPropagation(); nextTrack() })
document.getElementById('btn-prev').addEventListener('click', e => { e.stopPropagation(); prevTrack() })
document.getElementById('btn-shuffle').addEventListener('click', e => {
  e.stopPropagation(); mediaIdx = Math.floor(Math.random()*playlist.length); renderMedia()
})

// Poll Windows media session for Spotify
async function pollSpotify() {
  try {
    const info = await window.api.getMediaInfo()
    if (info && info.title) {
      // Find or add to playlist
      const existing = playlist.findIndex(p => p.title === info.title)
      if (existing >= 0) {
        mediaIdx = existing
      } else {
        playlist.unshift({ title: info.title, artist: info.artist || 'Unknown', art: '🎵', color: '#1DB954' })
        lyrics.unshift(['♪ ' + info.title + ' ♪', info.artist || ''])
        mediaIdx = 0
      }
      renderMedia(true)
      document.getElementById('btn-play').textContent = '⏸'
      mediaPlay = true
      document.getElementById('media-art').classList.add('playing')
      document.getElementById('pill-spotify').classList.add('show')
    }
  } catch {}
}
setInterval(pollSpotify, 5000)
pollSpotify()

// ─── THEME ───────────────────────────────────────────────────────
const savedAccent = localStorage.getItem('di-accent')
if (savedAccent) applyAccent(savedAccent)

function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color)
  // Derive accent2 (lighter)
  document.documentElement.style.setProperty('--glow', color + '40')
}

document.querySelectorAll('.theme-dot').forEach(dot => {
  dot.addEventListener('click', e => {
    e.stopPropagation()
    const c = dot.dataset.color
    applyAccent(c)
    localStorage.setItem('di-accent', c)
    document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'))
    dot.classList.add('active')
  })
})

// ─── MOCHI + FILE DROP ───────────────────────────────────────────
const dropZone      = document.getElementById('drop-zone')
const emailComposer = document.getElementById('email-composer')
const dzIcon        = document.getElementById('dz-icon')
const dzText        = document.getElementById('dz-text')

// Add progress elements
const progDiv = document.createElement('div'); progDiv.id = 'upload-progress'
const progBar = document.createElement('div'); progBar.id = 'upload-bar'
progDiv.appendChild(progBar); dropZone.after(progDiv)

const statDiv = document.createElement('div'); statDiv.id = 'upload-status'
statDiv.innerHTML = '<span id="stat-name"></span><span id="stat-pct"></span>'
progDiv.after(statDiv)

function spawnParticles(x, y, count = 8) {
  const emojis = ['✨','⭐','💫','🌟','✦']
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'eat-particle'
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)]
    p.style.left = x + 'px'; p.style.top = y + 'px'
    const angle = (i / count) * Math.PI * 2
    const dist  = 30 + Math.random() * 40
    p.style.setProperty('--tx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--ty', Math.sin(angle) * dist + 'px')
    document.body.appendChild(p)
    setTimeout(() => p.remove(), 800)
  }
}

document.addEventListener('dragenter', e => {
  e.preventDefault()
  // Switch to Mochi tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'))
  document.querySelector('[data-tab="mochi"]').classList.add('active')
  document.getElementById('tab-mochi').classList.add('active')
  expand()
})

document.addEventListener('dragover', e => {
  e.preventDefault()
  dropZone.classList.remove('drop-idle'); dropZone.classList.add('drop-active')
  dzIcon.textContent = '😮'; dzText.textContent = 'Drop it! Mochi is hungry!'
  document.querySelector('.mochi-mouth').textContent = 'ᗒᗕ'
})

document.addEventListener('dragleave', e => {
  if (!island.contains(e.relatedTarget)) {
    dropZone.classList.remove('drop-active'); dropZone.classList.add('drop-idle')
    dzIcon.textContent = '📎'; dzText.textContent = 'Drop a file on Mochi'
    document.querySelector('.mochi-mouth').textContent = '‿'
  }
})

document.addEventListener('drop', e => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (!file) return

  dropZone.classList.remove('drop-active'); dropZone.classList.add('drop-idle')
  dzIcon.textContent = '😋'; dzText.textContent = `Mochi is eating ${file.name}…`
  document.querySelector('.mochi-mouth').textContent = 'ᗒᗛᗕ'

  // Spawn particles at drop location
  spawnParticles(e.clientX - island.getBoundingClientRect().left, 60, 10)

  // Animated progress
  const prog   = document.getElementById('upload-progress')
  const bar    = document.getElementById('upload-bar')
  const stat   = document.getElementById('upload-status')
  const statN  = document.getElementById('stat-name')
  const statP  = document.getElementById('stat-pct')

  prog.style.display = 'block'; stat.style.display = 'flex'
  statN.textContent = file.name.length > 20 ? file.name.slice(0,18)+'…' : file.name

  let pct = 0
  const iv = setInterval(() => {
    pct += Math.random() * 12 + 3
    if (pct >= 100) {
      pct = 100; clearInterval(iv)
      statP.textContent = '100%'
      bar.style.width = '100%'
      setTimeout(() => {
        prog.style.display = 'none'; stat.style.display = 'none'
        bar.style.width = '0%'
        dzIcon.textContent = '😌'; dzText.textContent = 'Delicious!'
        document.querySelector('.mochi-mouth').textContent = '‿'
        // Show email composer
        setTimeout(() => {
          dropZone.classList.add('hidden')
          emailComposer.classList.remove('hidden')
          document.getElementById('ec-filename').textContent = `  —  ${file.name}`
          document.getElementById('ec-subject').value = file.name
        }, 700)
      }, 400)
    } else {
      pct = Math.min(pct, 99)
      bar.style.width = pct + '%'
      statP.textContent = Math.round(pct) + '%'
    }
  }, 100)
})

document.getElementById('ec-send').addEventListener('click', e => {
  e.stopPropagation()
  emailComposer.classList.add('hidden')
  dropZone.classList.remove('hidden')
  dzIcon.textContent = '😴'; dzText.textContent = 'Email sent! Mochi is sleepy…'
  document.querySelector('.mochi-mouth').textContent = '^ ^'
  setTimeout(() => {
    dzIcon.textContent = '📎'; dzText.textContent = 'Drop a file on Mochi'
    document.querySelector('.mochi-mouth').textContent = '‿'
  }, 3000)
})

document.getElementById('ec-cancel').addEventListener('click', e => {
  e.stopPropagation()
  emailComposer.classList.add('hidden')
  dropZone.classList.remove('hidden')
  dzIcon.textContent = '📎'; dzText.textContent = 'Drop a file on Mochi'
})

;['ec-to','ec-subject','ec-body'].forEach(id => {
  const el = document.getElementById(id)
  el.addEventListener('click', e => e.stopPropagation())
  el.addEventListener('keydown', e => e.stopPropagation())
})
