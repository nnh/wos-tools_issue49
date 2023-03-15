# wos-tools_issue49
## 概要
問い合わせシート作成用スクリプトです。
## 処理手順
- 入力フォルダにJSONファイルを格納してください。
- issue49.gsの関数outputJsonを実行してください。中間ファイル格納フォルダにJSONファイルが出力されます。
- issue49.gsの関数outputSsを実行してください。出力ファイル格納フォルダに「実行日時_施設別英文論文リスト」という名前のフォルダが作成され、その下にスプレッドシートが施設毎に出力されます。
- forCheck.gsの関数forCheck1を実行してください。コンソールに'[]'だけ出力された場合は作業の必要はありません。[001, 002]のように施設コードが出力された場合は[]内をissue49.gsの4行目、targetFileListに貼り付けてからissue49.gsの関数outputSsByFileNameを実行してください。その後再び関数forCheck1を実行してください。
- forCheck.gsの関数forCheck2を実行してください。コンソールにtrueと出力されていれば作業の必要はありません。falseの場合は原因を確認してください。
- forCheck.gsの関数forCheck3を実行してください。コンソールに「対象0件」と出力されていれば作業の必要はありません。それ以外の場合はスクリプトプロパティ'forCheck3SheetId'で定めたスプレッドシートに情報が出力されます。原因を確認してください。
## このリポジトリからCloneした場合の事前処理
下記関数の追加が必要です。OO, ADには該当施設名を判別するための情報、facilityNumberには施設コードを設定してください。   
```
function getHospOoAd_(){
  return [{
    OO: [
      "content",
      "content",
    ],
    AD: ["full address"],
    facilityNumber: 000,
  },
  {
    OO: [
      "content",
      "content",
    ],
    AD: ["full address", "full address"],
    facilityNumber: 000,
  },
  {
    OO: ["content", "content"],
    AD: ["full address"],
    facilityNumber: 000,
  }];
}
```
下記のスクリプトプロパティの設定が必要です。  
- forCheck3SheetId : 関数forCheck3の結果出力を行うスプレッドシートのID
- hospInfoFileId : 病院基本情報のスプレッドシートのID
- inputFolder : 入力JSONファイルを格納しているフォルダのID
- intermediateFolder : 中間ファイル格納フォルダのID
- outputFolderId : 問い合わせシート出力フォルダのID
下記ライブラリに依存します。
https://github.com/nnh/spreadSheetBatchUpdate/blob/master/spreadSheetBatchUpdate.gs  
Google Sheets API, Google Drive APIに依存します。
```
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Sheets",
        "version": "v4",
        "serviceId": "sheets"
      },
      {
        "userSymbol": "Drive",
        "version": "v2",
        "serviceId": "drive"
      }
    ],
    "libraries": [
      {
        "userSymbol": "spreadSheetBatchUpdate",
        "version": "0",
        "libraryId": "xxx",
        "developmentMode": true
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```
