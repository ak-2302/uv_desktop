# uv Desktop

uvをGUIから操作するElectronデスクトップアプリです。React、TypeScript、Viteを使い、macOS・Windows・LinuxでのPythonプロジェクト管理を目指します。

## 必要な環境

- Node.js 20以上
- npm
- Electronが動作するmacOS、Windows、またはLinux
- uv（未導入でも画面のモック状態は確認できます）

## 起動

```bash
npm install
npm run dev
```

`npm run dev`でViteのRendererとElectron Main Processを同時に起動します。

## 検証

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run build`はRenderer、Main Process、Preloadをビルドし、Electronの開発版アプリを生成します。正式配布向けのコード署名と自動更新はv1の対象外です。

## ドキュメント

- [要件定義書](requirements.md)
