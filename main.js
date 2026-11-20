const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const os = require('os')

let mainWindow
let tray

const PILL_W = 220
const PILL_H = 36
const EXPAND_W = 480
const EXPAND_H = 340

function getTopCenter(w, h) {
  const { width } = screen.getPrimaryDisplay().workAreaSize
  const bounds = screen.getPrimaryDisplay().bounds
  return { x: Math.round(bounds.x + (bounds.width - w) / 2), y: bounds.y }
}

function createWindow() {
  const pos = getTopCenter(PILL_W, PILL_H)

  mainWindow = new BrowserWindow({
    width: PILL_W,
    height: PILL_H,
    x: pos.x,
    y: pos.y,
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

  // Keep window on top even after focus loss
  mainWindow.on('blur', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
  })
}

function createTray() {
  // Simple 16x16 tray icon (black circle)
  const img = nativeImage.createEmpty()
  tray = new Tray(img)
  const menu = Menu.buildFromTemplate([
    { label: 'Dynamic Island', enabled: false },
    { type: 'separator' },
    { label: 'Show / Hide', click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('Dynamic Island for Windows')
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ─── IPC Handlers ───────────────────────────────────────────────
ipcMain.on('expand', (_, { w, h }) => {
  const pos = getTopCenter(w, h)
  mainWindow.setBounds({ x: pos.x, y: pos.y, width: w, height: h }, true)
  mainWindow.setIgnoreMouseEvents(false)
})

ipcMain.on('collapse', () => {
  const pos = getTopCenter(PILL_W, PILL_H)
  mainWindow.setBounds({ x: pos.x, y: pos.y, width: PILL_W, height: PILL_H }, true)
})

ipcMain.handle('sysinfo', () => ({
  platform: process.platform,
  cpus: os.cpus().length,
  totalMem: Math.round(os.totalmem() / 1024 / 1024 / 1024),
  freeMem: Math.round(os.freemem() / 1024 / 1024 / 1024),
  hostname: os.hostname(),
  uptime: Math.round(os.uptime() / 3600)
}))

ipcMain.on('open-url', (_, url) => shell.openExternal(url))
ipcMain.on('open-file', (_, fp) => shell.openPath(fp))
