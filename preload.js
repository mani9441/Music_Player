const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSongs: () => ipcRenderer.invoke('get-songs'),
  callTool: (method, args) => ipcRenderer.invoke('tool-call', method, args),
  toggleFloating: () => ipcRenderer.invoke('toggle-floating'),
  getWindowSize: () => {
    const { width, height } = require('electron').BrowserWindow.getFocusedWindow().getBounds();
    return { width, height };
  },
  setWindowSize: (width, height) => {
    require('electron').BrowserWindow.getFocusedWindow().setSize(width, height);
  },
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  restoreWindow: () => ipcRenderer.invoke('restore-window'),
  onControlMusic: (callback) => ipcRenderer.on('control-music', callback),
  sendControlMusicResponse: (result) => ipcRenderer.send('control-music-response', result)
});