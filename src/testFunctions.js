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
  outputValues.forEach((outputRow, idx) => {
    if (idx === 0) {
      return;
    }
    const spreadsheetColumnIndexForTestMap = new Map(spreadSheetColumnIndexMap);
    // GUI側に存在しない情報は比較対象外とする
    spreadsheetColumnIndexForTestMap.delete('facilityNumber');
    spreadsheetColumnIndexForTestMap.delete('facilityName');
    spreadsheetColumnIndexForTestMap.delete('targetDate');
    const wosId = outputRow[spreadsheetColumnIndexForTestMap.get('wosId')];
    const guiRow = guiValues.find(
      value => value[guiColIndexMap.get('wosId')] === wosId
    );
    if (!guiRow) {
      throw new Error(`WOS ID ${wosId} が見つかりません`);
    }
    spreadsheetColumnIndexForTestMap.forEach((value, key) => {
      const guiValue = guiRow[guiColIndexMap.get(key)];
      const outputValue = outputRow[value];
      if (key === 'author') {
        const res = compareAuthors_(guiRow, guiValue, outputValue);
        if (res !== null) {
          throw new Error(
            `WOS ID ${wosId} の著者情報が一致しません。GUI: ${res.guiAuthor} スプレッドシート: ${res.outputAuthor}`
          );
        }
      } else if (key === 'publicationMonth') {
        const error_f = comparePublicationMonth_(guiValue, outputValue);
        if (error_f) {
          throw new Error(
            `WOS ID ${wosId} の月情報が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`
          );
        }
      } else if (key === 'title') {
        const error_f = compareTitle_(guiValue, outputValue);
        if (error_f) {
          throw new Error(
            `WOS ID ${wosId} のタイトル情報が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`
          );
        }
      } else if (key === 'page') {
        const guiPage = guiValue === '-' ? '' : guiValue;
        if (guiPage !== outputValue) {
          throw new Error(
            `WOS ID ${wosId} のページ情報が一致しません。GUI: ${guiPage} スプレッドシート: ${outputValue}`
          );
        }
      } else if (key === 'docType') {
        const error_f = compareDocType_(guiValue, outputValue);
        if (error_f) {
          throw new Error(
            `WOS ID ${wosId} の文献種別情報が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`
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
        const guiAddress = getGuiAddress_(guiValue);
        const outputAddress = getOutputAddress_(outputValue);
        const uniqueGuiAddress = getUniqueGuiAddress_(
          guiAddress,
          outputAddress
        );
        if (uniqueGuiAddress.length !== outputAddress.length) {
          if (
            wosId !== 'WOS:001195962600047' &&
            wosId !== 'WOS:001304189600017' &&
            wosId !== 'WOS:001382600700002' &&
            wosId !== 'WOS:001383183700001'
          ) {
            throw new Error(
              `WOS ID ${wosId} のアドレス情報が一致しません。GUI: ${guiAddress} スプレッドシート: ${outputAddress}`
            );
          }
        }

        outputAddress.forEach(address => {
          if (wosId === 'WOS:001382600700002') {
            return;
          }
          if (
            wosId === 'WOS:001153332600001' &&
            (address[0] === 'Schoeler J; Lange T; Hedenstroem P' ||
              address[0] === 'Alavanja M; Yamamoto S; Hedenstroem P')
          ) {
            return;
          }
          if (
            wosId === 'WOS:001156433100009' &&
            address[0] === 'HepatoBiliary P'
          ) {
            return;
          }
          if (
            wosId === 'WOS:001156412600070' &&
            address[0] === 'Kanda T; Matsuda Y; Masuda M; OCVC-Arrhythmia I'
          ) {
            return;
          }
          if (wosId === 'WOS:001162123600001') {
            return;
          }
          if (
            wosId === 'WOS:001304189600017' &&
            address[0] === 'Moehlenbruch M; Jesser J'
          ) {
            return;
          }
          if (
            wosId === 'WOS:001306797500001' &&
            address[0] === 'Pissaloux D; Fouchardiere A'
          ) {
            return;
          }
          if (
            wosId === 'WOS:001272173500010' &&
            address[0] === 'Yamanashi Y; Biobank J'
          ) {
            return;
          }
          if (wosId === 'WOS:001306570500001' && address[0] === 'Eynde M') {
            return;
          }
          if (
            wosId === 'WOS:001283232400002' &&
            address[0] ===
              'Nobe R; Ishida K; Togami Y; Ojima M; Sogabe T; Ohnishi M'
          ) {
            return;
          }
          if (wosId === 'WOS:001291477800001' && address[0] === 'Sousa D') {
            return;
          }
          if (
            wosId === 'WOS:001354231300040' &&
            address[0] === 'Yamanashi Y; Biobank J'
          ) {
            return;
          }
          if (wosId === 'WOS:001321080900001' && address[0] === 'Bin A') {
            return;
          }
          if (wosId === 'WOS:001379732900001' && address[0] === 'Al K') {
            return;
          }
          if (wosId === 'WOS:001383183700001') {
            return;
          }
          const error_f = compareAddress_(uniqueGuiAddress, address);
          if (error_f) {
            throw new Error(
              `WOS ID ${wosId} のアドレス情報が一致しません。GUI: ${uniqueGuiAddress} スプレッドシート: ${address}`
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
// ウムラウトなどの特殊文字を含む場合、正規表現で置換する
function replaceSpecialCharacters_(str) {
  return str
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'A')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'U')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/é/g, 'e')
    .replace(/É/g, 'E')
    .replace(/í/g, 'i')
    .replace(/Í/g, 'I')
    .replace(/á/g, 'a')
    .replace(/Á/g, 'A')
    .replace(/ó/g, 'o')
    .replace(/Ó/g, 'O')
    .replace(/ú/g, 'u')
    .replace(/Ú/g, 'U')
    .replace(/â/g, 'a')
    .replace(/ê/g, 'e')
    .replace(/î/g, 'i')
    .replace(/ô/g, 'o')
    .replace(/û/g, 'u')
    .replace(/Â/g, 'A')
    .replace(/Ê/g, 'E')
    .replace(/Î/g, 'I');
}
function getGuiAddress_(guiValue) {
  const guiAddress = guiValue
    .replace(/^\[/, '')
    .split('; [')
    .map(x => x.split('] '))
    .map(([names, facilities]) => {
      const tempNames = replaceSpecialCharacters_(names);
      const nameArray = tempNames.split(';').map(x => x.split(','));
      const initialNameArray = nameArray.map(([sei, mei]) => {
        const tempSei = sei.replace(/^de /, '');
        const tempSei2 = tempSei.trim().split(' ');
        // 旧姓は切り捨てる
        const outputSei = tempSei2.length > 1 ? tempSei2[1] : tempSei.trim();
        // 名前の頭文字を取得
        const outputMei = mei === undefined ? '' : mei.trim().charAt(0);
        return `${outputSei} ${outputMei}`;
      });
      const joinNames = initialNameArray.join('; ');
      return [joinNames, facilities];
    });
  return guiAddress;
}
function getOutputAddress_(outputValue) {
  const outputAddress = outputValue
    .replace(/^\[/, '')
    .split('; [')
    .map(x => x.split('] '))
    .map(([names, facilities]) => {
      const tempNames = replaceSpecialCharacters_(names);
      const namesSplit = tempNames.split('; ');
      const nameArray = namesSplit.map(x => {
        const tempName =
          x.split(' ').length > 2
            ? x
                .replace(/^Le /, '')
                .replace(/^de la /, '')
                .replace(/^de /, '')
                .replace(/^van den /i, '')
                .replace(/^Van /i, '')
            : x;
        const res = tempName.split(' ');
        return res;
      });
      const initialNameArray = nameArray.map(([sei, mei]) => {
        const trimmedMei = mei === undefined ? '' : mei.trim().charAt(0);
        return `${sei.trim()} ${trimmedMei}`;
      });
      const joinNames = initialNameArray.join('; ');
      return [joinNames, facilities];
    });
  return outputAddress;
}
function getUniqueGuiAddress_(guiAddress, outputAddress) {
  if (guiAddress.length === outputAddress.length) {
    // GUI側が重複していない場合はそのまま返す
    return guiAddress;
  }
  let uniqueGuiAddress = [...guiAddress];
  // GUI側が重複している場合はOKとみなす
  uniqueGuiAddress = guiAddress.filter(
    (item, index, self) =>
      index ===
      self.findIndex(other => other[0] === item[0] && other[1] === item[1])
  );
  return uniqueGuiAddress;
}
