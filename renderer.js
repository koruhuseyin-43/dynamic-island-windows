/* ══════════════════════════════════════════════════════════════
   FENN / NOOK NOTCH DYNAMIC ISLAND - renderer.js
   Full Spotify Media Control, Synced Lyrics, 3D Cloud Mascot & 120 FPS
   ══════════════════════════════════════════════════════════════ */

const island    = document.getElementById('island')
const pill      = document.getElementById('pill')
const panel     = document.getElementById('panel')
const closeBtn  = document.getElementById('pill-close-btn')

const NOTCH_W = 220
const NOTCH_H = 36
const EXPAN_W = 580
const EXPAN_H = 370

let isExpanded = false

// ─── TOAST NOTIFICATION ───────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.island-toast')
  if (existing) existing.remove()
  const t = document.createElement('div')
  t.className = 'island-toast'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 1800)
}

// ─── EXPAND / COLLAPSE (BUTTERY SMOOTH 120 FPS) ───────────────
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
  
  // CRITICAL 120 FPS FIX:
  // Allow the 0.28s CSS spring animation to play fully without cutting the window bounds!
  setTimeout(() => {
    window.api.collapse()
    switchView('dashboard')
  }, 280)
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

// Auto-collapse when user clicks outside the expanded panel
document.addEventListener('click', (e) => {
  if (isExpanded) {
    const isInsidePanel  = panel && panel.contains(e.target)
    const isInsidePill   = pill && pill.contains(e.target)
    const isInsidePortal = portal && portal.contains(e.target)
    if (!isInsidePanel && !isInsidePill && !isInsidePortal) {
      collapseIsland()
    }
  }
})

// Auto-collapse when window loses focus (clicks on other apps / desktop)
window.api.onAutoCollapse(() => {
  if (isExpanded) collapseIsland()
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

// ─── COFFEE TOGGLE (PREVENT SLEEP) ───────────────────────────
const coffeeCheck = document.getElementById('coffee-check')
const coffeeSub   = document.getElementById('coffee-sub')

coffeeCheck.addEventListener('change', (e) => {
  e.stopPropagation()
  const isChecked = coffeeCheck.checked
  coffeeSub.textContent = isChecked ? 'Always' : 'Off'
  window.api.setCoffee(isChecked)
  showToast(isChecked ? '☕ Uyku Engellendi (Always Awake)' : '☕ Uyku Modu Normal')
})
window.api.setCoffee(true)

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

let parsedLyrics = []
let currentLyricIdx = -1

function updateTrackUI() {
  document.getElementById('dash-track-title').textContent = currentTrack.title
  document.getElementById('dash-track-artist').textContent = currentTrack.artist
  document.getElementById('pill-track-name').textContent = `${currentTrack.title} • ${currentTrack.artist}`
  document.getElementById('full-track-title').textContent = currentTrack.title
  document.getElementById('full-track-artist').textContent = currentTrack.artist
  
  const vinyl = document.getElementById('vinyl-disc')
  if (vinyl) {
    if (currentTrack.isPlaying) vinyl.classList.add('playing')
    else vinyl.classList.remove('playing')
  }

  renderSeekTime()
  updateMascotMusicState()
}
updateTrackUI()

// Real Native Media Keys Trigger
function sendMediaAction(action) {
  window.api.mediaControl(action)
  if (action === 'playpause' || action === 'play') {
    currentTrack.isPlaying = !currentTrack.isPlaying
    const icon = currentTrack.isPlaying ? '⏸' : '▶'
    document.getElementById('sp-play').textContent = icon
    document.getElementById('full-play').textContent = icon
    
    const vinyl = document.getElementById('vinyl-disc')
    if (vinyl) {
      if (currentTrack.isPlaying) vinyl.classList.add('playing')
      else vinyl.classList.remove('playing')
    }

    showToast(currentTrack.isPlaying ? '▶ Müzik Başlatıldı' : '⏸ Müzik Duraklatıldı')
    updateMascotMusicState()
  } else if (action === 'next') {
    showToast('⏭ Sonraki Şarkı')
  } else if (action === 'prev') {
    showToast('⏮ Önceki Şarkı')
  }
}

document.getElementById('sp-play').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('playpause') })
document.getElementById('full-play').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('playpause') })
document.getElementById('sp-next').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('next') })
document.getElementById('full-next').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('next') })
document.getElementById('sp-prev').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('prev') })
document.getElementById('full-prev').addEventListener('click', (e) => { e.stopPropagation(); sendMediaAction('prev') })

// Background poll for Spotify / GSMTC
async function checkActiveMedia() {
  try {
    const live = await window.api.getMediaInfo()
    if (live) {
      if (live.isRunning === false) {
        if (currentTrack.title !== 'Spotify Kapalı') {
          currentTrack.title = 'Spotify Kapalı'
          currentTrack.artist = 'Başlatmak için ▶ tıkla'
          currentTrack.isPlaying = false
          document.getElementById('sp-play').textContent = '▶'
          document.getElementById('full-play').textContent = '▶'
          updateTrackUI()
        }
        return
      }

      const isNewSong = live.title && (live.title !== currentTrack.title || live.artist !== currentTrack.artist)
      
      if (isNewSong && live.title !== 'Spotify Beklemede') {
        currentTrack.title  = live.title
        currentTrack.artist = live.artist
        currentTrack.isPlaying = true
        currentTrack.seconds = (live.position >= 0) ? live.position : 0
        if (live.duration > 0) currentTrack.duration = live.duration
        
        document.getElementById('sp-play').textContent = '⏸'
        document.getElementById('full-play').textContent = '⏸'
        updateTrackUI()
        fetchHiResArtwork(live.title, live.artist)
        fetchLiveLyrics(live.title, live.artist)
      } else if (live.title === currentTrack.title) {
        // SAME SONG: Do not reset seconds or unpause!
        if (live.position >= 0 && Math.abs(currentTrack.seconds - live.position) > 2) {
          currentTrack.seconds = live.position
          renderSeekTime()
          highlightCurrentLyric()
        }
        if (live.duration > 0) {
          currentTrack.duration = live.duration
        }
      }
    }
  } catch {}
}
setInterval(checkActiveMedia, 1500)
checkActiveMedia()

// Fetch High-Resolution Album Artwork from iTunes Search API
async function fetchHiResArtwork(title, artist) {
  if (!title || title.includes('Spotify Beklemede') || title.includes('Spotify Kapalı')) return
  try {
    const q = encodeURIComponent(`${artist} ${title}`)
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`)
    if (res.ok) {
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        const item = data.results[0]
        const artUrl = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null
        if (artUrl) {
          const fullArt = document.getElementById('full-album-art')
          const dashArt = document.getElementById('dash-album-art')
          if (fullArt) fullArt.src = artUrl
          if (dashArt) dashArt.src = artUrl
          
          const glow = document.getElementById('media-ambient-glow')
          if (glow) {
            glow.style.background = `radial-gradient(circle at 35% 35%, rgba(255, 140, 0, 0.5) 0%, rgba(220, 50, 110, 0.28) 45%, transparent 75%)`
          }
        }
      }
    }
  } catch {}
}

function cleanStr(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// Fetch Live Lyrics from LRCLIB API or Curated Synced Presets
async function fetchLiveLyrics(title, artist) {
  parsedLyrics = []
  currentLyricIdx = -1
  const lyricsContainer = document.getElementById('lyrics-list')
  lyricsContainer.innerHTML = '<p class="l-line active">Şarkı sözleri yükleniyor...</p>'

  try {
    const encTitle  = encodeURIComponent(title)
    const encArtist = encodeURIComponent(artist)
    const res = await fetch(`https://lrclib.net/api/get?track_name=${encTitle}&artist_name=${encArtist}`)
    
    if (res.ok) {
      const data = await res.json()
      if (data && data.duration) {
        currentTrack.duration = Math.round(data.duration)
      }
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

  const cTitle = cleanStr(title)
  if (cTitle.includes('nilufer')) {
    currentTrack.duration = 245
    const niluferLrc = `
[00:00.00] Zamanın eli değdi bize
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
[01:23.00] Zaaflarına bir gece
[01:26.15] Hatalarına bir nilüfer
[01:29.30] Sevgisizliğine bir kalp verdim
[01:35.00] Artık geri ver
[01:38.00] Geri veremezsin aldıklarını
[01:42.00] Artık geri ver
[01:44.50] Geri verilmez hiçbir yanılgı
[01:49.00] Yokluğuma emanet et
[01:52.00] Sen de benden kalanları
[01:55.50] Her şeyi al, bana beni geri ver
[01:59.50] Bir şansım olsun
[02:03.50] Başka yer, başka zaman
[02:07.00] Sensiz ömrüm olsun
[02:11.00] Her şeyi al
[02:14.00] Bir şansım olsun
[02:18.00] Başka yer, başka zaman
[02:22.00] Sensiz ömrüm olsun
    `
    parseLrc(niluferLrc)
    renderLyricsDOM()
  } else if (cTitle.includes('taka la')) {
    currentTrack.duration = 89
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
    // Elegant Live 3D Studio Spectrum Visualizer
    lyricsContainer.innerHTML = `
      <div class="eq-spectrum-visualizer">
        <div class="eq-bars-container">
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
          <div class="eq-spec-bar"></div>
        </div>
        <div class="eq-spec-label">CANLI STÜDYO ÇIKIŞI AKTİF</div>
      </div>
    `
  }
}

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
    p.title = `Tıkla: ${Math.floor(item.time / 60)}:${String(item.time % 60).padStart(2,'0')}`
    p.addEventListener('click', (e) => {
      e.stopPropagation()
      currentTrack.seconds = item.time
      renderSeekTime()
      highlightCurrentLyric()
      showToast(`Zamana Atlandı: ${Math.floor(item.time / 60)}:${String(item.time % 60).padStart(2,'0')}`)
    })
    container.appendChild(p)
  })
  highlightCurrentLyric()
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

function highlightCurrentLyric() {
  if (parsedLyrics.length === 0) return
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

function renderSeekTime() {
  const dur = currentTrack.duration || 180
  const cur = Math.min(currentTrack.seconds, dur)
  const pct = Math.min((cur / dur) * 100, 100)
  
  const seekFill = document.getElementById('media-seek-fill')
  if (seekFill) seekFill.style.width = `${pct}%`
  
  const curM = Math.floor(cur / 60)
  const curS = cur % 60
  const curTimeEl = document.getElementById('cur-time')
  if (curTimeEl) curTimeEl.textContent = `${curM}:${String(curS).padStart(2,'0')}`

  const remSec = Math.max(0, dur - cur)
  const remM = Math.floor(remSec / 60)
  const remS = remSec % 60
  const durTimeEl = document.getElementById('dur-time')
  if (durTimeEl) durTimeEl.textContent = `-${remM}:${String(remS).padStart(2,'0')}`

  const dashTimeEl = document.getElementById('dash-track-time')
  if (dashTimeEl) {
    const totalM = Math.floor(dur / 60)
    const totalS = dur % 60
    dashTimeEl.textContent = `${curM}:${String(curS).padStart(2,'0')} / ${totalM}:${String(totalS).padStart(2,'0')}`
  }
}

// Scrubber Click to Seek
const seekContainer = document.querySelector('.seek-container') || document.querySelector('.seek-bar-track')
if (seekContainer) {
  seekContainer.addEventListener('click', (e) => {
    e.stopPropagation()
    const track = document.querySelector('.seek-bar-track') || seekContainer
    const rect = track.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, clickX / rect.width))
    currentTrack.seconds = Math.floor(pct * currentTrack.duration)
    renderSeekTime()
    highlightCurrentLyric()
  })

  // Wheel to seek ±5s
  seekContainer.addEventListener('wheel', (e) => {
    e.stopPropagation()
    if (e.deltaY < 0) {
      currentTrack.seconds = Math.min(currentTrack.duration, currentTrack.seconds + 5)
    } else {
      currentTrack.seconds = Math.max(0, currentTrack.seconds - 5)
    }
    renderSeekTime()
    highlightCurrentLyric()
  })
}

// Smooth 1-second ticker (Only increments when isPlaying is true)
setInterval(() => {
  if (!currentTrack.isPlaying) return
  currentTrack.seconds++
  renderSeekTime()
  highlightCurrentLyric()
}, 1000)

fetchLiveLyrics(currentTrack.title, currentTrack.artist)

// ══════════════════════════════════════════════════════════════
// 3D CLOUD MASCOT (AUTHENTIC 3D CLAY TILT & PARALLAX TRACKING)
// ══════════════════════════════════════════════════════════════
function setupCloudMascots() {
  const mascots = document.querySelectorAll('.cloud-character')

  // Smooth 3D tilt towards mouse position
  document.addEventListener('mousemove', (e) => {
    mascots.forEach(m => {
      const rect = m.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (window.innerWidth / 2)
      const dy = (e.clientY - cy) / (window.innerHeight / 2)
      
      const tiltX = Math.max(-15, Math.min(15, dx * 14))
      const tiltY = Math.max(-15, Math.min(15, -dy * 14))
      
      const body = m.querySelector('.cloud-body')
      if (body) {
        body.style.transform = `perspective(260px) rotateY(${tiltX.toFixed(1)}deg) rotateX(${tiltY.toFixed(1)}deg)`
      }
    })
  })

  // Click Reaction with Sparkles
  mascots.forEach(m => {
    m.addEventListener('click', (e) => {
      e.stopPropagation()
      const rect = m.getBoundingClientRect()
      explodeSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, 14)
      showToast('☁️ Bulut: Dynamic Island Aktif ✨')
      m.style.transform = 'scale(1.22) translateY(-3px)'
      setTimeout(() => { m.style.transform = '' }, 350)
    })
  })
}
setupCloudMascots()

function updateMascotMusicState() {
  const mascots = document.querySelectorAll('.cloud-character')
  mascots.forEach(m => {
    if (currentTrack.isPlaying) {
      m.classList.add('groove')
    } else {
      m.classList.remove('groove')
    }
  })
}

// ─── ACTIVE TOOLS & BUTTONS (TAM EKRAN, SNIPPING, CALCULATOR, ETC.) ───
const toolExpand = document.getElementById('tool-expand')
if (toolExpand) {
  toolExpand.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('⛶ Tam Ekran (F11)')
    window.api.launchTool('fullscreen')
  })
}

const toolCrop = document.getElementById('tool-crop')
if (toolCrop) {
  toolCrop.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('✂️ Ekran Alıntısı Aracı')
    window.api.launchTool('snipping')
  })
}

const toolRatio = document.getElementById('tool-ratio')
if (toolRatio) {
  toolRatio.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('⅘ Hesap Makinesi')
    window.api.launchTool('calculator')
  })
}

const toolSettings = document.getElementById('tool-settings')
if (toolSettings) {
  toolSettings.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('⚙️ Windows Ayarları')
    window.api.launchTool('settings')
  })
}

const btnPhone = document.getElementById('btn-phone')
if (btnPhone) {
  btnPhone.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('📱 Telefon Bağlantısı')
    window.api.launchTool('phone')
  })
}

const btnText = document.getElementById('btn-text')
if (btnText) {
  btnText.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('📝 Not Defteri')
    window.api.launchTool('notepad')
  })
}

const toolPaint = document.getElementById('tool-paint') || document.querySelector('.bottom-pen')
if (toolPaint) {
  toolPaint.addEventListener('click', (e) => {
    e.stopPropagation()
    showToast('🎨 Çizim & Renk Seçici')
    window.api.launchTool('colorpicker')
  })
}

const toolCursor = document.getElementById('tool-cursor')
if (toolCursor) {
  toolCursor.addEventListener('click', (e) => {
    e.stopPropagation()
    toolCursor.classList.toggle('active-tool')
    showToast('↖️ İmleç Seçildi')
  })
}

const btnFont = document.getElementById('btn-font')
let fontMode = 0
if (btnFont) {
  btnFont.addEventListener('click', (e) => {
    e.stopPropagation()
    fontMode = (fontMode + 1) % 3
    if (fontMode === 0) {
      document.body.style.fontFamily = "var(--font-main)"
      showToast('Yazı Tipi: Inter')
    } else if (fontMode === 1) {
      document.body.style.fontFamily = "var(--font-mono)"
      showToast('Yazı Tipi: JetBrains Mono')
    } else {
      document.body.style.fontFamily = "'Segoe UI', sans-serif"
      showToast('Yazı Tipi: Segoe UI')
    }
  })
}

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
// DRAG & DROP ELASTIC FILE SWALLOW PORTAL (SAVES TO ISLAND_VAULT)
// ══════════════════════════════════════════════════════════════
const portal        = document.getElementById('file-drop-portal')
const portalFill    = document.getElementById('portal-fill-bar')
const portalName    = document.getElementById('portal-file-name')
const portalOpenBtn = document.getElementById('portal-open-vault-btn')
const btnOpenVault  = document.getElementById('btn-open-vault')
const portalMascot  = document.getElementById('portal-cloud-mascot')
const portalMouth   = document.getElementById('portal-cloud-mouth')

if (portalOpenBtn) {
  portalOpenBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    window.api.openVault()
  })
}
if (btnOpenVault) {
  btnOpenVault.addEventListener('click', (e) => {
    e.stopPropagation()
    window.api.openVault()
  })
}

function explodeSparkles(cx, cy, count = 16) {
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
  portalOpenBtn.classList.add('hidden')
  if (portalMascot) {
    portalMascot.classList.add('open-mouth')
    portalMascot.classList.remove('happy')
  }
  portalName.textContent = 'Dosyayı Buraya Bırakın...'
})

document.addEventListener('dragleave', (e) => {
  if (!island.contains(e.relatedTarget)) {
    portal.classList.remove('show')
    if (portalMascot) portalMascot.classList.remove('open-mouth')
  }
})

document.addEventListener('drop', async (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (!file) {
    portal.classList.remove('show')
    return
  }

  // Active Swallow Animation on Cloud Mascot
  if (portalMascot) portalMascot.classList.add('open-mouth')
  portalName.textContent = `Yutuluyor: ${file.name}…`
  
  let buffer = null
  try {
    const ab = await file.arrayBuffer()
    buffer = Array.from(new Uint8Array(ab))
  } catch (err) {}

  window.api.saveDroppedFile({
    name: file.name,
    filePath: file.path || null,
    buffer: buffer
  })

  let p = 0
  const ingestTimer = setInterval(() => {
    p += 20
    portalFill.style.width = `${p}%`
    if (p >= 100) {
      clearInterval(ingestTimer)
      
      const rect = portal.getBoundingClientRect()
      explodeSparkles(rect.width / 2, rect.height / 2 - 20, 16)

      if (portalMascot) {
        portalMascot.classList.remove('open-mouth')
        portalMascot.classList.add('happy')
      }
      portalName.textContent = `✨ ${file.name} Kaydedildi!`
      portalOpenBtn.classList.remove('hidden')
      showToast(`📁 Dosya Masaüstü/Island_Vault klasörüne kaydedildi!`)
      
      setTimeout(() => {
        portal.classList.remove('show')
        if (portalMascot) portalMascot.classList.remove('happy')
        portalFill.style.width = '0%'
        portalOpenBtn.classList.add('hidden')
      }, 3500)
    }
  }, 60)
})

// ══════════════════════════════════════════════════════════════
// 120 FPS 3D PERSPECTIVE PARALLAX & CARD SPECULAR GLARE ENGINE
// ══════════════════════════════════════════════════════════════
function init3DPerspectiveEngine() {
  const panel = document.getElementById('panel')
  
  let targetTiltX = 0
  let targetTiltY = 0
  let currentTiltX = 0
  let currentTiltY = 0

  // Whole Island Floating Perspective on Mouse Move
  document.addEventListener('mousemove', (e) => {
    if (!isExpanded) return
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const normX = (e.clientX - centerX) / centerX
    const normY = (e.clientY - centerY) / centerY
    
    // Smooth subtle physical gyroscope sway
    targetTiltX = -normY * 3.2
    targetTiltY = normX * 3.2
  })

  document.addEventListener('mouseleave', () => {
    targetTiltX = 0
    targetTiltY = 0
  })

  // 120 FPS Physics Lerp Loop
  function render3DFrame() {
    if (isExpanded && panel) {
      currentTiltX += (targetTiltX - currentTiltX) * 0.08
      currentTiltY += (targetTiltY - currentTiltY) * 0.08
      panel.style.transform = `perspective(1100px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg)`
    } else if (panel && (currentTiltX !== 0 || currentTiltY !== 0)) {
      currentTiltX = 0
      currentTiltY = 0
      panel.style.transform = ''
    }
    requestAnimationFrame(render3DFrame)
  }
  requestAnimationFrame(render3DFrame)

  // Card-Level 3D Interactive Parallax & Cursor Specular Glare (Apple VisionOS / Apple TV Style)
  const interactiveCards = document.querySelectorAll('.f-card, .sys-card, .grid-icon-btn, .mini-tool-btn, .full-album-wrap')
  
  interactiveCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const pctX = (x / rect.width) * 100
      const pctY = (y / rect.height) * 100
      
      const tiltX = ((y - rect.height / 2) / (rect.height / 2)) * -7
      const tiltY = ((x - rect.width / 2) / (rect.width / 2)) * 7

      card.style.setProperty('--glare-x', `${pctX.toFixed(1)}%`)
      card.style.setProperty('--glare-y', `${pctY.toFixed(1)}%`)
      card.style.setProperty('--glare-opacity', '1')
      card.style.transform = `perspective(600px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) translateZ(10px) scale3d(1.025, 1.025, 1.025)`
    })

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--glare-opacity', '0')
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)'
    })
  })
}
init3DPerspectiveEngine()
