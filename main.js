const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const os   = require('os')
const { execSync, exec } = require('child_process')

let mainWindow, tray

const PILL_W   = 210
const PILL_H   = 34
const EXPAND_W = 560
const EXPAND_H = 320

function centerTop(w) {
  const { bounds } = screen.getPrimaryDisplay()
  return { x: Math.round(bounds.x + (bounds.width - w) / 2), y: bounds.y }
}

function createWindow() {
  const { x, y } = centerTop(PILL_W)

  mainWindow = new BrowserWindow({
    width: PILL_W, height: PILL_H,
    x, y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true)
  mainWindow.setIgnoreMouseEvents(false)

  mainWindow.on('blur', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setIgnoreMouseEvents(false)
  })
  mainWindow.on('focus', () => mainWindow.setIgnoreMouseEvents(false))
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty())
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '🏝️ Dynamic Island', enabled: false },
    { type: 'separator' },
    { label: 'Show / Hide', click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]))
  tray.setToolTip('Dynamic Island for Windows')
  tray.on('double-click', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show())
}

app.whenReady().then(() => { createWindow(); createTray() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// ─── IPC HANDLERS ───────────────────────────────────────────────
ipcMain.on('expand', (_, { w, h }) => {
  const { x, y } = centerTop(w)
  mainWindow.setBounds({ x, y, width: w, height: h }, true)
  mainWindow.setIgnoreMouseEvents(false)
})

ipcMain.on('collapse', () => {
  const { x, y } = centerTop(PILL_W)
  mainWindow.setBounds({ x, y, width: PILL_W, height: PILL_H }, true)
})

ipcMain.handle('sysinfo', () => {
  const total = os.totalmem()
  const free  = os.freemem()
  return {
    cpus:     os.cpus().length,
    totalMem: parseFloat((total / 1073741824).toFixed(1)),
    freeMem:  parseFloat((free / 1073741824).toFixed(1)),
    usedMem:  parseFloat(((total - free) / 1073741824).toFixed(1)),
    memPct:   Math.round(((total - free) / total) * 100),
    uptime:   Math.round(os.uptime() / 3600)
  }
})

// Windows Media Keys Simulation (Play/Pause, Next, Prev)
ipcMain.on('media-control', (_, action) => {
  try {
    let keyCode = 0
    if (action === 'playpause') keyCode = 0xB3 // VK_MEDIA_PLAY_PAUSE
    else if (action === 'next') keyCode = 0xB0 // VK_MEDIA_NEXT_TRACK
    else if (action === 'prev') keyCode = 0xB1 // VK_MEDIA_PREV_TRACK
    
    if (keyCode > 0) {
      const psCmd = `powershell -NoProfile -Command "$wsh = New-Object -ComObject Wscript.Shell; $wsh.SendKeys([char]${keyCode})"`
      exec(psCmd)
    }
  } catch (err) {}
})

// Query Active Spotify Window Title directly (Fast & 100% Reliable on Windows)
ipcMain.handle('getMediaInfo', () => {
  return new Promise((resolve) => {
    // Spotify sets its main window title to "Artist - Title" when playing
    const ps = `powershell -NoProfile -NonInteractive -Command "Get-Process -Name spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -ExpandProperty MainWindowTitle -First 1"`
    exec(ps, { timeout: 1500 }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        const titleLine = stdout.trim()
        if (titleLine !== 'Spotify' && titleLine !== 'Spotify Free' && titleLine !== 'Spotify Premium') {
          if (titleLine.includes(' - ')) {
            const parts = titleLine.split(' - ')
            const artist = parts[0].trim()
            const title = parts.slice(1).join(' - ').trim()
            return resolve({ title, artist, isPlaying: true, source: 'spotify' })
          } else {
            return resolve({ title: titleLine, artist: 'Spotify', isPlaying: true, source: 'spotify' })
          }
        }
      }
      resolve(null)
    })
  })
})

// Windows Native Launchers
ipcMain.on('launch-tool', (_, tool) => {
  if (tool === 'calculator') shell.openExternal('calculator:')
  else if (tool === 'settings') shell.openExternal('ms-settings:')
  else if (tool === 'volume') shell.openExternal('ms-settings:sound')
  else if (tool === 'phone') shell.openExternal('ms-phone-link:')
  else if (tool === 'colorpicker') {
    // Windows PowerToys ColorPicker shortcut or Paint
    exec('powershell -Command "Start-Process mspaint.exe"')
  }
})

ipcMain.on('open-url',  (_, url) => shell.openExternal(url))
ipcMain.on('open-file', (_, fp)  => shell.openPath(fp))
