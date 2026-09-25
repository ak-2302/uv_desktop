export type UvStatus = 'detected' | 'missing' | 'error';
export type OperationStatus = 'success' | 'error' | 'cancelled' | 'running';

export interface UvInfo {
  status: UvStatus;
  path?: string;
  version?: string;
  message?: string;
}

export interface ProjectState {
  path: string;
  name: string;
  pythonRequirement: string;
  pythonVersion: string;
  platform: string;
  uvLock: boolean;
  environment: 'synced' | 'missing' | 'outdated';
  dependencies: Dependency[];
}

export interface Dependency {
  name: string;
  version: string;
  group: 'main' | 'dev' | 'optional';
}

export interface OperationResult {
  processId: string;
  status: OperationStatus;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  startedAt: string;
  finishedAt?: string;
}

export interface AppSettings {
  uvPath?: string;
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  retainLogs: boolean;
}

export interface UvDesktopApi {
  detectUv: () => Promise<UvInfo>;
  inspectProject: (path: string) => Promise<ProjectState | null>;
  selectDirectory: () => Promise<string | null>;
  runUv: (command: string, args: string[], cwd: string) => Promise<OperationResult>;
  cancelUv: (processId: string) => Promise<boolean>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
}

declare global {
  interface Window {
    uvDesktop?: UvDesktopApi;
  }
}
