import { useEffect, useMemo, useState } from 'react';
import type { Dependency, ProjectState, UvInfo } from '../shared/types';

const fallbackProject: ProjectState = {
  path: '/Users/dev/projects/northstar', name: 'northstar', pythonRequirement: '>=3.11', pythonVersion: '3.11.8', platform: 'macOS (arm64)', uvLock: true, environment: 'synced', dependencies: [
    { name: 'fastapi', version: '0.110.0', group: 'main' }, { name: 'uvicorn', version: '0.29.0', group: 'main' }, { name: 'pydantic', version: '2.6.3', group: 'main' }, { name: 'httpx', version: '0.27.0', group: 'main' }, { name: 'pytest', version: '8.1.1', group: 'dev' }, { name: 'ruff', version: '0.4.2', group: 'dev' }, { name: 'mypy', version: '1.9.0', group: 'dev' }, { name: 'python-dotenv', version: '1.0.1', group: 'main' }
  ]
};

type View = 'overview' | 'dependencies' | 'python' | 'run' | 'logs' | 'settings';
const navItems: { id: View; label: string; icon: string }[] = [
  { id: 'overview', label: '概要', icon: '⌂' }, { id: 'dependencies', label: '依存関係', icon: '◇' }, { id: 'python', label: 'Python環境', icon: '⌘' }, { id: 'run', label: 'コマンド実行', icon: '›_' }, { id: 'logs', label: '実行ログ', icon: '▤' }, { id: 'settings', label: '設定', icon: '⚙' }
];

export function App() {
  const [view, setView] = useState<View>('overview');
  const [project, setProject] = useState<ProjectState>(fallbackProject);
  const [uv, setUv] = useState<UvInfo>({ status: 'detected', version: 'uv 0.4.2', path: 'uv' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showError, setShowError] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => { window.uvDesktop?.detectUv().then(setUv).catch(() => undefined); }, []);

  const filteredDependencies = useMemo(() => project.dependencies.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [project.dependencies, query]);
  const sync = async () => {
    setIsSyncing(true); setShowError(false);
    if (window.uvDesktop) await window.uvDesktop.runUv('sync', [], project.path).catch(() => undefined);
    window.setTimeout(() => setIsSyncing(false), 800);
  };
  const openProject = async () => { const path = await window.uvDesktop?.selectDirectory(); if (!path) return; const inspected = await window.uvDesktop?.inspectProject(path); if (inspected) setProject(inspected); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">uv</span><span>Desktop</span></div>
      <div className="current-project"><span>現在のプロジェクト</span><strong>{project.name}</strong><small>{project.path}</small></div>
      <nav aria-label="メインナビゲーション">{navItems.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
      <button className="switch-project" onClick={openProject}><span>⇄</span>プロジェクトを切り替え</button>
    </aside>
    <main className="workspace">
      <header className="project-header">
        <div><h1>{project.name}</h1><p>{project.path}</p></div>
        <div className="status-strip"><Status label="uv 検出済み" value={uv.version ?? '確認中'} /><Status label="環境 同期済み" value=".venv (Python 3.11)" /><Status label="ロックファイル 最新" value="uv.lock" /></div>
        <button className="primary-action" onClick={sync} disabled={isSyncing}><span>{isSyncing ? '◌' : '⟳'}</span>{isSyncing ? '同期中…' : '同期'}<span className="action-chevron">⌄</span></button>
      </header>
      {view === 'overview' && <Overview dependencies={project.dependencies} showError={showError} onDismiss={() => setShowError(false)} onSync={sync} />}
      {view === 'dependencies' && <Dependencies dependencies={filteredDependencies} query={query} setQuery={setQuery} />}
      {view === 'python' && <PythonEnvironment project={project} />}
      {view === 'run' && <RunCommand project={project} />}
      {view === 'logs' && <Logs />}
      {view === 'settings' && <Settings uv={uv} />}
    </main>
  </div>;
}

function Status({ label, value }: { label: string; value: string }) { return <div className="status-card"><span className="status-check">✓</span><div><strong>{label}</strong><small>{value}</small></div></div>; }
function SectionTitle({ title, count, action }: { title: string; count?: string; action?: string }) { return <div className="section-title"><h2>{title}</h2>{count && <span className="section-count">{count}</span>}{action && <button className="text-action">{action} →</button>}</div>; }

function Overview({ dependencies, showError, onDismiss, onSync }: { dependencies: Dependency[]; showError: boolean; onDismiss: () => void; onSync: () => void }) {
  return <div className="overview-grid"><div className="overview-main"><section className="panel dependencies-panel"><SectionTitle title="依存関係" count={`合計 ${dependencies.length} 件`} action="詳細を表示" /><div className="table-header"><span>パッケージ名</span><span>バージョン</span><span>用途</span><span /></div>{dependencies.map((item) => <div className="dependency-row" key={item.name}><strong>{item.name}</strong><span>{item.version}</span><span>{item.group === 'dev' ? '開発' : '本番'}</span><button aria-label={`${item.name}のメニュー`}>•••</button></div>)}</section><section className="panel environment-panel"><SectionTitle title="Python環境" action="詳細を表示" /><div className="environment-body"><div className="python-symbol">⌘</div><div><strong>Python {fallbackProject.pythonVersion}</strong><span className="tag">アクティブ</span><small>.venv</small></div><dl><dt>実行パス</dt><dd>{fallbackProject.path}/.venv/bin/python</dd><dt>ベース</dt><dd>/usr/local/bin/python3</dd><dt>プラットフォーム</dt><dd>{fallbackProject.platform}</dd></dl></div></section><section className="panel activity-panel"><SectionTitle title="最近の操作" action="すべてのログを表示" /><Activity /></section></div>{showError && <ErrorPanel onDismiss={onDismiss} onRetry={onSync} />}</div>;
}

function Activity() { const rows = [['14:32', '同期', '成功', '依存関係を同期しました'], ['14:20', 'パッケージの追加', '成功', 'fastapi を追加しました'], ['13:11', 'ロックファイルの更新', '成功', 'uv.lock を更新しました'], ['11:03', '同期', '成功', '環境を同期しました'], ['10:15', 'パッケージの削除', '成功', 'old-package を削除しました']]; return <><div className="activity-head"><span>時刻</span><span>操作</span><span>結果</span><span>メッセージ</span></div>{rows.map((row) => <div className="activity-row" key={`${row[0]}-${row[1]}`}><span>{row[0]}</span><span>{row[1]}</span><span className="success">✓ {row[2]}</span><span>{row[3]}</span></div>)}</>; }
function ErrorPanel({ onDismiss, onRetry }: { onDismiss: () => void; onRetry: () => void }) { return <section className="error-panel"><button className="dismiss" onClick={onDismiss} aria-label="エラーを閉じる">×</button><div className="error-heading"><span>!</span><div><h2>同期に失敗しました</h2><p>依存関係の同期中にエラーが発生しました。</p></div></div><div className="error-box"><strong>依存関係の解決に失敗しました</strong><p>要求されたバージョンの組み合わせでは、依存関係の要件を満たすことができません。</p></div><h3>考えられる原因</h3><ul><li>指定されたパッケージのバージョンが互いに競合しています。</li><li>Pythonのバージョン要件を満たしていないパッケージがあります。</li><li>インデックスへの接続に問題が発生している可能性があります。</li></ul><h3>対処方法</h3><ol><li>依存関係のバージョンを確認し、互換性のあるバージョンを指定してください。</li><li>必要に応じて不要な制約を緩めて、再度同期を実行してください。</li><li>問題が解決しない場合は、実行ログで詳細を確認してください。</li></ol><button className="retry-button" onClick={onRetry}>⟳　再試行</button><button className="detail-error">詳細なエラー情報 <span>›</span></button></section>; }
function Dependencies({ dependencies, query, setQuery }: { dependencies: Dependency[]; query: string; setQuery: (value: string) => void }) { return <section className="full-panel"><SectionTitle title="依存関係" count={`${dependencies.length} 件`} action="依存ツリーを表示" /><div className="toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="パッケージを検索" /><button className="primary-small">＋ 依存を追加</button></div><div className="dependency-list">{dependencies.map((item) => <div className="dependency-detail" key={item.name}><div><strong>{item.name}</strong><small>{item.group === 'dev' ? '開発用依存' : '通常の依存'}</small></div><span>{item.version}</span><button>削除</button></div>)}</div></section>; }
function PythonEnvironment({ project }: { project: ProjectState }) { return <section className="full-panel"><SectionTitle title="Python環境" /><div className="large-environment"><div className="python-symbol large">⌘</div><div><span className="eyebrow">現在の環境</span><h2>Python {project.pythonVersion}</h2><span className="tag">アクティブ</span></div><div className="environment-stat"><span>要件</span><strong>{project.pythonRequirement}</strong></div><div className="environment-stat"><span>仮想環境</span><strong>.venv　✓ 同期済み</strong></div></div></section>; }
function RunCommand({ project }: { project: ProjectState }) { const [command, setCommand] = useState('python -m pytest'); const [result, setResult] = useState(''); const execute = async () => { const response = await window.uvDesktop?.runUv('run', command.split(' '), project.path); setResult(response?.stdout || 'コマンドを実行しました。'); }; return <section className="full-panel"><SectionTitle title="コマンド実行" /><div className="command-form"><label htmlFor="command">uv run で実行するコマンド</label><div className="command-input"><span>uv run</span><input id="command" value={command} onChange={(event) => setCommand(event.target.value)} /><button className="primary-small" onClick={execute}>実行</button></div><small>作業ディレクトリ：{project.path}</small></div><pre className="terminal-output">{result || '$ 実行結果がここに表示されます'}</pre></section>; }
function Logs() { return <section className="full-panel"><SectionTitle title="実行ログ" count="5 件" /><Activity /></section>; }
function Settings({ uv }: { uv: UvInfo }) { return <section className="full-panel"><SectionTitle title="設定" /><div className="settings-form"><label>uv実行ファイルのパス<input value={uv.path ?? 'uv'} readOnly /></label><label>テーマ<select defaultValue="system"><option value="system">OS設定に合わせる</option><option value="light">ライト</option><option value="dark">ダーク</option></select></label><label className="checkbox-label"><input type="checkbox" defaultChecked /> ログを保持する</label><p>アプリはアカウント連携や独自のテレメトリを使用しません。</p></div></section>; }
