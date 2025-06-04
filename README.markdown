# Electron Music Player

A sleek, customizable music player built with [Electron](https://www.electronjs.org/) featuring an Iron Man-inspired holographic UI. It plays MP3 files from a local folder, supports HTTP-based control for external automation (e.g., via LangChain), and offers a floating, resizable window with a transparent, frameless design.

## Features
- **Iron Man Hologram UI**: A futuristic, transparent interface with glowing buttons and a song list dropdown.
- **Local MP3 Playback**: Plays MP3 files from the `/songs` folder.
- **HTTP Control**: Control playback via HTTP endpoints (e.g., `http://localhost:3000/tool/skip`) for integration with tools like LangChain.
- **Floating Window**: Toggleable always-on-top mode for a floating experience.
- **Resizable Window**: Drag to resize with constraints (min: 250x300, max: 1000x800).
- **Custom Controls**: Play, pause, stop, skip, and select songs via UI or HTTP.
- **Taskbar Icon**: Custom icon (`icon.ico`) for the Windows taskbar.
- **Cross-Platform**: Built with Electron, compatible with Windows, macOS, and Linux (tested on Windows).

## Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (included with Node.js)
- MP3 files in the `/songs` folder (relative to the project root)

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/electron-music-player.git
   cd electron-music-player
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Add MP3 Files**:
   - Place MP3 files in the `/songs` folder.
   - Example: `/songs/song1.mp3`, `automations/songs/song2.mp3`.
4. **Run the App**:
   ```bash
   npm start
   ```

## Usage
### UI Controls
- **Play**: Starts a random song or resumes a paused song.
- **Pause**: Pauses the current song.
- **Stop**: Stops playback and resets the song.
- **Skip**: Skips to a random song.
- **Song List**: Select a song from the dropdown to play it.
- **Float**: Toggles always-on-top mode (default: on).
- **Resize**: Drag the bottom or bottom-right edges to resize the window.

### HTTP Control
The app runs an HTTP server on `http://localhost:3000`. Use these endpoints to control the player:
- **Play**: `GET http://localhost:3000/tool/play`
  - Response: `Played song`
- **Pause**: `GET http://localhost:3000/tool/pause`
  - Response: `Paused song`
- **Stop**: `GET http://localhost:3000/tool/stop`
  - Response: `Stopped song`
- **Skip**: `GET http://localhost:3000/tool/skip`
  - Response: `Playing song`
- **Play Specific Song**: `GET http://localhost:3000/tool/playSong/song1.mp3`
  - Response: `Playing song1.mp3` or `Song not found`
- **Get Songs**: `GET http://localhost:3000/tool/getSongs`
  - Response: Comma-separated list (e.g., `song1.mp3,song2.mp3`)
- **Toggle Floating**: `GET http://localhost:3000/tool/toggleFloating`
  - Response: `Floating enabled` or `Floating disabled`
- **Minimize**: `GET http://localhost:3000/tool/minimize`
  - Response: `Window minimized`

Example with `curl`:
```bash
curl http://localhost:3000/tool/skip
```

### LangChain Integration
The HTTP endpoints are compatible with LangChain tools. Example setup (in Python):
```python
from langchain.tools import Tool
import requests

music_player_tool = Tool(
    name="MusicPlayer",
    func=lambda command: requests.get(f"http://localhost:3000/tool/{command}").text,
    description="Control the music player (e.g., play, pause, skip, playSong/song1.mp3)"
)
```
See `agent_example.py` (not included) for a full example.

## Project Structure
```
electron-music-player/
├── songs                  # Place MP3 files here         
├── icon.ico                # Taskbar icon
├── index.html              # Main UI (Iron Man hologram)
├── main.js                 # Electron main process (window, HTTP server)
├── preload.js              # Context bridge for IPC
├── renderer.js             # Renderer process (UI logic, playback)
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Development
### Dependencies
- `electron`: Desktop app framework
- `fs`, `path`, `http`: Node.js built-in modules for file and HTTP handling

### Scripts
- `npm start`: Launches the app
- `npm install`: Installs dependencies

### Debugging
- Open DevTools (Ctrl+Shift+I) to view console logs.
- Check terminal for HTTP server logs (e.g., `Main: Sending control-music: skip`).
- Ensure MP3 files are in `automations/songs`.

### Build for Distribution
To package the app:
1. Install `electron-packager`:
   ```bash
   npm install electron-packager --save-dev
   ```
2. Run:
   ```bash
   npx electron-packager . music-player --platform=win32 --arch=x64 --icon=icon.ico
   ```
   - Replace `win32` with `darwin` (macOS) or `linux` as needed.
   - Output: `music-player-win32-x64` folder with the executable.

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit changes (`git commit -m "Add new feature"`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a pull request.

## License
[MIT License](LICENSE) - Free to use, modify, and distribute.

## Issues
Report bugs or request features via [GitHub Issues](https://github.com/your-username/electron-music-player/issues).

## Acknowledgments
- Inspired by Iron Man’s holographic interfaces.
- Built with Electron and Node.js.
- Thanks to the open-source community!
