---
title: "Databricks Free Edition で dev と prod をどう分けるか"
emoji: "🧱"
type: "tech"
topics: ["databricks", "unitycatalog", "dbt", "dataengineering"]
published: false
---

## この記事の結論

- Free Edition ではワークスペースを1つしか持てないため、**環境の境界は Unity Catalog の catalog に置く**のが現実的です。
- catalog 名は Declarative Automation Bundles（旧 Databricks Asset Bundles）の変数 `${var.catalog}` から配ります。target を選ぶだけで、ジョブ・dbt・ダッシュボードの出力先が**同時に**切り替わります。
- 分けられるのはデータと権限だけで、**計算資源とクォータは dev と prod で共有**になります。ここは割り切りが必要です。

個人で作っている健康データのレイクハウス（Fitbit と気象データを dbt でモデリングするもの）で採った構成を、判断の理由と一緒にまとめます。

:::message

**検証環境（2026年10月時点）**
- Databricks Free Edition（AWS）
- Declarative Automation Bundles（Databricks CLI）
- dbt-databricks 1.12

:::

## 前提：Free Edition の制約

環境の分け方に効いてくる制約は次の4つです（[公式ドキュメント](https://docs.databricks.com/aws/en/getting-started/free-edition-limitations)より）。

| 項目 | 制限 |
|---|---|
| ワークスペース / メタストア | アカウントごとに**1つずつ** |
| SQL Warehouse | **1台、2X-Small のみ** |
| ジョブの同時実行 | アカウント全体でタスク**5つ**まで |
| クォータ超過時 | 計算資源が**その日（場合によっては月末まで）停止**する。データと設定は残る |

BigQuery のように「環境ごとにプロジェクトを分ける」感覚でいると、まずワークスペースを分けたくなります。しかし Free Edition ではそれができません。

## 検討した3つの案

| 案 | 良い点 | 悪い点 |
|---|---|---|
| A. ワークスペースを分ける | 分離が最も強い。権限も課金も別になる | **Free Edition では不可能**。有料でも個人には過剰 |
| B. **catalog を分ける** | Unity Catalog の最上位の境界。GRANT も catalog 単位で分けられる | 計算資源は共有になる |
| C. スキーマ名に接頭辞を付ける（`dev_raw` / `prod_raw`） | 追加の器が要らない | 環境の境界が命名規則だけになる。権限もスキーマごとに個別に付ける必要がある |

B を採りました。C は手軽ですが、環境の違いがスキーマ名の接頭辞にしか現れないため、コードの中で `dev_` と `prod_` を書き分けることになります。B なら環境名はコードに出てこず、catalog 名を外から渡すだけで済みます（次の節で説明します）。

## 構成：データは catalog で分け、計算は共有する

![1つのワークスペースの中に health_dev と health_prod の2つの catalog があり、その下で SQL Warehouse とサーバーレスの計算資源を共有している構成図](/images/databricks-free-dev-prod/dev-prod-catalog-layout.png)

- `health_dev` と `health_prod` の2つの catalog を作り、中のスキーマ構成（`raw` / `staging` / `warehouse` / `marts`）は同じにします。
- テーブルの参照は常に `catalog.schema.table` の3階層になるので、**どちらの環境を見ているかがクエリから読み取れます**。
- SQL Warehouse とサーバーレスの計算資源は、両方の環境から同じものを使います。

## 切り替えは target の1箇所に集める

catalog を分けただけでは、ジョブや dbt やダッシュボードの設定に catalog 名を書くたびに、「片方だけ本番を向いている」という事故の余地が残ります。そこで、catalog 名は bundle の変数1つから配るようにしました。

![bundle deploy の -t で選んだ target が var.catalog を決め、Lakeflow Jobs・dbt・AI/BI ダッシュボードの catalog 指定に伝わる流れ図](/images/databricks-free-dev-prod/bundle-target-catalog-flow.png)

### databricks.yml

```yaml:databricks.yml
variables:
  catalog:
    description: 出力先カタログ
    default: health_dev

targets:
  dev:
    mode: development
    default: true
    workspace:
      host: https://<your-workspace>.cloud.databricks.com
    variables:
      catalog: health_dev

  prod:
    mode: production
    workspace:
      host: https://<your-workspace>.cloud.databricks.com
      root_path: /Workspace/Shared/.bundle/${bundle.name}/${bundle.target}
    variables:
      catalog: health_prod
```

`host` は dev と prod で同じです。ワークスペースが1つなので、target の違いは**変数の値と mode だけ**になります。

### 変数を使う側

ジョブのノートブック、dbt、ダッシュボードのすべてが `${var.catalog}` を参照します。

```yaml:resources/jobs.yml（抜粋）
tasks:
  - task_key: setup_catalog
    notebook_task:
      notebook_path: ../src/setup/00_setup_catalog.py
      base_parameters:
        catalog: ${var.catalog}

  - task_key: dbt_build
    dbt_task:
      project_directory: ../dbt
      catalog: ${var.catalog}
      schema: marts
      warehouse_id: ${var.warehouse_id}
      commands:
        - "dbt build --select tag:health"
```

```yaml:resources/dashboards.yml（抜粋）
dashboards:
  health_overview:
    display_name: "健康レイクハウス概要 (${bundle.target})"
    dataset_catalog: ${var.catalog}
    dataset_schema: marts
```

ダッシュボードの SQL にはテーブル名だけを書き、catalog とスキーマは `dataset_catalog` / `dataset_schema` で解決させます。こうしておくと、同じ定義のまま dev 用と prod 用のダッシュボードができます。

:::message

**dbt のスキーマ名に注意**

dbt のデフォルトでは、スキーマ名が `<profile の schema>_<モデルのスキーマ>` の形に連結されます（例: `marts_staging`）。`generate_schema_name` マクロを上書きして、モデルに指定したスキーマ名がそのまま使われるようにしています。

:::

### mode で dev と prod の振る舞いも変わる

target の `mode` を変えると、名前やスケジュールの扱いも変わります（[deployment modes](https://docs.databricks.com/aws/en/dev-tools/bundles/deployment-modes)）。

| | `mode: development`（dev） | `mode: production`（prod） |
|---|---|---|
| ジョブ名 | `[dev <ユーザー名>]` の接頭辞が付く | そのまま |
| スケジュール | **デフォルトで一時停止** | 設定どおり動く |

dev にデプロイしても日次ジョブが勝手に動き出さないので、共有している計算資源を dev が消費しすぎる心配が減ります。

## 引き受けたトレードオフ：計算資源は分けられない

この構成で分離できるのは**データと権限**だけです。**計算資源とクォータは dev と prod で共有**しています。

- dev で重いクエリを流すと、同じ時間帯に動く prod の日次ジョブも遅れます。
- クォータを超えると、**dev が原因でも prod を含むワークスペース全体の計算資源が止まります**。

そのため、計算資源の使い方のほうで次の対策をしています。

| 対策 | 内容 |
|---|---|
| ジョブの実行時刻をずらす | 日次ジョブ同士の cron が重ならないようにする |
| 全タスクに `timeout_seconds` | 暴走したタスクがクォータを食い潰さないようにする |
| dbt をタグで分割 | 1つの dbt プロジェクトを複数のジョブが叩く構成なので、`--select tag:...` で自分の担当範囲だけを再構築させる |
| CI は文書の変更では走らせない | PR では `health_dev` に対して `dbt build` を流すため、`paths-ignore` で `**.md` などを除外する |

## 運用の流れ

GitHub Actions では次のように使い分けています。

| タイミング | 実行すること |
|---|---|
| PR | `bundle validate -t dev` / `-t prod`、`health_dev` に対する `dbt build`、`bundle plan -t prod` の結果を PR にコメント |
| main へのマージ | `bundle deploy -t prod` |

prod への変更は、必ず PR で差分（plan）を確認してから入る形にしています。

## まとめ

- Free Edition で dev / prod を分けるなら、**境界は catalog** に置く。
- catalog 名は bundle の `${var.catalog}` から配り、**切り替えの起点を target の1箇所に集める**。
- 計算資源とクォータは共有になるので、**「データは分けるが、計算は分けない」と割り切り**、スケジュールとタイムアウトで守る。

有料プランに移ってワークスペースを分けられるようになっても、catalog を環境ごとに分ける構成はそのまま活かせます。そのときは、catalog を特定のワークスペースだけに紐付ける設定（workspace binding）を足すと、分離をさらに強められます。

## 参考

- [Databricks Free Edition limitations](https://docs.databricks.com/aws/en/getting-started/free-edition-limitations)
- [Declarative Automation Bundles deployment modes](https://docs.databricks.com/aws/en/dev-tools/bundles/deployment-modes)
- [Unity Catalog best practices](https://docs.databricks.com/aws/en/data-governance/unity-catalog/best-practices)
