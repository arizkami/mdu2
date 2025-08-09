// Preload script for secure IPC communication

import { contextBridge, ipcRenderer } from 'electron';
import type { ExtractResult, DownloadProgress } from '../../core/index.js';

// Define the API interface that will be exposed to the renderer
export interface ElectronAPI {
  // Media extraction
  extractMedia: (url: string) => Promise<{
    success: boolean;
    data?: ExtractResult;
    error?: string;
  }>;
  
  // Download management
  startDownload: (url: string, options: {
    outputPath: string;
    format?: string;
    quality?: string;
  }) => Promise<{
    success: boolean;
    downloadId?: string;
    error?: string;
  }>;
  
  getActiveDownloads: () => Promise<DownloadProgress[]>;
  
  // File system operations
  selectOutputDirectory: () => Promise<{
    success: boolean;
    path?: string;
    canceled?: boolean;
    error?: string;
  }>;
  
  showInFolder: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  
  // System info
  getExtractors: () => Promise<Array<{ name: string }>>;
  
  // Event listeners
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
  onDownloadCompleted: (callback: (data: {
    downloadId: string;
    filePath: string;
    url: string;
  }) => void) => () => void;
  onDownloadError: (callback: (data: {
    downloadId: string;
    error: string;
    url: string;
  }) => void) => () => void;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Media extraction
  extractMedia: (url: string) => ipcRenderer.invoke('extract-media', url),
  
  // Download management
  startDownload: (url: string, options: {
    outputPath: string;
    format?: string;
    quality?: string;
  }) => ipcRenderer.invoke('start-download', url, options),
  
  getActiveDownloads: () => ipcRenderer.invoke('get-active-downloads'),
  
  // File system operations
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // System info
  getExtractors: () => ipcRenderer.invoke('get-extractors'),
  
  // Event listeners with cleanup
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const listener = (_event: any, progress: DownloadProgress) => callback(progress);
    ipcRenderer.on('download-progress', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('download-progress', listener);
    };
  },
  
  onDownloadCompleted: (callback: (data: {
    downloadId: string;
    filePath: string;
    url: string;
  }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('download-completed', listener);
    
    return () => {
      ipcRenderer.removeListener('download-completed', listener);
    };
  },
  
  onDownloadError: (callback: (data: {
    downloadId: string;
    error: string;
    url: string;
  }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('download-error', listener);
    
    return () => {
      ipcRenderer.removeListener('download-error', listener);
    };
  }
} as ElectronAPI);

// Type declaration for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}