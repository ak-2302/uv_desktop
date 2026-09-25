import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, UvDesktopApi } from '../shared/types';

const api: UvDesktopApi = {
  detectUv: () => ipcRenderer.invoke('uv:detect'),
  inspectProject: (path) => ipcRenderer.invoke('project:inspect', path),
  selectDirectory: () => ipcRenderer.invoke('project:select-directory'),
  runUv: (command, args, cwd) => ipcRenderer.invoke('uv:run', command, args, cwd),
  cancelUv: (processId) => ipcRenderer.invoke('uv:cancel', processId),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', settings)
};

contextBridge.exposeInMainWorld('uvDesktop', api);
