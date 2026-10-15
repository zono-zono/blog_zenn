# blog_zenn

データエンジニアリングの知見や試行錯誤を書いている [Zenn](https://zenn.dev/) の記事管理リポジトリです。

## 扱っているテーマ

| テーマ | 内容 | 記事 |
|---|---|---|
| ✅ データ品質 | Great Expectations（GX Core / GX Cloud）の導入・比較、データプロファイリング | 3 本 |
| 🧱 Databricks | データ分析基盤の開発で得た知見、ハマりどころと解決策 | これから |

## 記事一覧

`npm run readme` で `articles/` の frontmatter から自動生成しています（手で編集しないでください）。

<!-- ARTICLES:START -->
公開 3 本、下書き 0 本です。

| 追加日 | タイトル | 種類 | トピック | 状態 |
|---|---|---|---|---|
| 2025-06-26 | 🔰 [Great Expectations（GX Core）始め方と注意ポイント](articles/21e5d310844f4e.md) | 🛠 技術 | `greatexpectations` `python` `dataquality` | 公開 |
| 2025-06-26 | ☁️ [GX Core vs GX Cloud 機能比較](articles/70ee6940d25798.md) | 🛠 技術 | `greatexpectations` `dataquality` `dataplatform` | 公開 |
| 2025-05-05 | 🐍 [Pythonによるデータプロファイリング](articles/fd733ea6325911.md) | 🛠 技術 | `python` `data-engineering` `data-quality` | 公開 |
<!-- ARTICLES:END -->

---

## 執筆環境

* [📘 Zenn CLI の使い方](https://zenn.dev/zenn/articles/zenn-cli-guide)

### セットアップ

```bash
npm install
```

### よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run new:article` | 記事を新規作成 |
| `npm run preview` | ローカルでプレビュー（http://localhost:8000） |
| `npm run lint` | 全記事を textlint で検査 |
| `npm run lint:fix` | 自動修正できる指摘（表記ゆれなど）を直す |
| `npm run readme` | README の記事一覧を更新 |
| `npx textlint articles/<slug>.md` | 1記事だけ検査 |

### 文章チェックの仕組み

| 層 | 何を見るか | 場所 |
|---|---|---|
| textlint | 文の長さ、ら抜き、文体の混在、AI っぽい文章、不適切語、表記ゆれ | `.textlintrc.json` |
| 表記ゆれ辞書 | Databricks 製品名（`prh/databricks.yml`）、WEB+DB PRESS 用語（`prh/web+db.yml`） | `prh/` |
| Claude Code スキル | 自然な日本語・エンジニアらしい言い回し、炎上リスク、機密情報の露出、Databricks の改称・鮮度 | `.claude/skills/zenn-review/` |
| GitHub Actions | push / PR 時に、変更された記事だけ textlint を実行 | `.github/workflows/textlint.yml` |

- Claude Code で「この記事を添削して」と頼むと `zenn-review` スキルが動きます（`/zenn-review` で明示的に呼ぶこともできます）。
- `.mcp.json` で textlint を MCP サーバーとして登録しているので、Claude Code から直接 textlint を呼べます。
- VS Code に推奨拡張機能（textlint）を入れると、書いている最中に指摘が出ます。

#### 指摘を一時的に無視する

```markdown
<!-- textlint-disable -->
ここはチェックしない
<!-- textlint-enable -->
```

#### 表記ルール
- 長音は Microsoft スタイルに合わせる。-er/-or/-ar で終わる語には「ー」を付け（サーバー、ユーザー）、-ry/-ty/-gy で終わる語には付けない（ライブラリ、クエリ、メモリ）。
- Databricks の製品名を追加・修正したいときは `prh/databricks.yml` に追記する（`specs` に例を書くとテストになります）。
