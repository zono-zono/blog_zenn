# Databricks まわりの用語と正確さのチェック

単純な表記ゆれ（`DataBricks` → `Databricks` など）は textlint の `prh/databricks.yml` が検出する。
ここでは、**辞書では判定できないもの**（改称、時期で変わる情報、意味の取り違え）を扱う。

> この表は 2026-10 時点の情報。Databricks は改称が多いので、迷ったら公式ドキュメント
> （https://docs.databricks.com/ ）とリリースノートを確認し、記事中の名称と照らし合わせる。
> 確認できないときは断定せず、「最新の名称は公式ドキュメントで確認してください」と添える。

## 1. 改称された製品・機能
旧名称を見つけたら、記事の検証時期を確認したうえで指摘する。旧名称で検索する読者も多いので、**「新名称（旧: 旧名称）」の併記**を提案するのがよい。

| 旧名称 | 現在の名称 | 補足 |
|---|---|---|
| Delta Live Tables（DLT） | Lakeflow Spark Declarative Pipelines（SDP） | 2025 年の Data + AI Summit で改称が発表された。Python は `import dlt` → `from pyspark import pipelines as dp`、`@dlt.table` → `@dp.table`、`@view` → `@temporary_view`。旧コードはそのまま動く |
| Databricks Workflows | Lakeflow Jobs | 公式ドキュメントで表記を確認してから指摘する |
| Databricks SQL Endpoint | SQL Warehouse（SQL ウェアハウス） | |
| Hive metastore 前提の説明 | Unity Catalog 前提が既定 | 新規ワークスペースでは Unity Catalog が既定。Hive metastore の手順を書く場合は「レガシー」と明記する |

## 2. 取り違えやすい用語
- **Databricks Runtime（DBR）と Apache Spark のバージョン**: 別物。`DBR 15.4 LTS (Spark 3.5.0)` のように両方書くのが親切。
- **クラスター（All-purpose compute）/ ジョブクラスター / サーバーレス / SQL Warehouse**: 料金と挙動が違う。どれで検証したか明記されているか見る。
- **カタログ / スキーマ / テーブル**: Unity Catalog の三層名前空間（`catalog.schema.table`）。「データベース」と「スキーマ」が混在していたら統一を提案する。
- **マネージドテーブル / 外部テーブル**: 削除時の挙動（データが消えるか）が違うため、誤解を招く書き方は 🔴。
- **Delta Lake / Delta テーブル / Delta Sharing**: Delta Lake はストレージ形式、Delta Sharing は共有プロトコル。
- **Auto Loader / COPY INTO / Lakeflow Connect**: いずれも取り込み手段だが、用途が違う。
- **Photon**: 実行エンジン。「Photon を使えば必ず速くなる」は誤り（UDF 多用時などは効かない）。
- **MLflow**: OSS 版と Databricks のマネージド版で機能差がある。どちらの話か確認する。

## 3. 時期によって変わる情報（鮮度チェック）
次の情報を書くときは、**確認日と出典**があるかを見る。なければ 🟡 で追記を提案する。

- 料金（DBU 単価、サーバーレスの課金体系、無料枠・Free Edition の制限）
- 機能の提供状況（Public Preview / GA / 特定クラウドのみ / 特定リージョンのみ）
- 制限値（ノートブックのサイズ上限、API のレート制限、クォータ）
- UI の画面構成やメニュー名（頻繁に変わる）

## 4. 検証環境の書き方（推奨テンプレート）
記事冒頭に次のようなブロックがなければ、追加を提案する。

```markdown
:::message
**検証環境（2026年10月時点）**
- クラウド: AWS（ap-northeast-1）
- Databricks Runtime: 15.4 LTS（Apache Spark 3.5.0, Scala 2.12）
- コンピュート: サーバーレス
- Unity Catalog: 有効
:::
```
