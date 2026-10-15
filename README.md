# blog_zenn

* [📘 How to use](https://zenn.dev/zenn/articles/zenn-cli-guide)

## セットアップ

```bash
npm install
```

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run new:article` | 記事を新規作成 |
| `npm run preview` | ローカルでプレビュー（http://localhost:8000） |
| `npm run lint` | 全記事を textlint で検査 |
| `npm run lint:fix` | 自動修正できる指摘（表記ゆれなど）を直す |
| `npx textlint articles/<slug>.md` | 1記事だけ検査 |

## 文章チェックの仕組み

| 層 | 何を見るか | 場所 |
|---|---|---|
| textlint | 文の長さ、ら抜き、文体の混在、AI っぽい文章、不適切語、表記ゆれ | `.textlintrc.json` |
| 表記ゆれ辞書 | Databricks 製品名（`prh/databricks.yml`）、WEB+DB PRESS 用語（`prh/web+db.yml`） | `prh/` |
| Claude Code スキル | 自然な日本語・エンジニアらしい言い回し、炎上リスク、機密情報の露出、Databricks の改称・鮮度 | `.claude/skills/zenn-review/` |
| GitHub Actions | push / PR 時に、変更された記事だけ textlint を実行 | `.github/workflows/textlint.yml` |

- Claude Code で「この記事を添削して」と頼むと `zenn-review` スキルが動きます（`/zenn-review` で明示的に呼ぶこともできます）。
- `.mcp.json` で textlint を MCP サーバーとして登録しているので、Claude Code から直接 textlint を呼べます。
- VS Code では推奨拡張機能（textlint）を入れると、書いている最中に指摘が出ます。

### 指摘を一時的に無視する

```markdown
<!-- textlint-disable -->
ここはチェックしない
<!-- textlint-enable -->
```

### 表記ルール
- 長音は Microsoft スタイル: -er/-or/-ar は「ー」あり（サーバー、ユーザー）、-ry/-ty/-gy は「ー」なし（ライブラリ、クエリ、メモリ）。
- Databricks の製品名を追加・修正したいときは `prh/databricks.yml` に追記する（`specs` に例を書くとテストになります）。
