const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const os   = require('os')
const { execFile, exec } = require('child_process')

let mainWindow, tray

const PILL_W   = 210
const PILL_H   = 34
const EXPAND_W = 560
const EXPAND_H = 320

const MEDIA_CTRL_EXE = path.join(__dirname, 'media_ctrl.exe')

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
    { label: '🏝️ Dynamic Island - Fenn', enabled: false },
    { type: 'separator' },
    { label: 'Aç / Gizle', click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() },
    { type: 'separator' },
    { label: 'Çıkış', click: () => app.quit() }
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

// Instant Native Windows Media Keys via compiled C# exe
ipcMain.on('media-control', (_, action) => {
  try {
    execFile(MEDIA_CTRL_EXE, [action], (err) => {
      if (err) {
        // Fallback to powershell if exe fails
        let code = 0xB3
        if (action === 'next') code = 0xB0
        else if (action === 'prev') code = 0xB1
        exec(`powershell -NoProfile -Command "$w=New-Object -ComObject Wscript.Shell; $w.SendKeys([char]${code})"`)
      }
    })
  } catch (err) {}
})

// Query Active Spotify Window Title with clean UTF-8
ipcMain.handle('getMediaInfo', () => {
  return new Promise((resolve) => {
    const ps = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process -Name spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -ExpandProperty MainWindowTitle -First 1`
    exec(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { encoding: 'utf8', timeout: 1200 }, (err, stdout) => {
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

ipcMain.on('launch-tool', (_, tool) => {
  if (tool === 'calculator') shell.openExternal('calculator:')
  else if (tool === 'settings') shell.openExternal('ms-settings:')
  else if (tool === 'volume') shell.openExternal('ms-settings:sound')
  else if (tool === 'phone') shell.openExternal('ms-phone-link:')
  else if (tool === 'colorpicker') exec('powershell -Command "Start-Process mspaint.exe"')
})

ipcMain.on('open-url',  (_, url) => shell.openExternal(url))
ipcMain.on('open-file', (_, fp)  => shell.openPath(fp))
