const guiColIndexMap = new Map([
  ['wosId', 0],
  ['author', 1],
  ['title', 2],
  ['publicationName', 3],
  ['vol', 4],
  ['issue', 5],
  ['page', 6],
  ['addresses', 7],
  ['earlyAccessDate', 8],
  ['docType', 9],
  ['pubmedId', 10],
  ['publicationYear', 11],
  ['publicationMonth', 12],
  ['groupAuthor', 13],
]);
function getTestFolder_() {
  const outputFolderId =
    PropertiesService.getScriptProperties().getProperty('testTargetFolderId');
  if (!outputFolderId) {
    throw new Error('testTargetFolderIdが設定されていません');
  }
  const outputFolder = DriveApp.getFolderById(outputFolderId);
  return outputFolder;
}
function convertXlsToSheet_(file) {
  const rootFolder = DriveApp.getRootFolder();
  const convertedFile = Drive.Files.copy(
    {
      title: file.getName(),
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [{ id: rootFolder.getId() }],
    },
    file.getId()
  );
}
function getGuiFileValueForTest_(testFolder) {
  const temp = testFolder.getFilesByName('savedrecs');
  if (!temp.hasNext()) {
    throw new Error('savedrecsが見つかりません');
  }
  const tempFile = temp.next();
  const guiFileId = tempFile.getId();
  const guiFile = SpreadsheetApp.openById(guiFileId);
  const guiSheet = guiFile.getSheets()[0];
  const guiValues = guiSheet.getDataRange().getValues();
  const guiHeaders = guiValues[0];
  const colIndexMap = new Map();
  guiHeaders.forEach((header, index) => {
    colIndexMap.set(header, index);
  });
  // 筆頭著者または筆頭著者以外	（空白）	参考：PubMed_ID
  const wosIdIndex = colIndexMap.get('UT (Unique WOS ID)');
  const authorIndex = colIndexMap.get('Authors');
  const titleIndex = colIndexMap.get('Article Title');
  const publicationNameIndex = colIndexMap.get('Journal ISO Abbreviation');
  const volIndex = colIndexMap.get('Volume');
  const issueIndex = colIndexMap.get('Issue');
  const startPageIndex = colIndexMap.get('Start Page');
  const endPageIndex = colIndexMap.get('End Page');
  const addressesIndex = colIndexMap.get('Addresses');
  const earlyAccessDateIndex = colIndexMap.get('Early Access Date');
  const docTypeIndex = colIndexMap.get('Document Type');
  const pubmedIdIndex = colIndexMap.get('Pubmed Id');
  const publicationYearIndex = colIndexMap.get('Publication Year');
  const publicationDateIndex = colIndexMap.get('Publication Date');
  const groupAuthorIndex = colIndexMap.get('Group Authors');
  const targetInputValues = guiValues.map(value => {
    const wosId = value[wosIdIndex];
    const author = value[authorIndex];
    const title = value[titleIndex];
    const publicationName = value[publicationNameIndex];
    const vol = value[volIndex];
    const issue = value[issueIndex];
    const startPage = value[startPageIndex];
    const endPage = value[endPageIndex];
    const addresses = value[addressesIndex];
    const earlyAccessDate = value[earlyAccessDateIndex];
    const docType = value[docTypeIndex];
    const pubmedId = value[pubmedIdIndex];
    const publicationYear = value[publicationYearIndex];
    const publicationDate = value[publicationDateIndex];
    const groupAuthor = value[groupAuthorIndex];
    return [
      wosId,
      author,
      title,
      publicationName,
      vol,
      issue,
      `${startPage}-${endPage}`,
      addresses,
      earlyAccessDate,
      docType,
      pubmedId,
      publicationYear,
      publicationDate,
      groupAuthor,
    ];
  });
  return targetInputValues;
}

function testCompareValues_(guiValues, outputValues) {
  const spreadsheetColumnIndexForTestMap = new Map(spreadSheetColumnIndexMap);
  // GUI側に存在しない情報は比較対象外とする
  spreadsheetColumnIndexForTestMap.delete('facilityNumber');
  spreadsheetColumnIndexForTestMap.delete('facilityName');
  spreadsheetColumnIndexForTestMap.delete('targetDate');
  outputValues.forEach((outputRow, idx) => {
    if (idx === 0) {
      return;
    }
    const wosId = outputRow[spreadsheetColumnIndexForTestMap.get('wosId')];
    const guiRow = guiValues.find(
      value => value[guiColIndexMap.get('wosId')] === wosId
    );
    if (!guiRow) {
      throw new Error(`WOS ID ${wosId} が見つかりません`);
    }
    spreadsheetColumnIndexForTestMap.forEach((value, key) => {
      execCompareByColumn_(value, key, guiRow, outputRow, wosId);
    });
  });
}
