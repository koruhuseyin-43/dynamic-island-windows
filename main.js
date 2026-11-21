const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell, powerSaveBlocker } = require('electron')
const path = require('path')
const os   = require('os')
const fs   = require('fs')
const { execFile, exec } = require('child_process')

// 120 FPS & Hardware Acceleration Flags
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('disable-frame-rate-limit')

let mainWindow, tray
let powerBlockerId = null

const PILL_W   = 220
const PILL_H   = 36
const EXPAN_W  = 580
const EXPAN_H  = 370

const MEDIA_CTRL_EXE = path.join(__dirname, 'media_ctrl.exe')
const GET_MEDIA_PS1  = path.join(__dirname, 'get_media.ps1')

function getVaultDir() {
  try {
    const dt = app.getPath('desktop')
    const v = path.join(dt, 'Island_Vault')
    if (!fs.existsSync(v)) fs.mkdirSync(v, { recursive: true })
    return v
  } catch {
    const v = path.join(os.homedir(), 'Desktop', 'Island_Vault')
    if (!fs.existsSync(v)) fs.mkdirSync(v, { recursive: true })
    return v
  }
}

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

  // Auto-collapse when user clicks outside (window loses focus)
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('auto-collapse')
  })
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty())
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '🏝️ Dynamic Island - Fenn', enabled: false },
    { type: 'separator' },
    { label: 'Ada Dosya Kasasını Aç (Island_Vault)', click: () => shell.openPath(getVaultDir()) },
    { label: 'Aç / Gizle', click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() },
    { type: 'separator' },
    { label: 'Çıkış', click: () => app.quit() }
  ]))
  tray.setToolTip('Dynamic Island for Windows')
  tray.on('double-click', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show())
}

app.whenReady().then(() => { 
  getVaultDir()
  createWindow()
  createTray() 
})
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

// Auto-Launch Spotify if closed + Send Media Key
function launchAndPlaySpotify() {
  const appData = process.env.APPDATA || ''
  const spotifyExe = path.join(appData, 'Spotify', 'Spotify.exe')
  
  if (fs.existsSync(spotifyExe)) {
    exec(`start "" "${spotifyExe}"`)
  } else {
    shell.openExternal('spotify:')
  }

  let attempts = 0
  const pollTimer = setInterval(() => {
    attempts++
    exec('powershell -NoProfile -Command "Get-Process -Name spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne \'\' } | Measure-Object | Select-Object -ExpandProperty Count"', (err, stdout) => {
      const count = parseInt(stdout && stdout.trim()) || 0
      if (count > 0 || attempts >= 8) {
        clearInterval(pollTimer)
        setTimeout(() => execFile(MEDIA_CTRL_EXE, ['playpause']), 800)
      }
    })
  }, 1000)
}

ipcMain.on('media-control', (_, action) => {
  exec('powershell -NoProfile -Command "Get-Process -Name spotify -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count"', (err, stdout) => {
    const isRunning = (parseInt(stdout && stdout.trim()) || 0) > 0
    if (!isRunning && (action === 'playpause' || action === 'play')) {
      launchAndPlaySpotify()
    } else {
      execFile(MEDIA_CTRL_EXE, [action])
    }
  })
})

// Query Active Media with GSMTC and Spotify Title Filter (Base64 UTF-8 safe)
ipcMain.handle('getMediaInfo', () => {
  return new Promise((resolve) => {
    exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${GET_MEDIA_PS1}"`, { encoding: 'utf8', timeout: 1800 }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        const trimmed = stdout.trim()
        try {
          // Attempt Base64 decode for 100% UTF-8 accuracy
          const decoded = Buffer.from(trimmed, 'base64').toString('utf8')
          const data = JSON.parse(decoded)
          return resolve(data)
        } catch {
          try {
            const data = JSON.parse(trimmed)
            return resolve(data)
          } catch {}
        }
      }
      resolve(null)
    })
  })
})

// Save dropped file to Island_Vault on Desktop & reveal
ipcMain.handle('save-dropped-file', async (_, { name, filePath, buffer }) => {
  try {
    const vaultDir = getVaultDir()
    let destName = name || 'dosya_' + Date.now()
    let destPath = path.join(vaultDir, destName)
    
    if (fs.existsSync(destPath)) {
      const ext = path.extname(destName)
      const base = path.basename(destName, ext)
      destName = `${base}_${Date.now()}${ext}`
      destPath = path.join(vaultDir, destName)
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, destPath)
    } else if (buffer) {
      fs.writeFileSync(destPath, Buffer.from(buffer))
    }

    try {
      shell.showItemInFolder(destPath)
    } catch {}

    return { success: true, fileName: destName, destPath, vaultDir }
  } catch (err) {
    console.error('Save error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.on('open-vault', () => {
  shell.openPath(getVaultDir())
})

// Coffee Mode (Prevent Sleep)
ipcMain.on('set-coffee', (_, enable) => {
  if (enable) {
    if (!powerBlockerId) {
      powerBlockerId = powerSaveBlocker.start('prevent-display-sleep')
    }
  } else {
    if (powerBlockerId && powerSaveBlocker.isStarted(powerBlockerId)) {
      powerSaveBlocker.stop(powerBlockerId)
      powerBlockerId = null
    }
  }
})

// Active Tool Launchers
ipcMain.on('launch-tool', (_, tool) => {
  if (tool === 'calculator') shell.openExternal('calculator:')
  else if (tool === 'settings') shell.openExternal('ms-settings:')
  else if (tool === 'volume') shell.openExternal('ms-settings:sound')
  else if (tool === 'phone') shell.openExternal('ms-phone-link:')
  else if (tool === 'snipping') shell.openExternal('ms-screenclip:')
  else if (tool === 'taskmgr') exec('start taskmgr.exe')
  else if (tool === 'notepad') exec('start notepad.exe')
  else if (tool === 'colorpicker') exec('start mspaint.exe')
  else if (tool === 'fullscreen') {
    execFile(MEDIA_CTRL_EXE, ['fullscreen'])
  }
})

ipcMain.on('open-url',  (_, url) => shell.openExternal(url))
ipcMain.on('open-file', (_, fp)  => shell.openPath(fp))
