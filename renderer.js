document.addEventListener("DOMContentLoaded", () => {
  // Music player configuration
  let songs = [];
  const audio = new Audio();
  let isPaused = false;
  let currentSongIndex = -1;

  // UI elements
  const nowPlaying = document.getElementById("now-playing");
  const songList = document.getElementById("song-list");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const stopBtn = document.getElementById("stop-btn");
  const skipBtn = document.getElementById("skip-btn");
  const floatBtn = document.getElementById("float-btn");
  const resizeBottomRight = document.querySelector(".resize-bottom-right");
  const resizeBottom = document.querySelector(".resize-bottom");

  // Load songs from main process
  window.electronAPI
    .getSongs()
    .then((songFiles) => {
      songs = songFiles;
      songList.innerHTML = '<option value="">Select a song</option>';
      songs.forEach((song, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = song.name;
        songList.appendChild(option);
      });
      if (songs.length === 0) {
        nowPlaying.textContent = "No MP3 files found in folder";
      }
    })
    .catch((err) => {
      console.error("Error loading songs:", err);
      nowPlaying.textContent = "Error loading songs";
    });

  // Play a random song
  function playRandomSong() {
    if (songs.length === 0) {
      nowPlaying.textContent = "No songs available";
      return;
    }
    currentSongIndex = Math.floor(Math.random() * songs.length);
    const songPath = songs[currentSongIndex].path;
    audio.src = `file://${songPath.replace(/\\/g, "/")}`;
    audio.play().catch((err) => {
      console.error("Playback error:", err);
      nowPlaying.textContent = "Error playing song";
    });
    nowPlaying.textContent = `🎵 Now playing: ${songs[currentSongIndex].name}`;
    songList.value = currentSongIndex;
  }

  // Play specific song by index
  function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    currentSongIndex = index;
    const songPath = songs[currentSongIndex].path;
    audio.src = `file://${songPath.replace(/\\/g, "/")}`;
    audio.play().catch((err) => {
      console.error("Playback error:", err);
      nowPlaying.textContent = "Error playing song";
    });
    nowPlaying.textContent = `🎵 Now playing: ${songs[currentSongIndex].name}`;
    songList.value = currentSongIndex;
    isPaused = false;
  }

  // Pause song
  function pauseSong() {
    audio.pause();
    isPaused = true;
    nowPlaying.textContent = `⏸ Paused: ${
      songs[currentSongIndex]?.name || "No song"
    }`;
  }

  // Resume song
  function resumeSong() {
    if (currentSongIndex >= 0) {
      audio.play().catch((err) => {
        console.error("Playback error:", err);
        nowPlaying.textContent = "Error playing song";
      });
      isPaused = false;
      nowPlaying.textContent = `🎵 Now playing: ${songs[currentSongIndex].name}`;
    }
  }

  // Stop song
  function stopSong() {
    audio.pause();
    audio.currentTime = 0;
    isPaused = false;
    currentSongIndex = -1;
    nowPlaying.textContent = "Stopped";
    songList.value = "";
  }

  // Skip to next song
  function skipSong() {
    if (songs.length === 0) {
      console.error("Renderer: No songs available to skip");
      return "No songs available";
    }
    stopSong();
    playRandomSong();
    return "Playing song";
  }

  // Toggle floating
  floatBtn.addEventListener("click", () => {
    window.electronAPI.toggleFloating().then((isFloating) => {
      floatBtn.textContent = `Float: ${isFloating ? "On" : "Off"}`;
    });
  });

  // Event listeners for buttons
  playBtn.addEventListener("click", () => {
    if (isPaused) {
      resumeSong();
    } else {
      playRandomSong();
    }
  });
  pauseBtn.addEventListener("click", pauseSong);
  stopBtn.addEventListener("click", stopSong);
  skipBtn.addEventListener("click", skipSong);
  songList.addEventListener("change", (e) => {
    const index = parseInt(e.target.value);
    if (!isNaN(index)) {
      stopSong();
      playSong(index);
    }
  });

  // Handle song end
  audio.addEventListener("ended", skipSong);

  // Custom resize logic
  let isResizing = false;
  let resizeType = "";
  let startX, startY, startWidth, startHeight;

  function startResize(e, type) {
    isResizing = true;
    resizeType = type;
    startX = e.clientX;
    startY = e.clientY;
    const { width, height } = window.electronAPI.getWindowSize();
    startWidth = width;
    startHeight = height;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  }

  function resize(e) {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newWidth = startWidth;
    let newHeight = startHeight;

    if (resizeType === "bottom-right") {
      newWidth = Math.max(250, Math.min(1000, startWidth + dx));
      newHeight = Math.max(300, Math.min(800, startHeight + dy));
    } else if (resizeType === "bottom") {
      newHeight = Math.max(300, Math.min(800, startHeight + dy));
    }

    window.electronAPI.setWindowSize(newWidth, newHeight);
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }

  resizeBottomRight.addEventListener("mousedown", (e) =>
    startResize(e, "bottom-right")
  );
  resizeBottom.addEventListener("mousedown", (e) => startResize(e, "bottom"));

  window.electronAPI.onControlMusic((event, method, ...args) => {
    console.log("Renderer: Received control-music:", method, args);
    let result = "Unknown error";
    try {
      switch (method) {
        case "play":
          console.log("Renderer: Executing play");
          result = isPaused ? resumeSong() : playRandomSong();
          break;
        case "pause":
          console.log("Renderer: Executing pause");
          result = pauseSong();
          break;
        case "stop":
          console.log("Renderer: Executing stop");
          result = stopSong();
          break;
        case "skip":
          console.log("Renderer: Executing skip");
          result = skipSong();
          break;
        case "playSong":
          console.log("Renderer: Executing playSong", args[0]);
          const songName = args[0];
          const index = songs.findIndex(
            (s) => s.name.toLowerCase() === songName.toLowerCase()
          );
          result = index >= 0 ? playSong(index) : "Song not found";
          break;
        default:
          result = "Method not found";
      }
      if (!result) {
        console.warn("Renderer: No result from", method);
        result = `${method} executed`;
      }
    } catch (err) {
      console.error("Renderer: Error in control-music:", method, err);
      result = `Error: ${err.message}`;
    }
    console.log("Renderer: Sending response:", result);
    try {
      window.electronAPI.sendControlMusicResponse(result);
      console.log("Renderer: Response sent successfully");
    } catch (sendErr) {
      console.error("Renderer: Failed to send response:", sendErr);
    }
  });
});
