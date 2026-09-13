# 関西林間アプリ (rinkan-app) AIエージェント開発ルール

このプロジェクトで開発を行うAIエージェントは、以下のルールを必ず遵守すること。

## 1. PowerShellの文字化け（Moji-bake）防止ルール
* **Rule:** WindowsのPowerShellでファイルにテキストを書き込む際、`Set-Content` やリダイレクト（`>`）をデフォルトエンコーディングで使用してはならない。
* **Reason:** デフォルトではUTF-16 LEで保存されることがあり、日本語が完全に文字化けしてNext.jsやESLintが起動しなくなる致命的な障害を防ぐため。
* **Action:** ファイルの作成や編集には、必ず提供されている `write_to_file` / `replace_file_content` ツールを使用するか、Node.jsの `fs.writeFileSync(..., 'utf8')` を使ってエンコーディングを明示すること。

## 2. Next.js 15+ ＆ Vercel デプロイ時のESLintルール
* **Rule:** Vercelへのデプロイ時、React Hooksの厳格なエラー（`set-state-in-effect`等）によってビルドが失敗する場合、`next.config.ts` の `ignoreDuringBuilds` は機能しない（無視されるか型エラーになる）ため使用してはならない。
* **Reason:** Next.js 15以上でのVercelビルド失敗を確実に回避するため。
* **Action:** ESLintのルールを一時的に無効化したい場合は、必ず `eslint.config.mjs` を直接編集し、対象のルール（例: `"react-hooks/set-state-in-effect": "off"`, `"react-hooks/exhaustive-deps": "off"`）を明示的にオフにすること。

## 3. ファイル編集時の安全な置換（Regex）ルール
* **Rule:** Node.jsスクリプトなどを用いてソースコードを置換・編集する際、`code.replace(/[\s\S]*?/g)` のような広範囲にマッチしうる貪欲な正規表現を使用してはならない。
* **Reason:** 予期せぬ数百行のコード消去（破壊的変更）を防ぐため。
* **Action:** 既存ファイルの編集には、必ずシステム提供の `replace_file_content` ツール（行番号指定）を使用するか、Node.jsを使う場合は `indexOf` や `substring` を駆使した厳密な文字列操作、またはAST操作を行うこと。
