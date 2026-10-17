const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')

const UPDATE_PREFIX = 'https://modelscope.cn/datasets/SmartFlowAI/music-learning-app/resolve/master/latest/'

function assertUpdateUrl(url) {
  if (typeof url !== 'string' || !url.startsWith(UPDATE_PREFIX)) {
    throw new Error('unexpected update url')
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 380,
    minHeight: 640,
    title: '乐趣岛',
    backgroundColor: '#12110f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.loadFile(path.join(__dirname, '../dist/index.html'))
}

ipcMain.handle('lequdao-fetch-text', async (_event, url) => {
  assertUpdateUrl(url)
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`update text ${response.status}`)
  return response.text()
})

ipcMain.handle('lequdao-fetch-bytes', async (_event, url) => {
  assertUpdateUrl(url)
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`update file ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  return bytes.toString('base64')
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
