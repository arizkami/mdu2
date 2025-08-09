// Electron main process

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { mediaDownloader } from '../../core/index.js';
import type { DownloadProgress } from '../../core/index.js';
import { getAllExtractors } from '../../core/extractors.js';
import * as fs from 'fs';

// Register all extractors
getAllExtractors().forEach(extractor => {
  mediaDownloader.registerExtractor(extractor);
});

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Track active downloads
const activeDownloads = new Map<string, DownloadProgress>();

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Extract media information
ipcMain.handle('extract-media', async (event, url: string) => {
  try {
    const result = await mediaDownloader.extract(url);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

// Start download
ipcMain.handle('start-download', async (event, url: string, options: {
  outputPath: string;
  format?: 'mp4' | 'mp3' | 'wav' | 'aac' | 'm4a';
  quality?: string;
  audioQuality?: 'low' | 'medium' | 'high';
}) => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(options.outputPath)) {
      fs.mkdirSync(options.outputPath, { recursive: true });
    }

    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start download with progress tracking
    const downloadPromise = mediaDownloader.download(url, {
      ...options,
      onProgress: (progress) => {
        activeDownloads.set(downloadId, progress);
        // Send progress update to renderer
        mainWindow?.webContents.send('download-progress', progress);
      }
    });

    // Don't await here - let it run in background
    downloadPromise
      .then((filePath) => {
        mainWindow?.webContents.send('download-completed', {
          downloadId,
          filePath,
          url
        });
        activeDownloads.delete(downloadId);
      })
      .catch((error) => {
        mainWindow?.webContents.send('download-error', {
          downloadId,
          error: error instanceof Error ? error.message : 'Unknown error',
          url
        });
        activeDownloads.delete(downloadId);
      });

    return { success: true, downloadId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

// Get active downloads
ipcMain.handle('get-active-downloads', () => {
  return Array.from(activeDownloads.values());
});

// Select output directory
ipcMain.handle('select-output-directory', async () => {
  if (!mainWindow) return { success: false, error: 'No main window' };
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Directory'
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }
  
  return { success: true, path: result.filePaths[0] };
});

// Get available extractors
ipcMain.handle('get-extractors', () => {
  return getAllExtractors().map(extractor => ({
    name: extractor.name
  }));
});

// Show item in folder
ipcMain.handle('show-in-folder', async (event, filePath: string) => {
  const { shell } = await import('electron');
  shell.showItemInFolder(filePath);
});

// Open external URL
ipcMain.handle('open-external', async (event, url: string) => {
  const { shell } = await import('electron');
  await shell.openExternal(url);
});

// Handle app updates and other system events
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});