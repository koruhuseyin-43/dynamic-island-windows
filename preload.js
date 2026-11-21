const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  expand:          size => ipcRenderer.send('expand', size),
  collapse:        ()   => ipcRenderer.send('collapse'),
  sysinfo:         ()   => ipcRenderer.invoke('sysinfo'),
  getMediaInfo:    ()   => ipcRenderer.invoke('getMediaInfo'),
  mediaControl:    act  => ipcRenderer.send('media-control', act),
  launchTool:      tool => ipcRenderer.send('launch-tool', tool),
  saveDroppedFile: data => ipcRenderer.invoke('save-dropped-file', data),
  openVault:       ()   => ipcRenderer.send('open-vault'),
  setCoffee:       val  => ipcRenderer.send('set-coffee', val),
  openUrl:         url  => ipcRenderer.send('open-url', url),
  openFile:        fp   => ipcRenderer.send('open-file', fp),
})
