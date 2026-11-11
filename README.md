# YouTube MP3 Batch Downloader

A small Node.js script that reads a list of YouTube links from `links.json` and downloads them as MP3 files, several at a time in parallel. It uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org/) under the hood.

## Features

- Reads all links from a simple `links.json` array
- Downloads multiple files in parallel (default: 4 at a time, configurable)
- Accepts full YouTube URLs, `youtu.be` links, Shorts links, or bare 11-character video IDs
- Ignores playlist/radio parameters (`&list=...`) and downloads only the single video
- Removes duplicate links automatically
- Checks that `yt-dlp` and `ffmpeg` are installed before starting
- Prints per-link results and a final summary of successes and failures
- No npm dependencies (only Node.js built-ins)

## Requirements

| Tool | Purpose | Minimum |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | Runs the script | 18 or newer recommended |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Downloads the audio from YouTube | latest |
| [FFmpeg](https://ffmpeg.org/) | Converts the audio to MP3 | any recent version |

## Installation

### 1. Get the project

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
```

The script is written as an ES module, so make sure `package.json` contains `"type": "module"`. If you don't have a `package.json` yet:

```bash
npm init -y
```

then add this line inside the generated `package.json`:

```json
"type": "module"
```

### 2. Install yt-dlp and FFmpeg

#### Windows (winget)

```powershell
winget install --id yt-dlp.yt-dlp -e
winget install Gyan.FFmpeg
```

**Close and reopen your terminal afterwards** (in VS Code, close the whole app). Programs installed by winget are only visible to terminals opened after the install.

If a command is still not found in your current terminal, refresh PATH without restarting:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
```

#### macOS (Homebrew)

```bash
brew install yt-dlp ffmpeg
```

#### Linux

```bash
# FFmpeg (Debian/Ubuntu example)
sudo apt install ffmpeg

# yt-dlp: the distro package is often outdated, so prefer pip or the standalone binary
python3 -m pip install -U yt-dlp
# or
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### 3. Verify the installation

Open a **new** terminal and run:

```bash
node --version
yt-dlp --version
ffmpeg -version
```

All three must print a version number.

#### Manual install on Windows (if winget fails)

```powershell
mkdir C:\tools -Force
Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile "C:\tools\yt-dlp.exe"
```

Download an FFmpeg build (for example the "release essentials" zip from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)), and copy `ffmpeg.exe` from its `bin` folder into `C:\tools`. Then add the folder to your PATH:

```powershell
$old = [Environment]::GetEnvironmentVariable("Path","User")
[Environment]::SetEnvironmentVariable("Path", "$old;C:\tools", "User")
```

Open a new terminal and verify again.

## Usage

### 1. Add your links

Edit `links.json` and put your links in an array:

```json
[
  "https://www.youtube.com/watch?v=Vhd6Kc4TZls",
  "https://youtu.be/dQw4w9WgXcQ",
  "9bZkp7q19f0"
]
```

Supported formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `VIDEO_ID` (11 characters)

Links with extra parameters, such as `&list=RD...&start_radio=1`, are fine: only the single video is downloaded.

### 2. Run the script

```bash
node download.js
```

MP3 files are saved in the `downloads/` folder, named after the video title.

### Example output

```
Downloading 3 link(s), 4 at a time...

▶ Starting: https://www.youtube.com/watch?v=Vhd6Kc4TZls
▶ Starting: https://youtu.be/dQw4w9WgXcQ
▶ Starting: https://www.youtube.com/watch?v=9bZkp7q19f0
✔ [1/3] https://youtu.be/dQw4w9WgXcQ
✔ [2/3] https://www.youtube.com/watch?v=Vhd6Kc4TZls
✖ [3/3] https://www.youtube.com/watch?v=9bZkp7q19f0
    ERROR: Video unavailable

=========== Summary ===========
Downloaded: 2
Failed:     1
  - https://www.youtube.com/watch?v=9bZkp7q19f0: ERROR: Video unavailable
Files saved in: /path/to/downloads
```

The script exits with code `1` if any download failed, and `0` otherwise.

## Configuration

Settings are at the top of `download.js`:

| Setting | Default | Description |
|---------|---------|-------------|
| `LINKS_FILE` | `./links.json` | File containing the array of links |
| `OUTPUT_DIR` | `./downloads` | Where MP3 files are saved |
| `PARALLEL` | `4` | Number of simultaneous downloads (4 to 5 works well) |
| `AUDIO_QUALITY` | `"0"` | `0` is best quality, `10` is worst. You can also use a bitrate such as `"192K"` |

Setting `PARALLEL` too high may cause YouTube to rate-limit you, so keep it modest.

### Environment variable

If `yt-dlp` is not on your PATH, point the script to it directly.

PowerShell:
```powershell
$env:YTDLP_PATH="C:\tools\yt-dlp.exe"; node download.js
```

cmd.exe:
```cmd
set YTDLP_PATH=C:\tools\yt-dlp.exe
node download.js
```

macOS / Linux:
```bash
YTDLP_PATH=/path/to/yt-dlp node download.js
```

## Updating

YouTube changes its site frequently, and downloads can break until yt-dlp is updated. **Updating yt-dlp is the first thing to try whenever downloads start failing.**

| How you installed it | Update command |
|----------------------|----------------|
| winget (Windows) | `winget upgrade yt-dlp.yt-dlp` |
| Standalone `.exe` / binary | `yt-dlp -U` |
| pip | `python3 -m pip install -U yt-dlp` |
| Homebrew (macOS) | `brew upgrade yt-dlp` |

Keep FFmpeg reasonably current too (`winget upgrade Gyan.FFmpeg` or `brew upgrade ffmpeg`), though it rarely causes problems.

To update this project itself:

```bash
git pull
```

## Troubleshooting

**`Could not run "yt-dlp"` or `spawn yt-dlp ENOENT`**
yt-dlp is not installed or not on your PATH. Install it (see above), then open a new terminal. Alternatively, set `YTDLP_PATH` to the full path of the executable.

**`Could not run "ffmpeg"`**
FFmpeg is missing or not on your PATH. Install it and open a new terminal.

**`'yt-dlp' is not recognized` right after installing**
The terminal was opened before the install. Close it and open a new one, or refresh PATH with the PowerShell command in the installation section.

**Many links fail with errors like "Sign in to confirm you're not a bot" or HTTP 403**
First update yt-dlp. If it persists, you may be rate-limited: lower `PARALLEL`, wait a while, and try again. Some videos (private, age-restricted, region-locked) cannot be downloaded without extra options.

**`__dirname is not defined in ES module scope` or `require is not defined`**
You are running an older CommonJS version of the script. Use the current `download.js`, which is an ES module, and make sure `package.json` has `"type": "module"`.

**Files are not converted to MP3**
Check that `ffmpeg -version` works in the same terminal you run `node` from.

## Project structure

```
.
├── download.js     # the script
├── links.json      # your list of links
├── package.json    # must contain "type": "module"
├── downloads/      # created automatically; MP3 files go here
└── README.md
```

## Why yt-dlp and not `youtube-mp3-downloader`?

An earlier version of this project used the npm package `youtube-mp3-downloader`. It depends on `ytdl-core`, which is no longer maintained and now fails with errors such as `Could not extract functions`. yt-dlp is actively maintained and updated quickly when YouTube changes, which makes it a far more reliable choice.

## Legal notice

This tool is intended for downloading content you have the right to download, such as your own uploads, Creative Commons material, or content you have permission to use. Downloading copyrighted material without permission may violate YouTube's Terms of Service and copyright law in your country. You are responsible for how you use this software.

## License

Add the license of your choice (for example MIT) here.