const spreadSheetColumnIndexMap = new Map([
  ['facilityNumber', 0],
  ['facilityName', 1],
  ['wosId', 3],
  ['author', 4],
  ['title', 5],
  ['publicationName', 6],
  ['vol', 7],
  ['issue', 8],
  ['page', 9],
  ['publicationYear', 10],
  ['publicationMonth', 11],
  ['addresses', 12],
  ['earlyAccessDate', 13],
  ['docType', 14],
  ['pubmedId', 21],
  ['targetDate', 16],
]);
const compareTargetList = spreadSheetColumnIndexMap.keys();
const jsonValueIdx = 1;
function execCheck() {
  console.log('=== Check Start ===');
  checkAllFilesConvJsonProcessed();
  checkAllWosIdsConvJsonProcessed();
  checkAllFilesOutputSpreadSheetProcessed();
  checkAllWosIdsProcessed();
  console.log('=== Check End ===');
}
function checkAllWosIdsProcessed() {
  console.log(
    '4.全てのJSON情報がスプレッドシートに出力されていることを確認する処理'
  );
  // 個別確認用↓
  /*
  const targetJsonArray = ['100.json', '101.json'];
  const targetJsonSet = new Set(
    targetJsonArray.map(fileName => fileName.split('.')[0])
  );
  */
  // 全件↓
  const targetJsonSet = new Set();
  checkAllWosIdsProcessed_(targetJsonSet);
}
function checkAllWosIdsProcessed_(targetCodeSet = new Set()) {
  const inputFolderId =
    PropertiesService.getScriptProperties().getProperty('intermediateFolder');
  const outputFolderId = getCheckTargetFolderId_();
  const jsonFiles = getFilesForCheck_(inputFolderId);
  const jsonFileNames = getFileNameForCheck_(jsonFiles);
  const spreadsheetFiles = getFilesForCheck_(outputFolderId);

  const targetJsonFileNames =
    targetCodeSet.size === 0
      ? jsonFileNames
      : jsonFileNames.filter(fileName =>
          targetCodeSet.has(fileName.split('.')[0])
        );
  const targetJsonFiles = jsonFiles.filter(file =>
    targetJsonFileNames.includes(file.getName())
  );
  targetJsonFiles.forEach(jsonFile => {
    compareJsonAndSpreadSheet_(jsonFile, spreadsheetFiles);
  });
  console.log(
    `対象JSONファイル数: ${targetJsonFileNames.length} / ${jsonFileNames.length}`
  );
  console.log('全てのJSON情報がスプレッドシートに出力されました。');
}
function compareJsonAndSpreadSheet_(jsonFile, spreadsheetFiles) {
  const json = JSON.parse(jsonFile.getBlob().getDataAsString());
  const facilityCode =
    json[0][spreadSheetColumnIndexMap.get('facilityNumber')][jsonValueIdx];
  const spreadSheetFile = spreadsheetFiles.find(file =>
    file.getName().includes(facilityCode)
  );
  if (!spreadSheetFile) {
    throw new Error(
      `スプレッドシートに出力されていないファイルが存在します。${facilityCode}`
    );
  }
  const spreadsheet = SpreadsheetApp.openById(spreadSheetFile.getId());
  const sheet = spreadsheet.getSheets()[0];
  const spreadSheetValues = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getValues();
  if (spreadSheetValues.length !== json.length) {
    throw new Error(
      `スプレッドシートの行数が異なります。${facilityCode} ${spreadSheetValues.length} ${json.length}`
    );
  }
  json.forEach(jsonRow => {
    const jsonWosId =
      jsonRow[spreadSheetColumnIndexMap.get('wosId')][jsonValueIdx];
    const targetSsRow = spreadSheetValues.filter(
      row => row[spreadSheetColumnIndexMap.get('wosId')] === jsonWosId
    );
    if (targetSsRow.length === 0) {
      throw new Error(
        `スプレッドシートに出力されていないWoS Idが存在します。${facilityCode} ${jsonWosId}`
      );
    }
    compareTargetList.forEach(targetColumn => {
      compareValues_(jsonRow, targetSsRow[0], targetColumn);
    });
  });
}
function compareValues_(jsonRow, spreadSheetRow, targetColumn) {
  const jsonColIndex = spreadSheetColumnIndexMap.get(targetColumn);
  const spreadSheetColIndex = spreadSheetColumnIndexMap.get(targetColumn);
  const jsonValue = jsonRow[jsonColIndex][jsonValueIdx] ?? '';
  const spreadSheetValue = spreadSheetRow[spreadSheetColIndex];
  if (jsonValue !== spreadSheetValue) {
    throw new Error(
      `値が一致しません。JSON: ${jsonValue}, スプレッドシート: ${spreadSheetValue}`
    );
  }
}

function checkAllFilesOutputSpreadSheetProcessed() {
  console.log(
    '3.全てのJSONファイルがスプレッドシート出力処理されたことを確認する処理'
  );
  const inputFolderId =
    PropertiesService.getScriptProperties().getProperty('intermediateFolder');
  const outputFolderId = getCheckTargetFolderId_();
  const [jsonFileNames, spreadsheetFileNames] = getFileNameArrayForCheck_(
    inputFolderId,
    outputFolderId
  );
  const inputFacilityCodes = jsonFileNames.map(
    fileName => fileName.split('.')[0]
  );
  const outputFacilityCodes = spreadsheetFileNames.map(
    fileName => fileName.split('_')[0]
  );
  compareFileNameArray_(inputFacilityCodes, outputFacilityCodes);
}
function checkAllWosIdsConvJsonProcessed() {
  console.log('2.JSON変換処理で全てのWoSIDが処理されたことを確認する処理');
  const inputFolderId =
    PropertiesService.getScriptProperties().getProperty('inputFolder');
  const outputFolderId =
    PropertiesService.getScriptProperties().getProperty('intermediateFolder');
  const inputJsonFiles = getFilesForCheck_(inputFolderId);
  const outputJsonFiles = getFilesForCheck_(outputFolderId);
  const inputJsonFileNames = getFileNameForCheck_(inputJsonFiles);
  const outputJsonFileNames = getFileNameForCheck_(outputJsonFiles);
  if (inputJsonFileNames.length !== outputJsonFileNames.length) {
    throw new Error('入力JSONファイルと出力JSONファイルの数が一致しません。');
  }
  const unmatchedFiles = inputJsonFileNames.filter(
    fileName => !outputJsonFileNames.includes(fileName)
  );
  if (unmatchedFiles.length > 0) {
    console.log('一致しないファイル:', unmatchedFiles);
    throw new Error('入力JSONファイルと出力JSONファイルが一致しません。');
  }
  inputJsonFileNames.forEach(fileName => {
    const inputFile = inputJsonFiles.find(file => file.getName() === fileName);
    const outputFile = outputJsonFiles.find(
      file => file.getName() === fileName
    );
    if (!inputFile || !outputFile) {
      throw new Error(`ファイルが見つかりません: ${fileName}`);
    }
    const inputJson = JSON.parse(inputFile.getBlob().getDataAsString());
    const inputPapers = inputJson.papers;
    const outputJson = JSON.parse(outputFile.getBlob().getDataAsString());
    if (inputPapers.length !== outputJson.length) {
      throw new Error(
        `入力JSONファイルと出力JSONファイルの行数が一致しません。${fileName}`
      );
    }
    const inputWosIds = inputPapers.map(paper => paper.uid);
    const outputWosIds = outputJson.map(x => x[3][1]);
    const unmatchedWosIds = inputWosIds.filter(
      wosId => !outputWosIds.includes(wosId)
    );
    if (unmatchedWosIds.length > 0) {
      console.log('一致しないWoS ID:', unmatchedWosIds);
      throw new Error(
        `入力JSONファイルと出力JSONファイルのWoS IDが一致しません。${fileName}`
      );
    }
  });
  console.log('全てのWoS IDが処理されました。');
}
function checkAllFilesConvJsonProcessed() {
  console.log('1.全てのファイルがJSON変換処理されたことを確認する処理');
  checkAllFilesProcessed_(
    PropertiesService.getScriptProperties().getProperty('inputFolder'),
    PropertiesService.getScriptProperties().getProperty('intermediateFolder')
  );
}
function compareFileNameArray_(inputFileNames, outputFileNames) {
  // 処理されたファイルのリストを作成
  const processedFilesSet = new Set(outputFileNames);
  const allFilesSet = new Set(inputFileNames);
  console.log(`処理された入力ファイル数: ${allFilesSet.size}`);
  console.log(`処理された出力ファイル数: ${processedFilesSet.size}`);
  // 同じ名前のファイルが複数存在する場合エラーを出力
  if (allFilesSet.size !== inputFileNames.length) {
    throw new Error('入力フォルダに同じ名前のファイルが複数存在します。');
  }
  if (processedFilesSet.size !== outputFileNames.length) {
    throw new Error('出力フォルダに同じ名前のファイルが複数存在します。');
  }
  // 処理されていないファイルを確認
  const unprocessedFiles = [...allFilesSet].filter(
    file => !processedFilesSet.has(file)
  );
  if (unprocessedFiles.length > 0) {
    console.log('処理されていないファイル:', unprocessedFiles);
    throw new Error(`処理されていないJSONファイルが存在します。`);
  } else {
    console.log('全てのファイルが処理されました。');
  }
}
function checkAllFilesProcessed_(inputFolderId, OutputFolderId) {
  const [inputFileNames, outputFileNames] = getFileNameArrayForCheck_(
    inputFolderId,
    OutputFolderId
  );
  compareFileNameArray_(inputFileNames, outputFileNames);
}
function getFileNameArrayForCheck_(inputFolderId, outputFolderId) {
  const allFiles = getFilesForCheck_(inputFolderId);
  const processedFiles = getFilesForCheck_(outputFolderId);
  const allFileNames = getFileNameForCheck_(allFiles);
  const processedFileNames = getFileNameForCheck_(processedFiles);
  return [allFileNames, processedFileNames];
}

function getFileNameForCheck_(fileArray) {
  const fileNameArray = [];
  fileArray.forEach(file => {
    const fileName = file.getName();
    fileNameArray.push(fileName);
  });
  return fileNameArray;
}

function getFilesForCheck_(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  const fileIterator = folder.getFiles();
  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    files.push(file);
  }
  return files;
}
