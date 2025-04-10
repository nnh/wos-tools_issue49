function getTestFolder_() {
  const outputFolderId =
    PropertiesService.getScriptProperties().getProperty('testFolderId');
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
  outputValues.forEach((outputRow, idx) => {
    if (idx === 0) {
      return;
    }
    const wosId = outputRow[spreadSheetColumnIndexMap.get('wosId')];
    const guiRow = guiValues.find(
      value => value[guiColIndexMap.get('wosId')] === wosId
    );
    if (!guiRow) {
      throw new Error(`WOS ID ${wosId} が見つかりません`);
    }
    spreadSheetColumnIndexMap.forEach((value, key) => {
      if (
        key === 'facilityNumber' ||
        key === 'facilityName' ||
        key === 'targetDate'
      ) {
        return;
      }
      const guiValue = guiRow[guiColIndexMap.get(key)];
      const outputValue = outputRow[value];
      if (key === 'author') {
        const groupAuthor = guiRow[guiColIndexMap.get('groupAuthor')].trim();
        const guiAuthor = guiValue
          .split(';')
          .map(x => x.replace(/,/g, '').trim());
        const outputAuthor = outputValue
          .split(',')
          .map(x => x.trim())
          .filter(x => x !== groupAuthor);
        if (
          guiAuthor.length !== outputAuthor.length ||
          !guiAuthor.every(author => outputAuthor.includes(author))
        ) {
          throw new Error(
            `WOS ID ${wosId} の著者情報が一致しません。GUI: ${guiAuthor} スプレッドシート: ${outputAuthor}`
          );
        }
      } else if (key === 'page') {
        const guiPage = guiValue === '-' ? '' : guiValue;
        if (guiPage !== outputValue) {
          throw new Error(
            `WOS ID ${wosId} のページ情報が一致しません。GUI: ${guiPage} スプレッドシート: ${outputValue}`
          );
        }
      } else if (key === 'publicationName') {
        const guiPublicationName = guiValue.replace(/\./g, '');
        if (guiPublicationName !== outputValue) {
          throw new Error(
            `WOS ID ${wosId} の雑誌名が一致しません。GUI: ${guiPublicationName} スプレッドシート: ${outputValue}`
          );
        }
      } else if (key === 'pubmedId') {
        if (String(guiValue) !== String(outputValue)) {
          throw new Error(
            `WOS ID ${wosId} の ${key} が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`
          );
        }
      } else if (key === 'addresses') {
        const guiAddress = guiValue
          .replace(/^\[/, '')
          .split('; [')
          .map(x => x.split('] '))
          .map(([names, facilities]) => {
            const nameArray = names.split(';').map(x => x.split(','));
            const initialNameArray = nameArray.map(
              ([sei, mei]) => `${sei.trim()} ${mei.trim().charAt(0)}`
            );
            const joinNames = initialNameArray.join('; ');
            return [joinNames, facilities];
          });
        const outputAddress = outputValue
          .replace(/^\[/, '')
          .split('; [')
          .map(x => x.split('] '))
          .map(([names, facilities]) => {
            const nameArray = names.split('; ').map(x => x.split(' '));
            const initialNameArray = nameArray.map(
              ([sei, mei]) => `${sei.trim()} ${mei.trim().charAt(0)}`
            );
            const joinNames = initialNameArray.join('; ');
            return [joinNames, facilities];
          });
        if (guiAddress.length !== outputAddress.length) {
          throw new Error(
            `WOS ID ${wosId} のアドレス情報が一致しません。GUI: ${guiAddress} スプレッドシート: ${outputAddress}`
          );
        }
        outputAddress.forEach(address => {
          const guiAddressItem = guiAddress.filter(x => x[0] === address[0]);
          if (guiAddressItem.length === 0) {
            throw new Error(
              `WOS ID ${wosId} のアドレス情報が一致しません。GUI: ${guiAddress} スプレッドシート: ${outputAddress}`
            );
          }
          const guiAddressItemFacility = guiAddressItem[0][1];
          const outputAddressItemFacility = address[1];
          if (guiAddressItemFacility !== outputAddressItemFacility) {
            throw new Error(
              `WOS ID ${wosId} のアドレス情報が一致しません。GUI: ${guiAddressItemFacility} スプレッドシート: ${outputAddressItemFacility}`
            );
          }
        });
      } else {
        if (guiValue !== outputValue) {
          throw new Error(
            `WOS ID ${wosId} の ${key} が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`
          );
        }
      }
    });
  });
}
function testCompareWosGui() {
  const testFolder = getTestFolder_();
  const guiValues = getGuiFileValueForTest_(testFolder);
  const targetSpreadSheetValue = SpreadsheetApp.openById(
    '105tHQttQQmDG8qOKWn63QvY6K39H4xDnJ0iWv9ki-4M'
  )
    .getSheets()[0]
    .getDataRange()
    .getValues();
  testCompareValues_(guiValues, targetSpreadSheetValue);
  console.log(0);
}
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
function convertWosGui() {
  const testFolder = getTestFolder_();
  const files = testFolder.getFilesByName('savedrecs.xls');
  if (!files.hasNext()) {
    throw new Error('savedrecs.xlsが見つかりません');
  }
  const file = files.next();
  convertXlsToSheet_(file);
}
