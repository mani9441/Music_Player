const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    minWidth: 250,
    minHeight: 300,
    maxWidth: 1000,
    maxHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, "icon.ico"), // Add taskbar icon
  });

  mainWindow.loadFile("index.html");

  // Handle toggle floating
  ipcMain.handle("toggle-floating", () => {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!isAlwaysOnTop, "floating");
    return !isAlwaysOnTop;
  });

  // Handle restore
  ipcMain.handle("restore-window", () => {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    return "Window restored";
  });
}

// Dynamically load songs from MUSIC_FOLDER
const MUSIC_FOLDER = path.join(__dirname, "songs");
function getMusicFiles() {
  try {
    if (!fs.existsSync(MUSIC_FOLDER)) {
      console.error(`Music folder does not exist: ${MUSIC_FOLDER}`);
      return [];
    }
    const files = fs
      .readdirSync(MUSIC_FOLDER)
      .filter((file) => file.toLowerCase().endsWith(".mp3"))
      .map((file) => ({
        name: file,
        path: path.join(MUSIC_FOLDER, file),
      }));
    console.log("Songs found:", files);
    return files;
  } catch (err) {
    console.error("Error reading music folder:", err);
    return [];
  }
}

ipcMain.handle("minimize-window", () => {
  mainWindow.minimize();
  return "Window minimized";
});

ipcMain.handle("restore-window", () => {
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  return "Window restored";
});

//IPC to send songs to renderer
ipcMain.handle("get-songs", () => {
  return getMusicFiles();
});

const MusicPlayerTool = {
  play: async () => {
    console.log("Main: Sending control-music: play");
    try {
      mainWindow.webContents.send("control-music", "play");
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timeout: play")),
          5000
        );
        ipcMain.once("control-music-response", (event, result) => {
          clearTimeout(timeout);
          console.log("Main: Received response: play", result);
          resolve(result || "Played song");
        });
      });
    } catch (err) {
      console.error("Main: Error in play:", err.message);
      throw new Error(`Play failed: ${err.message}`);
    }
  },
  pause: async () => {
    console.log("Main: Sending control-music: pause");
    try {
      mainWindow.webContents.send("control-music", "pause");
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timeout: pause")),
          5000
        );
        ipcMain.once("control-music-response", (event, result) => {
          clearTimeout(timeout);
          console.log("Main: Received response: pause", result);
          resolve(result || "Paused song");
        });
      });
    } catch (err) {
      console.error("Main: Error in pause:", err.message);
      throw new Error(`Pause failed: ${err.message}`);
    }
  },
  stop: async () => {
    console.log("Main: Sending control-music: stop");
    try {
      mainWindow.webContents.send("control-music", "stop");
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timeout: stop")),
          5000
        );
        ipcMain.once("control-music-response", (event, result) => {
          clearTimeout(timeout);
          console.log("Main: Received response: stop", result);
          resolve(result || "Stopped song");
        });
      });
    } catch (err) {
      console.error("Main: Error in stop:", err.message);
      throw new Error(`Stop failed: ${err.message}`);
    }
  },
  skip: async () => {
    console.log("Main: Sending control-music: skip");
    try {
      mainWindow.webContents.send("control-music", "skip");
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timeout: skip")),
          5000
        );
        ipcMain.once("control-music-response", (event, result) => {
          clearTimeout(timeout);
          console.log("Main: Received response: skip", result);
          resolve(result || "Playing song");
        });
      });
    } catch (err) {
      console.error("Main: Error in skip:", err.message);
      throw new Error(`Skip failed: ${err.message}`);
    }
  },
  playSong: async (songName) => {
    console.log("Main: Sending control-music: playSong", songName);
    try {
      mainWindow.webContents.send("control-music", "playSong", songName);
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timeout: playSong")),
          5000
        );
        ipcMain.once("control-music-response", (event, result) => {
          clearTimeout(timeout);
          console.log("Main: Received response: playSong", result);
          resolve(result || `Playing ${songName}`);
        });
      });
    } catch (err) {
      console.error("Main: Error in playSong:", err.message);
      throw new Error(`PlaySong failed: ${err.message}`);
    }
  },
  getSongs: () => {
    try {
      return getMusicFiles()
        .map((s) => s.name)
        .join(",");
    } catch (err) {
      console.error("Main: Error in getSongs:", err.message);
      throw new Error(`GetSongs failed: ${err.message}`);
    }
  },
  toggleFloating: async () => {
    try {
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(!isAlwaysOnTop, "floating");
      return `Floating ${!isAlwaysOnTop ? "enabled" : "disabled"}`;
    } catch (err) {
      console.error("Main: Error in toggleFloating:", err.message);
      throw new Error(`ToggleFloating failed: ${err.message}`);
    }
  },
  minimize: async () => {
    try {
      mainWindow.minimize();
      return "Window minimized";
    } catch (err) {
      console.error("Main: Error in minimize:", err.message);
      throw new Error(`Minimize failed: ${err.message}`);
    }
  },
};

ipcMain.on("control-music-response", (event, result) => {
  event.sender.send("control-music-response", result);
});

http
  .createServer(async (req, res) => {
    if (req.url.startsWith("/tool/")) {
      const [method, ...args] = req.url.split("/").slice(2);
      try {
        const result = await MusicPlayerTool[method]?.(...args);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(result || "Method not found");
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Error: ${err.message}`);
      }
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(3000, () => {
    console.log("HTTP server running on http://localhost:3000");
  });

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
