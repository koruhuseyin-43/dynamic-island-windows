const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const os   = require('os')
const { execSync } = require('child_process')

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

// ─── IPC ──────────────────────────────────────────────────────────
ipcMain.on('expand', (_, { w, h }) => {
  const { x, y } = centerTop(w)
  mainWindow.setBounds({ x, y, width: w, height: h }, true)
  mainWindow.setIgnoreMouseEvents(false)
})

ipcMain.on('collapse', () => {
  const { x, y } = centerTop(PILL_W)
  mainWindow.setBounds({ x, y, width: PILL_W, height: PILL_H }, true)
})

ipcMain.handle('sysinfo', () => ({
  cpus:     os.cpus().length,
  totalMem: Math.round(os.totalmem() / 1073741824),
  freeMem:  Math.round(os.freemem()  / 1073741824),
  uptime:   Math.round(os.uptime()   / 3600)
}))

ipcMain.handle('getMediaInfo', async () => {
  try {
    // Query Windows Media Session via PowerShell
    const ps = `
      $sessions = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType=WindowsRuntime]
      $manager  = [System.Threading.Tasks.Task]::Run({ $sessions::RequestAsync() }).Result
      $session  = $manager.GetCurrentSession()
      if ($session) {
        $info = [System.Threading.Tasks.Task]::Run({ $session.TryGetMediaPropertiesAsync() }).Result
        "$($info.Title)|$($info.Artist)"
      }
    `
    const out = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 2000 }).toString().trim()
    if (out && out.includes('|')) {
      const [title, artist] = out.split('|')
      return { title: title.trim(), artist: artist.trim() }
    }
  } catch {}
  return null
})

ipcMain.on('open-url',  (_, url) => shell.openExternal(url))
ipcMain.on('open-file', (_, fp)  => shell.openPath(fp))
