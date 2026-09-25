import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { execFile, ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppSettings, OperationResult, ProjectState, UvInfo } from '../shared/types';

const activeProcesses = new Map<string, ChildProcess>();
let mainWindow: BrowserWindow | null = null;
let settings: AppSettings = { theme: 'system', language: 'ja', retainLogs: true };

function getUvCommand() {
  return process.platform === 'win32' ? 'uv.exe' : 'uv';
}

function detectUv(): Promise<UvInfo> {
  return new Promise((resolve) => {
    execFile(getUvCommand(), ['--version'], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        resolve({ status: 'missing', message: stderr.trim() || 'uvが見つかりません。' });
        return;
      }
      resolve({ status: 'detected', version: stdout.trim(), path: getUvCommand() });
    });
  });
}

function inspectProject(projectPath: string): ProjectState | null {
  const pyprojectPath = join(projectPath, 'pyproject.toml');
  if (!existsSync(pyprojectPath)) return null;
  const source = readFileSync(pyprojectPath, 'utf8');
  const name = source.match(/^name\s*=\s*["']([^"']+)["']/m)?.[1] ?? basename(projectPath);
  const pythonRequirement = source.match(/^requires-python\s*=\s*["']([^"']+)["']/m)?.[1] ?? '指定なし';
  const dependencies = [...source.matchAll(/^\s*["']([a-zA-Z0-9_.-]+)(?:[<>=!~].*)?["'],?\s*$/gm)].slice(0, 8).map((match) => ({ name: match[1], version: '指定済み', group: 'main' as const }));
  return { path: projectPath, name, pythonRequirement, pythonVersion: '3.11.8', platform: `${process.platform} (${process.arch})`, uvLock: existsSync(join(projectPath, 'uv.lock')), environment: existsSync(join(projectPath, '.venv')) ? 'synced' : 'missing', dependencies };
}

function runUv(command: string, args: string[], cwd: string): Promise<OperationResult> {
  const processId = randomUUID();
  const startedAt = new Date().toISOString();
  return new Promise((resolve) => {
    const child = execFile(getUvCommand(), [command, ...args], { cwd, windowsHide: true }, (error, stdout, stderr) => {
      activeProcesses.delete(processId);
      resolve({ processId, status: error?.killed ? 'cancelled' : error ? 'error' : 'success', exitCode: error?.code && typeof error.code === 'number' ? error.code : error ? 1 : 0, stdout, stderr, startedAt, finishedAt: new Date().toISOString() });
    });
    activeProcesses.set(processId, child);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 1024, minHeight: 680, webPreferences: { preload: join(__dirname, '../preload/preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false } });
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(join(__dirname, '../dist/index.html'));
}

ipcMain.handle('uv:detect', detectUv);
ipcMain.handle('project:inspect', (_event, path: string) => inspectProject(path));
ipcMain.handle('project:select-directory', async () => (await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })).filePaths[0] ?? null);
ipcMain.handle('uv:run', (_event, command: string, args: string[], cwd: string) => runUv(command, args, cwd));
ipcMain.handle('uv:cancel', (_event, processId: string) => { const child = activeProcesses.get(processId); if (!child) return false; child.kill(); return true; });
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:update', (_event, update: Partial<AppSettings>) => { settings = { ...settings, ...update }; return settings; });

app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
