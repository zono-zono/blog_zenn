## データ品質の概念
実装に入る前にデータ品質の概念から整理していきたいと思います。
参考にしたのは以下の記事です。

https://note.com/zono_data/n/n620b48d2b49f

### 10ステッププロセス
データ品質の改善は、一度行えば終わりというものではなく、継続的に取り組むべき活動です。
データ品質実践ガイドには、以下の10のステップに分解して説明されています。
![](https://storage.googleapis.com/zenn-user-upload/08b3ec26b611-20250504.png)

### データ品質評価の14タスク
10ステッププロセスのStep3「データ品質の評価」では、データの品質を一面的な見方ではなく、多角的に捉えることが重要です。ガイドブックでは、そのための評価軸として以下の14のタスクを提示されています。

![](https://storage.googleapis.com/zenn-user-upload/32e8235029b9-20250504.png)

## データプロファイリングの実装
それでは、各タスクの具体的な実装例を見ていきましょう。以下のコードは、pandas、numpy、matplotlib、seabornを使用しています。

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import re
```

#### 1. レコード数
```python
def check_record_count(df, expected_count=None):
    actual_count = len(df)
    diff_rate = None
    if expected_count is not None:
        diff_rate = abs(actual_count - expected_count) / expected_count
    return actual_count, diff_rate

record_count, diff_rate = check_record_count(df, expected_count=10000)
print("Record count:", record_count, "Difference rate:", diff_rate)

# レコード数の分布を可視化
plt.figure(figsize=(10, 5))
plt.bar(['Actual', 'Expected'], [record_count, 10000])
plt.title('Record Count Comparison')
plt.ylabel('Number of Records')
plt.show()
```

![](https://storage.googleapis.com/zenn-user-upload/d84e55767e73-20250505.png)

#### 2. 完全性／充足率TODO
```python
def check_completeness(df):
    return df.notnull().sum() / len(df)

completeness = check_completeness(df)
print("Completeness per column:\n", completeness)

# 完全性の可視化
plt.figure(figsize=(12, 6))
sns.heatmap(df.isnull(), yticklabels=False, cbar=True, cmap='viridis')
plt.title('NULL Values Distribution')
plt.show()

# 各カラムのNULL値の割合を棒グラフで表示
null_ratios = df.isnull().mean().sort_values(ascending=False)
plt.figure(figsize=(10, 5))
sns.barplot(x=null_ratios.values, y=null_ratios.index)
plt.title("NULL Ratio per Column")
plt.xlabel("Ratio")
plt.ylabel("Column")
plt.show()
```

#### 3. NULL
```python
def check_null_values(df):
    null_counts = df.isnull().sum()
    null_ratios = df.isnull().mean()
    
    null_stats = pd.DataFrame({
        'null_count': null_counts,
        'null_ratio': null_ratios
    })
    
    return null_stats

null_stats = check_null_values(df)
print("NULL Statistics:\n", null_stats)

# NULL値の分布を可視化
plt.figure(figsize=(12, 6))
sns.heatmap(df.isnull(), yticklabels=False, cbar=True, cmap='viridis')
plt.title('NULL Values Distribution')
plt.show()

# 各カラムのNULL値の割合を棒グラフで表示
plt.figure(figsize=(10, 5))
sns.barplot(x=null_stats['null_ratio'], y=null_stats.index)
plt.title("NULL Ratio per Column")
plt.xlabel("Ratio")
plt.ylabel("Column")
plt.show()
```
![](https://storage.googleapis.com/zenn-user-upload/34a7cd4e0ca1-20250505.png)

#### 4. 内容適合性
```python
def check_content_suitability(df, rules_dict):
    results = {}
    for column, rule in rules_dict.items():
        if column in df.columns:
            results[column] = df[column].apply(rule).mean()
    return results

rules = {
    'passenger_count': lambda x: 0 < x,
    'trip_distance': lambda x: x > 0,
    'fare_amount': lambda x: x > 0
}
suitability_results = check_content_suitability(df, rules)
print("Content Suitability Results:", suitability_results)

# 内容適合性の結果を可視化
unsuitable_ratios = {col: 1 - ratio for col, ratio in suitability_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(unsuitable_ratios.keys(), unsuitable_ratios.values())
plt.title('Ratio of Records Not Meeting Content Rules')
plt.xlabel('Column')
plt.ylabel('Unsuitable Ratio')
plt.xticks(rotation=45)
plt.show()
```
![](https://storage.googleapis.com/zenn-user-upload/de64cba6d840-20250505.png)

#### 5. 有効性
```python
def check_validity(df, validation_rules):
    validity_results = {}
    for column, rules in validation_rules.items():
        if column in df.columns:
            valid_count = sum(1 for x in df[column] if all(rule(x) for rule in rules))
            validity_results[column] = valid_count / len(df)
    return validity_results

validation_rules = {
    'passenger_count': [lambda x: isinstance(x, (int, float)), lambda x: x >= 0],
    'trip_distance': [lambda x: isinstance(x, (int, float)), lambda x: x >= 0],
    'fare_amount': [lambda x: isinstance(x, (int, float)), lambda x: x >= 0]
}
validity_results = check_validity(df, validation_rules)
print("Validity Results:", validity_results)

# 有効性の結果を可視化
invalid_ratios = {col: 1 - ratio for col, ratio in validity_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(invalid_ratios.keys(), invalid_ratios.values())
plt.title('Ratio of Invalid Records')
plt.xlabel('Column')
plt.ylabel('Invalid Ratio')
plt.xticks(rotation=45)
plt.show()
```
![](https://storage.googleapis.com/zenn-user-upload/8e413f933615-20250505.png)

#### 6. 一意な値
```python
def analyze_unique_values(df):
    unique_stats = pd.DataFrame({
        'unique_count': df.nunique(),
        'unique_ratio': df.nunique() / len(df)
    })
    return unique_stats

unique_stats = analyze_unique_values(df)
print("Unique Values Analysis:\n", unique_stats)

# 一意な値の割合を可視化
plt.figure(figsize=(10, 5))
plt.bar(unique_stats.index, 1 - unique_stats['unique_ratio'])
plt.title('Ratio of Duplicate Values')
plt.xlabel('Column')
plt.ylabel('Duplicate Ratio')
plt.xticks(rotation=45)
plt.show()
```

![](https://storage.googleapis.com/zenn-user-upload/7286a057eb0c-20250505.png)

#### 7. 度数分布
```python
def analyze_value_distribution(df):
    for column in df.columns:
        plt.figure(figsize=(10, 5))
        if df[column].dtype in ['int64', 'float64']:
            sns.histplot(data=df, x=column)
        else:
            value_counts = df[column].value_counts().head(10)
            sns.barplot(x=value_counts.values, y=value_counts.index)
        plt.title(f"Distribution of {column}")
        plt.show()

# 数値カラムの分布を箱ひげ図で表示
numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
plt.figure(figsize=(12, 6))
df[numeric_cols].boxplot()
plt.title('Value Distribution of Numeric Columns')
plt.xticks(rotation=45)
plt.show()

analyze_value_distribution(df)
```
![](https://storage.googleapis.com/zenn-user-upload/bb5355111a0e-20250505.png)

![](https://storage.googleapis.com/zenn-user-upload/b29efef4bd27-20250505.png)

![](https://storage.googleapis.com/zenn-user-upload/741c8204d8ed-20250505.png)

#### 8. データ鮮度
```python
def check_data_freshness(df, date_column):
    current_date = datetime.now()
    df[date_column] = pd.to_datetime(df[date_column])
    df['days_since_update'] = (current_date - df[date_column]).dt.days
    
    bins = [0, 365, 730, float('inf')]
    labels = ['Within 12 months', '13-24 months', 'Over 24 months']
    
    frequency_distribution = pd.cut(df['days_since_update'], bins=bins, labels=labels).value_counts(normalize=True)
    
    plt.figure(figsize=(8, 6))
    sns.barplot(x=frequency_distribution.index, y=frequency_distribution.values)
    plt.title(f"Data Freshness Distribution ({date_column})")
    plt.xlabel("Date Range")
    plt.ylabel("Percentage of Records")
    plt.show()
    
    return {
        'frequency_distribution': frequency_distribution.to_dict()
    }

freshness_results = check_data_freshness(df, 'pickup_datetime')
print("Data Freshness:", freshness_results)
```

![](https://storage.googleapis.com/zenn-user-upload/c55ce73b1a18-20250505.png)

#### 9. パターン/フォーマット
```python
def check_patterns(df, pattern_rules):
    results = {}
    for column, pattern in pattern_rules.items():
        if column in df.columns:
            matches = df[column].astype(str).str.match(pattern)
            results[column] = matches.mean()
    return results

pattern_rules = {
    'store_and_fwd_flag': r'^[YN]$',
    'payment_type': r'^[1-4]$'
}
pattern_results = check_patterns(df, pattern_rules)
print("Pattern Validation Results:", pattern_results)

# パターンマッチの結果を可視化
mismatch_ratios = {col: 1 - ratio for col, ratio in pattern_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(mismatch_ratios.keys(), mismatch_ratios.values())
plt.title('Ratio of Records Not Matching Pattern')
plt.xlabel('Column')
plt.ylabel('Mismatch Ratio')
plt.xticks(rotation=45)
plt.show()
```

![](https://storage.googleapis.com/zenn-user-upload/181967c825e3-20250505.png)

#### 10. 値の範囲
```python
def check_value_ranges(df, range_rules):
    results = {}
    for column, (min_val, max_val) in range_rules.items():
        if column in df.columns:
            in_range = (df[column] >= min_val) & (df[column] <= max_val)
            results[column] = in_range.mean()
    return results

range_rules = {
    'passenger_count': (1, 6),
    'trip_distance': (0, 100),
    'fare_amount': (0, 1000)
}
range_results = check_value_ranges(df, range_rules)
print("Value Range Results:", range_results)

# 範囲外の値の割合を可視化
out_of_range_ratios = {col: 1 - ratio for col, ratio in range_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(out_of_range_ratios.keys(), out_of_range_ratios.values())
plt.title('Ratio of Values Outside Valid Range')
plt.xlabel('Column')
plt.ylabel('Out of Range Ratio')
plt.xticks(rotation=45)
plt.show()
```
![](https://storage.googleapis.com/zenn-user-upload/4ad697c30627-20250505.png)

#### 11. 精度・粒度TODO
```python
def check_precision(df, precision_rules):
    results = {}
    for column, rule in precision_rules.items():
        if column in df.columns:
            results[column] = df[column].apply(rule).mean()
    return results

precision_rules = {
    'pickup_latitude': lambda x: len(str(x).split('.')[-1]) >= 6,
    'pickup_longitude': lambda x: len(str(x).split('.')[-1]) >= 6
}
precision_results = check_precision(df, precision_rules)
print("Precision Results:", precision_results)

# 精度不足の割合を可視化
insufficient_precision_ratios = {col: 1 - ratio for col, ratio in precision_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(insufficient_precision_ratios.keys(), insufficient_precision_ratios.values())
plt.title('Ratio of Records with Insufficient Precision')
plt.xlabel('Column')
plt.ylabel('Insufficient Precision Ratio')
plt.xticks(rotation=45)
plt.show()
```

#### 12. データ型
```python
def check_data_types(df):
    type_info = {}
    for column in df.columns:
        type_info[column] = {
            'dtype': df[column].dtype,
            'unique_types': df[column].apply(type).unique()
        }
    return type_info

type_results = check_data_types(df)
print("Data Type Analysis:", type_results)

# データ型の不一致を可視化
type_mismatch_ratios = {}
for col in df.columns:
    if df[col].dtype in ['int64', 'float64']:
        non_numeric = pd.to_numeric(df[col], errors='coerce').isna().mean()
        type_mismatch_ratios[col] = non_numeric

plt.figure(figsize=(10, 5))
plt.bar(type_mismatch_ratios.keys(), type_mismatch_ratios.values())
plt.title('Ratio of Records with Unexpected Data Types')
plt.xlabel('Column')
plt.ylabel('Type Mismatch Ratio')
plt.xticks(rotation=45)
plt.show()
```
![](https://storage.googleapis.com/zenn-user-upload/3ae02b374bbc-20250505.png)

#### 13. サイズ／長さ
```python
def check_size_length(df, length_rules):
    results = {}
    for column, (min_len, max_len) in length_rules.items():
        if column in df.columns:
            lengths = df[column].astype(str).str.len()
            in_range = (lengths >= min_len) & (lengths <= max_len)
            results[column] = in_range.mean()
    return results

length_rules = {
    'store_and_fwd_flag': (1, 1),
    'payment_type': (1, 1)
}
length_results = check_size_length(df, length_rules)
print("Size/Length Results:", length_results)

# 不正な長さの割合を可視化
invalid_length_ratios = {col: 1 - ratio for col, ratio in length_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(invalid_length_ratios.keys(), invalid_length_ratios.values())
plt.title('Ratio of Records with Invalid Length')
plt.xlabel('Column')
plt.ylabel('Invalid Length Ratio')
plt.xticks(rotation=45)
plt.show()
```

![](https://storage.googleapis.com/zenn-user-upload/020935f09b3e-20250505.png)

#### 14. 参照整合性
```python
def check_referential_integrity(df, reference_df, key_columns):
    results = {}
    for key in key_columns:
        if key in df.columns and key in reference_df.columns:
            valid_keys = df[key].isin(reference_df[key])
            results[key] = valid_keys.mean()
    return results

reference_df = df.sample(frac=0.1)
reference_integrity_results = check_referential_integrity(
    df, reference_df, ['vendor_id', 'payment_type']
)
print("Referential Integrity Results:", reference_integrity_results)

# 無効な参照の割合を可視化
invalid_reference_ratios = {col: 1 - ratio for col, ratio in reference_integrity_results.items()}
plt.figure(figsize=(10, 5))
plt.bar(invalid_reference_ratios.keys(), invalid_reference_ratios.values())
plt.title('Ratio of Records with Invalid References')
plt.xlabel('Column')
plt.ylabel('Invalid Reference Ratio')
plt.xticks(rotation=45)
plt.show()
```

![](https://storage.googleapis.com/zenn-user-upload/da1859800fcd-20250505.png)



## まとめ
本記事では、データ品質評価の14のタスクについて、Pythonを使用した具体的な実装例を紹介しました。これらの実装を組み合わせることで、包括的なデータ品質評価が可能になります。

各タスクの実装は、以下の点に注意して設計されています：
- 再利用可能な関数として実装
- 詳細なドキュメンテーション
- 可視化による直感的な理解
- エラーハンドリングの考慮

これらの実装を基に、組織のデータ品質要件に合わせてカスタマイズすることで、より効果的なデータ品質管理が可能になります。

