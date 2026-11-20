/* ══════════════════════════════════════════════
   DYNAMIC ISLAND FOR WINDOWS — renderer.js
   ══════════════════════════════════════════════ */

const island   = document.getElementById('island')
const pill     = document.getElementById('pill')
const panel    = document.getElementById('panel')
const closeBtn = document.getElementById('close-btn')

const EXPAND_W = 480
const EXPAND_H = 390
const PILL_W   = 220
const PILL_H   = 36

let expanded = false

// ─── EXPAND / COLLAPSE ─────────────────────────────────────────
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

pill.addEventListener('click', () => expanded ? collapse() : expand())
closeBtn.addEventListener('click', collapse)

// Click outside to close
document.addEventListener('click', (e) => {
  if (expanded && !island.contains(e.target)) collapse()
})

// ─── CLOCK ─────────────────────────────────────────────────────
function updateClock() {
  const now = new Date()
  const hh  = String(now.getHours()).padStart(2,'0')
  const mm  = String(now.getMinutes()).padStart(2,'0')
  const timeStr = `${hh}:${mm}`

  document.getElementById('pill-time').textContent = timeStr
  document.getElementById('ph-time').textContent   = timeStr

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`
  document.getElementById('ph-date').textContent = dateStr
}
updateClock()
setInterval(updateClock, 1000)

// ─── TABS ───────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const id = btn.dataset.tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('tab-' + id).classList.add('active')
  })
})

// ─── VOLUME SLIDER ─────────────────────────────────────────────
const volSlider  = document.getElementById('vol-slider')
const volVal     = document.getElementById('vol-val')

function updateSliderTrack(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100
  slider.style.setProperty('--pct', pct + '%')
}

volSlider.addEventListener('input', () => {
  volVal.textContent = volSlider.value + '%'
  updateSliderTrack(volSlider)
})
updateSliderTrack(volSlider)

// ─── BRIGHTNESS SLIDER ─────────────────────────────────────────
const brightSlider = document.getElementById('bright-slider')
const brightVal    = document.getElementById('bright-val')

brightSlider.addEventListener('input', () => {
  brightVal.textContent = brightSlider.value + '%'
  updateSliderTrack(brightSlider)
})
updateSliderTrack(brightSlider)

// ─── SEEK BAR ──────────────────────────────────────────────────
const seekBar = document.getElementById('seek-bar')
seekBar.addEventListener('input', () => updateSliderTrack(seekBar))
updateSliderTrack(seekBar)

// ─── TIMER ─────────────────────────────────────────────────────
let timerRunning = false
let timerSeconds = 0
let timerInterval = null
const timerDisplay = document.getElementById('timer-display')
const timerBtn     = document.getElementById('timer-btn')

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

timerBtn.addEventListener('click', e => {
  e.stopPropagation()
  timerRunning = !timerRunning
  timerBtn.textContent = timerRunning ? '⏸' : '▶'
  if (timerRunning) {
    timerInterval = setInterval(() => {
      timerSeconds++
      timerDisplay.textContent = formatTime(timerSeconds)
    }, 1000)
  } else {
    clearInterval(timerInterval)
  }
})

// Double-click timer to reset
timerDisplay.addEventListener('dblclick', e => {
  e.stopPropagation()
  timerRunning = false
  clearInterval(timerInterval)
  timerSeconds = 0
  timerDisplay.textContent = '00:00'
  timerBtn.textContent = '▶'
})

// ─── CAFFEINE TOGGLE ───────────────────────────────────────────
const caffeineTgl    = document.getElementById('caffeine-toggle')
const caffeineStatus = document.getElementById('caffeine-status')
const caffeineTile   = document.getElementById('tile-caffeine')
let wakeLock = null

caffeineTgl.addEventListener('change', async () => {
  if (caffeineTgl.checked) {
    caffeineStatus.textContent = 'ON'
    caffeineTile.classList.add('active')
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
      }
    } catch {}
  } else {
    caffeineStatus.textContent = 'OFF'
    caffeineTile.classList.remove('active')
    if (wakeLock) { wakeLock.release(); wakeLock = null }
  }
})

// ─── NOTES ─────────────────────────────────────────────────────
const notesArea  = document.getElementById('notes-area')
const notesCount = document.getElementById('notes-count')
const notesClear = document.getElementById('notes-clear')

// Load from localStorage
notesArea.value = localStorage.getItem('di-notes') || ''
updateWordCount()

notesArea.addEventListener('input', () => {
  localStorage.setItem('di-notes', notesArea.value)
  updateWordCount()
})
notesArea.addEventListener('click', e => e.stopPropagation())
notesArea.addEventListener('keydown', e => e.stopPropagation())

function updateWordCount() {
  const words = notesArea.value.trim() ? notesArea.value.trim().split(/\s+/).length : 0
  notesCount.textContent = `${words} word${words !== 1 ? 's' : ''}`
}

notesClear.addEventListener('click', e => {
  e.stopPropagation()
  notesArea.value = ''
  localStorage.removeItem('di-notes')
  updateWordCount()
})

// ─── CALENDAR ──────────────────────────────────────────────────
let calYear, calMonth
function initCalendar() {
  const now = new Date()
  calYear  = now.getFullYear()
  calMonth = now.getMonth()
  renderCalendar()
}

function renderCalendar() {
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
  document.getElementById('cal-title').textContent = `${months[calMonth]} ${calYear}`

  const grid = document.getElementById('cal-grid')
  grid.innerHTML = ''

  const today   = new Date()
  const first   = new Date(calYear, calMonth, 1)
  let startDay  = first.getDay() - 1 // Monday-first
  if (startDay < 0) startDay = 6
  const daysInMonth   = new Date(calYear, calMonth + 1, 0).getDate()
  const daysInPrev    = new Date(calYear, calMonth, 0).getDate()

  // Prev month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = document.createElement('div')
    d.className = 'cal-day other-month'
    d.textContent = daysInPrev - i
    grid.appendChild(d)
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div')
    el.className = 'cal-day'
    el.textContent = d
    if (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()) {
      el.classList.add('today')
    }
    el.addEventListener('click', e => e.stopPropagation())
    grid.appendChild(el)
  }

  // Next month padding
  const totalCells = grid.children.length
  const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  for (let i = 1; i <= remaining; i++) {
    const d = document.createElement('div')
    d.className = 'cal-day other-month'
    d.textContent = i
    grid.appendChild(d)
  }
}

document.getElementById('cal-prev').addEventListener('click', e => {
  e.stopPropagation()
  calMonth--
  if (calMonth < 0) { calMonth = 11; calYear-- }
  renderCalendar()
})
document.getElementById('cal-next').addEventListener('click', e => {
  e.stopPropagation()
  calMonth++
  if (calMonth > 11) { calMonth = 0; calYear++ }
  renderCalendar()
})

initCalendar()

// ─── SYSTEM INFO ───────────────────────────────────────────────
async function loadSysInfo() {
  try {
    const info = await window.api.sysinfo()
    document.getElementById('sys-cpu').textContent    = `${info.cpus} cores`
    document.getElementById('sys-ram').textContent    = `${info.freeMem}/${info.totalMem} GB free`
    document.getElementById('sys-uptime').textContent = `${info.uptime}h`
  } catch {}
}
loadSysInfo()

// ─── THEME PICKER ──────────────────────────────────────────────
document.querySelectorAll('.theme-dot').forEach(dot => {
  dot.addEventListener('click', e => {
    e.stopPropagation()
    const color = dot.dataset.color
    document.documentElement.style.setProperty('--accent', color)
    document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'))
    dot.classList.add('active')
    localStorage.setItem('di-accent', color)
  })
})

// Restore theme
const savedAccent = localStorage.getItem('di-accent')
if (savedAccent) {
  document.documentElement.style.setProperty('--accent', savedAccent)
  document.querySelectorAll('.theme-dot').forEach(d => {
    if (d.dataset.color === savedAccent) {
      d.classList.add('active')
    } else {
      d.classList.remove('active')
    }
  })
}

// ─── MEDIA PLAYER (Demo) ───────────────────────────────────────
const playlist = [
  { title: 'Midnight City',   artist: 'M83',              art: '🌃' },
  { title: 'Blinding Lights', artist: 'The Weeknd',        art: '💡' },
  { title: 'Levitating',      artist: 'Dua Lipa',          art: '🪩' },
  { title: 'Heat Waves',      artist: 'Glass Animals',     art: '🌊' },
  { title: 'Stay',            artist: 'Kid LAROI & J.Bieber', art: '💜' },
]

const lyrics = [
  ['♪ Waiting in a car ♪', 'Waiting for a ride in the dark'],
  ['♪ Blinded by the lights ♪', 'No, I can\'t sleep until I feel your touch'],
  ['♪ I got you, moonlight ♪', 'You\'re my starlight'],
  ['♪ Breathe me in ♪', 'Breathe me out'],
  ['♪ I\'ll always want you ♪', 'Stay'],
]

let mediaIdx  = 0
let mediaPlay = false
let seekTimer = null

function renderMedia() {
  const track = playlist[mediaIdx]
  document.getElementById('media-art').textContent    = track.art
  document.getElementById('media-title').textContent  = track.title
  document.getElementById('media-artist').textContent = track.artist
  seekBar.value = 0
  updateSliderTrack(seekBar)

  const lyricsBox = document.getElementById('lyrics-box')
  const ly = lyrics[mediaIdx]
  lyricsBox.innerHTML = `
    <p class="lyric-line active">${ly[0]}</p>
    <p class="lyric-line muted">${ly[1]}</p>
  `
}
renderMedia()

function startSeek() {
  seekTimer = setInterval(() => {
    const v = parseInt(seekBar.value)
    if (v >= 100) {
      nextTrack()
    } else {
      seekBar.value = v + 1
      updateSliderTrack(seekBar)
    }
  }, 500)
}

function stopSeek() { clearInterval(seekTimer) }

document.getElementById('btn-play').addEventListener('click', e => {
  e.stopPropagation()
  mediaPlay = !mediaPlay
  document.getElementById('btn-play').textContent = mediaPlay ? '⏸' : '▶'
  mediaPlay ? startSeek() : stopSeek()
})

function nextTrack() {
  mediaIdx = (mediaIdx + 1) % playlist.length
  renderMedia()
  if (mediaPlay) { stopSeek(); startSeek() }
}
function prevTrack() {
  mediaIdx = (mediaIdx - 1 + playlist.length) % playlist.length
  renderMedia()
  if (mediaPlay) { stopSeek(); startSeek() }
}

document.getElementById('btn-next').addEventListener('click', e => { e.stopPropagation(); nextTrack() })
document.getElementById('btn-prev').addEventListener('click', e => { e.stopPropagation(); prevTrack() })
document.getElementById('btn-shuffle').addEventListener('click', e => {
  e.stopPropagation()
  mediaIdx = Math.floor(Math.random() * playlist.length)
  renderMedia()
})

// ─── MOCHI + FILE DROP ─────────────────────────────────────────
const dropZone      = document.getElementById('drop-zone')
const emailComposer = document.getElementById('email-composer')
const dzText        = document.getElementById('dz-text')

// Add progress bar to drop zone
const progressDiv = document.createElement('div')
progressDiv.id = 'upload-progress'
const progressBar = document.createElement('div')
progressBar.id = 'upload-bar'
progressDiv.appendChild(progressBar)
dropZone.after(progressDiv)

document.addEventListener('dragover', e => {
  e.preventDefault()
  dropZone.classList.remove('drop-idle')
  dropZone.classList.add('drop-active')
  document.getElementById('dz-icon').textContent = '😮'
  dzText.textContent = 'Drop it! Mochi is hungry!'
})

document.addEventListener('dragleave', e => {
  if (!island.contains(e.relatedTarget)) {
    dropZone.classList.remove('drop-active')
    dropZone.classList.add('drop-idle')
    document.getElementById('dz-icon').textContent = '📎'
    dzText.textContent = 'Drop a file on Mochi'
  }
})

document.addEventListener('drop', e => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (!file) return

  // Switch to Mochi tab if not already
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'))
  document.querySelector('[data-tab="mochi"]').classList.add('active')
  document.getElementById('tab-mochi').classList.add('active')
  expand()

  dropZone.classList.remove('drop-active')
  dropZone.classList.add('drop-idle')
  document.getElementById('dz-icon').textContent = '😋'
  dzText.textContent = `Eating ${file.name}…`

  // Fake progress
  const prog = document.getElementById('upload-progress')
  const bar  = document.getElementById('upload-bar')
  prog.style.display = 'block'
  let pct = 0
  const iv = setInterval(() => {
    pct += Math.random() * 15
    if (pct >= 100) {
      pct = 100
      clearInterval(iv)
      setTimeout(() => {
        prog.style.display = 'none'
        bar.style.width = '0%'
        document.getElementById('dz-icon').textContent = '😌'
        dzText.textContent = 'Mmm, delicious!'
        // Show email composer
        setTimeout(() => {
          dropZone.classList.add('hidden')
          emailComposer.classList.remove('hidden')
          document.getElementById('ec-filename').textContent = `with ${file.name}`
          document.getElementById('ec-subject').value = file.name
        }, 800)
      }, 400)
    }
    bar.style.width = pct + '%'
  }, 120)
})

// Email send/cancel
document.getElementById('ec-send').addEventListener('click', e => {
  e.stopPropagation()
  emailComposer.classList.add('hidden')
  dropZone.classList.remove('hidden')
  document.getElementById('dz-icon').textContent = '😴'
  dzText.textContent = 'Email sent! Mochi is sleepy…'
  document.querySelector('.mochi-mouth').textContent = '^ ^'
  setTimeout(() => {
    document.getElementById('dz-icon').textContent = '📎'
    dzText.textContent = 'Drop a file on Mochi'
    document.querySelector('.mochi-mouth').textContent = '‿'
  }, 3000)
})

document.getElementById('ec-cancel').addEventListener('click', e => {
  e.stopPropagation()
  emailComposer.classList.add('hidden')
  dropZone.classList.remove('hidden')
  document.getElementById('dz-icon').textContent = '📎'
  dzText.textContent = 'Drop a file on Mochi'
})

// Stop propagation on inputs in email composer
document.querySelectorAll('.ec-input').forEach(el => {
  el.addEventListener('click', e => e.stopPropagation())
  el.addEventListener('keydown', e => e.stopPropagation())
})

// ─── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') collapse()
})
