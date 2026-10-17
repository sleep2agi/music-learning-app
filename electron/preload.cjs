const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('lequdaoDesktop', {
  platform: process.platform,
  fetchText: (url) => ipcRenderer.invoke('lequdao-fetch-text', url),
  fetchBytes: (url) => ipcRenderer.invoke('lequdao-fetch-bytes', url),
})
