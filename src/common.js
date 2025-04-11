const _tempCheckFolder = getCheckTargetFolderId_();
const checkFolder =
  _tempCheckFolder !== null ? DriveApp.getFolderById(_tempCheckFolder) : null;
function getCheckTargetFolderId_() {
  // 最新のフォルダを取得する
  const parentFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('outputFolderId')
  );
  const folders = parentFolder.getFolders();
  let lastUpdate = [];
  while (folders.hasNext()) {
    const folder = folders.next();
    lastUpdate.push([
      folder.getId(),
      folder.getLastUpdated(),
      folder.getName(),
    ]);
  }
  if (lastUpdate.length === 0) {
    return null;
  }
  const sortFolder = lastUpdate.sort((x, y) => new Date(y[1]) - new Date(x[1]));
  return sortFolder[0][0];
}
/*
// 確認用スクリプト
function countFilesInFolder() {
  // ファイル数確認
  const folder = checkFolder;
  let fileCount = 0;
  const files = folder.getFiles();
  while (files.hasNext()) {
    files.next();
    fileCount++;
  }

  console.log('フォルダ内のファイルの数: ' + fileCount);
}

function forCheck3() {
  // 貴院著者が出ていないPubMedIdを抽出する
  const targetFolder = checkFolder;
  console.log(`対象フォルダ：${checkFolder.getName()}`);
  const files = targetFolder.getFiles();
  let target = [];
  while (files.hasNext()) {
    const file = files.next();
    const sheet = SpreadsheetApp.openById(file.getId()).getSheets()[0];
    const values = sheet.getDataRange().getValues();
    const targetValues = values.filter(value => value[14] === '');
    if (targetValues.length > 0) {
      target.push(targetValues);
    }
  }
  target = target.flat();
  if (target.length === 0) {
    console.log('対象０件');
    return;
  }
  const output = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('forCheck3SheetId')
  ).getSheets()[0];
  output.clear();
  output.getRange(1, 1, target.length, target[0].length).setValues(target);
}
function forCheck2() {
  // 全件出力を確認
  const outputFolder = checkFolder;
  console.log(`対象フォルダ：${checkFolder.getName()}`);
  const outputFiles = outputFolder.getFiles();
  const inputFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('inputFolder')
  );
  const inputFiles = inputFolder.getFiles();
  const outputDataMap = new Map();
  const inputDataMap = new Map();
  while (inputFiles.hasNext()) {
    const blob = inputFiles.next().getBlob().getDataAsString();
    const json = JSON.parse(blob);
    const inputFacilityNumber = json.facility.facilityNumber;
    const uids = [
      ...new Set([json.papers.map(x => Number(x.uid.replace('WOS:', '')))]),
    ][0].sort((x, y) => x - y);
    inputDataMap.set(inputFacilityNumber, uids);
  }
  const inputArray = [...inputDataMap].sort();
  const inputJson = JSON.stringify(inputArray);
  while (outputFiles.hasNext()) {
    const ss = SpreadsheetApp.openById(outputFiles.next().getId());
    const sheet = ss.getSheets()[0];
    const values = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
      .getValues();
    const outputFacilityNumber = values[0][0];
    const uids = [
      ...new Set([values.map(x => Number(x[3].replace('WOS:', '')))]),
    ][0].sort((x, y) => x - y);
    outputDataMap.set(outputFacilityNumber, uids);
  }
  const outputArray = [...outputDataMap].sort();
  const outputJson = JSON.stringify(outputArray);
  console.log(inputJson === outputJson);
}
function forCheck1() {
  // 全ての入力ファイルが処理されていることを確認する
  const outputFolder = checkFolder;
  console.log(`対象フォルダ：${checkFolder.getName()}`);
  const outputFiles = outputFolder.getFiles();
  const inputFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('inputFolder')
  );
  const inputFiles = inputFolder.getFiles();
  let inputFilenames = [];
  while (inputFiles.hasNext()) {
    inputFilenames.push(inputFiles.next().getName().replace('.json', ''));
  }
  let outputFilenames = [];
  while (outputFiles.hasNext()) {
    outputFilenames.push(outputFiles.next().getName().replace(/_.*$/, ''));
  }
  // 0件なら全て処理されている
  const res = inputFilenames
    .map(input => (!outputFilenames.includes(input) ? input : null))
    .filter(x => x);
  console.log(res);
}
*/
