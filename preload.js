const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  expand:   (size) => ipcRenderer.send('expand', size),
  collapse: ()     => ipcRenderer.send('collapse'),
  sysinfo:  ()     => ipcRenderer.invoke('sysinfo'),
  openUrl:  (url)  => ipcRenderer.send('open-url', url),
  openFile: (fp)   => ipcRenderer.send('open-file', fp),
})
