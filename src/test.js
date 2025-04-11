const testTargetJsonFileName = '311.json';
// 3.出力したスプレッドシートとWoS GUIで取得したエクセルファイルの内容を比較する処理
function testCompareWosGui() {
  const testFolder = getTestFolder_();
  const guiValues = getGuiFileValueForTest_(testFolder);
  const targetSpreadsheetFolderId = getCheckTargetFolderId_();
  const spreadsheetFileNameHead = testTargetJsonFileName.split('.')[0];
  const spreadsheetList = DriveApp.getFolderById(
    targetSpreadsheetFolderId
  ).getFiles();
  let spreadsheetId;
  while (spreadsheetList.hasNext()) {
    const file = spreadsheetList.next();
    if (file.getName().includes(spreadsheetFileNameHead)) {
      spreadsheetId = file.getId();
      break;
    }
  }
  if (!spreadsheetId) {
    throw new Error(
      `${testTargetJsonFileName}に対応するスプレッドシートが存在しません。`
    );
  }
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const targetSpreadSheetValue = spreadsheet
    .getSheets()[0]
    .getDataRange()
    .getValues();
  testCompareValues_(guiValues, targetSpreadSheetValue);
  console.log('比較完了');
}
// 2.WoS GUIで取得したエクセルファイルをGoogleスプレッドシートに変換する処理
function convertWosGui() {
  const testFolder = getTestFolder_();
  const files = testFolder.getFilesByName('savedrecs.xls');
  if (!files.hasNext()) {
    throw new Error('savedrecs.xlsが見つかりません');
  }
  const file = files.next();
  convertXlsToSheet_(file);
}

// 1. 指定したJSONファイルからWoSIDを取得し、検索用クエリ文字列をコンソールに出力する処理
function testGetQueryString() {
  const targetFileName = testTargetJsonFileName;
  const inputFolderId =
    PropertiesService.getScriptProperties().getProperty('intermediateFolder');
  const inputFolder = DriveApp.getFolderById(inputFolderId);
  const inputFile = inputFolder.getFilesByName(targetFileName);
  const inputJson = JSON.parse(inputFile.next().getBlob().getDataAsString());
  const wosIds = inputJson.map(x => `UT=${x[3][1]}`).join(' OR ');
  console.log(wosIds);
  // テスト用フォルダの作成
  const testParentFolderId =
    PropertiesService.getScriptProperties().getProperty('testFolderId');
  const testParentFolder = DriveApp.getFolderById(testParentFolderId);

  // 現在の日付と時間を取得してフォルダ名を作成
  const now = new Date();
  const folderName = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd_HH-mm-ss'
  );
  const newFolder = testParentFolder.createFolder(folderName);
  const testTargetFolderId = newFolder.getId();
  PropertiesService.getScriptProperties().setProperty(
    'testTargetFolderId',
    testTargetFolderId
  );
  console.log(
    '作成されたフォルダにsavedrecs.xlsを格納してからconvertWosGui()を実行してください'
  );
}

// テスト用関数、outputFolderに指定したフォルダにスプレッドシートを出力する処理
function testOutputSs() {
  const outputFolder = getTestFolder_();
  const targetFileList = ['412.json'];
  outputSs(targetFileList, outputFolder);
}

function testOutputJson() {
  const outputJsonFolder = getTestFolder_();
  const inputFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('inputFolder')
  );
  const inputFiles = inputFolder.getFiles();
  const files = [];
  while (inputFiles.hasNext()) {
    const file = inputFiles.next();
    files.push(file);
    break;
  }
  files.forEach(x => {
    const json = getJson_(x);
    const blob = Utilities.newBlob(
      '',
      'text/plain',
      x.getName()
    ).setDataFromString(json, 'UTF-8');
    outputJsonFolder.createFile(blob);
  });
  return;
}
