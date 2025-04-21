# wos-tools_issue49

## 概要

本ツールは、WoS（Web of Science）で取得した英文論文情報を基に、病院別に整理された問い合わせシート（Googleスプレッドシート）を自動生成するGoogle Apps Script（GAS）プロジェクトです。

## 主な処理概要

1. JSON形式の論文情報を加工し、中間JSONファイルを生成
2. 中間JSONファイルからGoogleスプレッドシートを出力（施設別に整理）
3. 各種チェック関数により整合性検証（JSON⇔スプレッドシート）

## 使用手順

### 1. 入力準備

- 病院施設情報のスプレッドシートのIDをスクリプトプロパティ`hospInfoFileId`に設定します。スプレッドシートの病院情報が格納されているシートの名称が`Base`ではない場合、また、前年からレイアウトが変更になっている場合等はプログラムの修正が必要です。
- 入力用JSONファイルをGoogleDriveの任意のフォルダに格納します。
- 上記フォルダのIDを、スクリプトプロパティ`inputFolder`に設定します。
- 中間ファイルを格納するためのフォルダを作成し、そのIDをスクリプトプロパティ`intermediateFolder`に設定します。
- 出力スプレッドシートを格納するためのフォルダを作成し、そのIDをスクリプトプロパティ`outputFolderId`に設定します。

### 2. 中間JSONファイルの生成

- `issue49.js`の`outputJson()`を実行します。
  - 中間JSONファイルが`intermediateFolder`フォルダに生成されます。
  - 同時に、元のファイルはバックアップとしてサブフォルダに退避されます。

### 3. スプレッドシート出力

- `issue49.js`の`outputSs()`を実行します。
  - `outputFolderId`で指定されたフォルダに、`yyyymmdd_HHmm_施設別英文論文リスト`というサブフォルダが生成され、施設単位でスプレッドシートが出力されます。
  - 処理中にエラーが発生した場合、コンソールに処理できなかったファイルのリストが出力されます。`issue49.js`の`outputSsByFileName()`の`const targetFileList = `にそのリストを設定して`outputSsByFileName()`を実行してください。直近の`yyyymmdd_HHmm_施設別英文論文リスト`に対象のスプレッドシートが出力されます。

### 4. 不整合チェック

#### 4-1. JSON→スプレッドシート整合性

- `forCheck.js`の`execCheck()`を実行します。
  - → 全体チェック：中間JSON→スプレッドシートの整合性検証（ファイル数・WoS ID・値一致など）

## 🔧 テスト関数の詳細（`test.js`）

開発・デバッグ用途で活用する補助関数です。通常のフローを個別に検証・確認する目的で利用します。

### `testOutputJson()`

- **用途**：

  - `inputFolder` に格納された入力用 JSON ファイル（例: `408.json`）を中間JSON形式に変換し、
  - `intermediateFolder` に保存します。
  - 本番処理 `outputJson()` の簡易版で、`common.js`の`testTargetJsonFileName` に一致する単一ファイルのみを対象とします。

- **主な処理内容**：

  1. `common.js`の`testTargetJsonFileName` で指定されたファイルを取得
  2. `getJson_()` を用いて中間JSON形式に変換
  3. 変換後JSONを `intermediateFolder` に保存

- **利用場面**：
  - 特定の施設（1ファイル）の変換ロジックを検証したいとき
  - 中間JSONの出力形式の妥当性確認

---

### `testOutputSs()`

- **用途**：

  - 上記で生成された中間JSONを用いて、
  - 単一施設（`common.js`の`testTargetJsonFileName` に指定）に対応するスプレッドシートを出力します。
  - 本番処理 `outputSs()` の限定的なテスト版です。

- **主な処理内容**：

  1. `common.js`の`testTargetJsonFileName` に対応する中間JSONを取得
  2. `outputSs()` 関数を利用してスプレッドシートを生成
  3. 出力先は `testFolderId` で指定されたフォルダ

- **利用場面**：
  - 1施設のみスプレッドシート出力テストを行いたいとき
  - 書式・列順・ソートなどのレイアウト確認時

---

### `testGetQueryString()`

- **用途**：

  - JSONファイル（`testTargetJsonFileName`）内に記載されたWoS ID（UID）を抽出し、
  - 検索用のクエリ文字列（`UT=xxx OR UT=yyy OR ...`）をコンソールに出力します。
  - さらに、GUIから取得したExcelファイル（`savedrecs.xls`）を置くためのフォルダを自動生成します。

- **主な処理内容**：

  1. `inputFolder` から `common.js`の`testTargetJsonFileName` に該当するJSONファイルを取得
  2. 各レコードのUID（WoS ID）を抽出して `"UT=..."` 形式に変換
  3. 検索用のクエリ文字列をコンソール出力
  4. 実行日時を名前とするサブフォルダを `testFolderId` の下に作成し、スクリプトプロパティ `testTargetFolderId` に保存

- **利用場面**：
  - Web of Science で検索を行うためのクエリを自動生成したいとき
  - `savedrecs.xls` を配置する一時フォルダを用意したいとき

---

### `convertWosGui()`

- **用途**：

  - Web of Science GUIからダウンロードした `savedrecs.xls`（XLS形式）ファイルを、
  - Googleスプレッドシート形式に変換します。

- **主な処理内容**：

  1. `testTargetFolderId` に指定されたフォルダ内の `savedrecs.xls` を取得
  2. `convertXlsToSheet_()` を使ってスプレッドシートに変換（Drive API経由）
  3. Googleドライブのルートフォルダにスプレッドシートとして保存

- **利用場面**：
  - WoS GUI から取得したExcelファイルをスクリプトで扱える形式（スプレッドシート）に変換したいとき
  - データ比較や後続のチェック処理に備えた前処理として

---

## `testCompareWosGui()`

- **用途**：
  - WoS GUIからダウンロードしたExcelファイル（`savedrecs.xls`）と、
    スクリプトが出力したスプレッドシートとの内容を比較し、
    両者のデータに差異がないかを検証します。

## スクリプトプロパティ（必須）

| プロパティ名         | 用途                                     |
| -------------------- | ---------------------------------------- |
| `hospInfoFileId`     | 病院情報定義ファイルのスプレッドシートID |
| `inputFolder`        | 入力ファイル格納先フォルダID             |
| `intermediateFolder` | 中間ファイル格納先フォルダID             |
| `outputFolderId`     | スプレッドシート出力フォルダID           |

## スクリプトプロパティ（任意）

| プロパティ名             | 用途                                               |
| ------------------------ | -------------------------------------------------- |
| `testTargetJsonFileName` | テスト対象のJSONファイル名（例: `"408.json"`）     |
| `testFolderId`           | テスト出力ファイルを格納するフォルダのID（出力先） |

## 施設定義の追加方法

`getHospOoAd_()`（`getHospOoAd.js`）に以下の形式で施設定義を追加してください：  
サンプル`/Box/Datacenter/Users/ohtsuka/2025/20250415/getHospOoAd.js`

```js
{
  OO: ["施設名（英略表記）", ...], // Organization（略称含む）
  AD: ["住所中キーワード", ...], // Address
  facilityNumber: 000           // 施設コード（3桁）
}
```

## 依存ライブラリ・サービス

- spreadSheetBatchUpdate.gs（カスタムライブラリ）  
  https://github.com/nnh/spreadSheetBatchUpdate
- Google Apps Script Advanced Services:（基本最新版でOK）
  - Sheets API v4
  - Drive API v3
