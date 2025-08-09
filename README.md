# Media Downloader Utility (MDU)

A next-generation, minimalist media downloader rewritten entirely in TypeScript.  
Supports both CLI and Electron GUI with a custom-built download engine — no more dependencies on yt-dlp or Python.

---

## Features

- Fully rewritten from scratch in TypeScript (CLI + Electron GUI)  
- Custom download engine with chunked downloading, resume, retry, and progress reporting  
- Modern GUI built with Electron, Solid.js, and Vite for a smooth user experience  
- Cross-platform support: Windows, macOS, and Linux  
- Modular extractor system for easy addition of new platforms  
- Lightweight, fast, and efficient  

---

## Installation

### Prerequisites

- Node.js (for building from source)  
- Supported OS: Windows 10+, macOS, Linux  
- Internet connection  

### Steps to Install

1. Download the latest release from the [releases](https://github.com/arizkami/mdu/releases) page.  
2. Run the installer or extract the archive depending on your platform.  
3. Launch the application via Start Menu / Desktop shortcut or CLI terminal.

---

## Usage

### GUI

1. Open the application.  
2. Paste the URL of the media you want to download.  
3. Select the format and quality.  
4. Click "Download" and track progress in real-time.

### CLI

```bash
mdu download <url> [options]
````

* Supports format selection, output path, and other advanced options.
* Displays detailed progress in terminal.

---

## Contributing

Contributions are very welcome!
Please fork the repo, create your feature branch, and open a pull request with detailed descriptions.

---

## License

This project is licensed under the MIT License.
See the [LICENSE](LICENSE) file for full details.

---
## Acknowledgments

* [Electron](https://www.electronjs.org/) for the desktop shell
* [Solid.js](https://www.solidjs.com/) for frontend UI
* [Vite](https://vitejs.dev/) for fast bundling
* [FFmpeg](https://www.ffmpeg.org/) for media processing (optional, if installed)
---
