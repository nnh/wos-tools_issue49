const hospInfo = getHospInfo();
/**
 * スプレッドシート出力
 */
function outputSs(){
  const outputFolder = DriveApp.getFolderById(ScriptProperties.getProperty('outputFolderId'));
  const inputFolder = DriveApp.getFolderById(ScriptProperties.getProperty('intermediateFolder'));
  const inputFiles = inputFolder.getFiles();
  let files = [];
  while (inputFiles.hasNext()) {
    const file = inputFiles.next();
    files.push(file);
  }
  const batchUpdate = new SpreadSheetBatchUpdate();
  const colWidthsList = [74, 240, 77, 154, 240, 240, 180, 60, 60, 80, 80, 90, 90, 125, 100];
  const header = [['施設コード', '施設名', 'PubMed_ID', 'WoS_ID(uid)', '著者', 'タイトル', '雑誌名(publicationName)', '巻(vol)', '号(issue)', 'ページ', '年(PubYear)', '月(PubMonth)', 'Epub Date(earlyAccessDate)', 'DT(docType)', '筆頭著者または筆頭著者以外']];
  const sheetId = 0;
  const colWidths = colWidthsList.map((width, idx) => batchUpdate.getSetColWidthRequest(sheetId, width, idx, idx + 1));
  files.forEach(file => {
    const values = JSON.parse(file.getBlob().getDataAsString());
    const body = values.map(x => x.map(x => x[1]));
    const editValues = [...header, ...body];
    const newSheet = Sheets.newSpreadsheet();
    newSheet.properties = Sheets.newSpreadsheetProperties();
    newSheet.properties.title = file.getName();
    const ss = Sheets.Spreadsheets.create(newSheet);
    const updateCellRequest = batchUpdate.getRangeSetValueRequest(sheetId, 
                                                                  0, 
                                                                  0, 
                                                                  editValues);
    const batchUpdateRequest = {
      'requests' : [
        updateCellRequest,
        ...colWidths,
        batchUpdate.getCellWrapRequest(sheetId),
        batchUpdate.getAutoResizeRowRequest(sheetId, 1, editValues.length),
        batchUpdate.getSetRowHeightRequest(sheetId, 21, 0, 1),
      ],
    }                                                              
    Sheets.Spreadsheets.batchUpdate(batchUpdateRequest, ss.spreadsheetId);
    Utilities.sleep(100);
    DriveApp.getFileById(ss.spreadsheetId).moveTo(outputFolder);
  });
}
/**
 * 中間ファイルを出力する
 */
function outputJson(){
  const inputFolder = DriveApp.getFolderById(ScriptProperties.getProperty('inputFolder'));
  const inputFiles = inputFolder.getFiles();
  let files = [];
  while (inputFiles.hasNext()) {
    const file = inputFiles.next();
    files.push(file);
  }
  const targetHospList = hospInfo.map(x => [x[0], x[1].replace('国立病院機構', '')]);
  // ここ変わる予定↓
//  const jsonFileName = files.map(x => targetHospList.filter(hosp => hosp[1] === x.getName().replace('.json', '').replace('ど', 'ど').replace('が', 'が').replace('弘前病院', '弘前総合医療センター'))[0].join('_'));
  const thisFolder = DriveApp.getFolderById(ScriptProperties.getProperty('thisFolder'));
  const fileNameList = Utilities.newBlob('', 'text/csv', '出力ファイル名リスト.txt').setDataFromString(jsonFileName, 'UTF-8');
  thisFolder.createFile(fileNameList);
  const outputJsonFolder = DriveApp.getFolderById(ScriptProperties.getProperty('intermediateFolder'));
  files.forEach((x, idx) => {
    const json = getJson_(x);
    const blob = Utilities.newBlob('', 'text/plain', jsonFileName[idx]).setDataFromString(json, 'UTF-8');
    outputJsonFolder.createFile(blob);
  });
  return;
}
function getJson_(file){
  const value = file.getBlob().getDataAsString();
  try {
	  JSON.parse(value);
  } catch (error) {
	  return null;
  } 
  const inputJson = JSON.parse(value);
  const res = getJsonDetail_(inputJson);
  const outputJson = JSON.stringify(res);
  return outputJson;  
}
function getJsonDetail_(rec){
  const facility = rec.facility;
  const facilityNumber = facility.facilityNumber;
  // 施設コードから施設情報を取得する
  const facilityInfo = getHospOoAd_().filter(x => x.facilityNumber === facilityNumber)[0];
  // 日本語施設名を追加
  const tempFacilityInfo = hospInfo.filter(x => x[0] === String(facilityNumber))[0];
  facilityInfo.facilityNameJp = tempFacilityInfo[1];
  const papers = rec.papers;
  const res = papers.map(paper => {
    const authorList = paper.authors.map(x => x.name).join(',');
    const item = new Map();
    item.set('facilityCode', facilityNumber);
    item.set('facilityName', facilityInfo.facilityNameJp);
    item.set('pubMedId', paper.pubMedId);
    item.set('wosId', paper.uid);
    item.set('author', authorList);
    item.set('title', paper.title);
    item.set('journalName', paper.publicationName);
    item.set('volume', paper.vol);
    item.set('index', paper.issue);
    item.set('page', paper.page.content ? paper.page.content : '');
    item.set('py', paper.pubYear ? paper.pubYear : '');
    item.set('pm', paper.pubYear ? paper.pubMonth : '');
    item.set('epubDate', paper.earlyAccessDate ? paper.earlyAccessDate : '');
    item.set('dt', paper.docTypes.join(','));
    item.set('isFirstAuthor', 'dummy');  // 筆頭著者かそうでないか
    return [...item];
  });
  return res;
}
function copyFiles_(sheetNames){
//  const sheetNames = getHospInfo().map(x => `${x[0]}_${x[1]}`);
  for (let i = 0; i < sheetNames.length; i++){
    copyFile_(sheetNames[i]);
    Utilities.sleep(100);
  }
}
/**
 * @param {string} new file name.
 * @return {object} spreadsheet object.
 */
function copyFile_(newName){
  const copyFromFile = DriveApp.getFileById(ScriptProperties.getProperty('templateFileId'));
  const outputFolder = DriveApp.getFolderById(ScriptProperties.getProperty('outputFolderId'));
  const newFile = copyFromFile.makeCopy(outputFolder);
  newFile.setName(newName);
  return newFile;
}
/**
 * Return basic hospital information.
 * @param none.
 * @return [[number, string]] A two-dimensional array of facility codes and facility names.
 */
function getHospInfo(){
  const inputFile = SpreadsheetApp.openById(ScriptProperties.getProperty('hospInfoFileId')).getSheetByName('病院基本情報').getDataRange().getValues();
  const sheetNames = inputFile.map(x => [x[0], x[1]]).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
  return sheetNames;
}
