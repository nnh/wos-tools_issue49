const hospInfo = getHospInfo_();
function outputSsByFileName() {
  const targetFolder = getCheckTargetFolderId_();
  const outputFolder =
    targetFolder !== null
      ? DriveApp.getFolderById(targetFolder)
      : createOutputFolder_();
  const targetFileList = ['100.json'];
  outputSs(targetFileList, outputFolder);
}
function createOutputFolder_() {
  return createFolder_(
    DriveApp.getFolderById(
      PropertiesService.getScriptProperties().getProperty('outputFolderId')
    ),
    `${todayYyyymmdd_()} 施設別英文論文リスト`
  );
}
/**
 * Output spreadsheets.
 * @param none.
 * @return none.
 */
function outputSs(targetFileList = null, thisOutputFolder = null) {
  const outputFolder =
    thisOutputFolder === null ? createOutputFolder_() : thisOutputFolder;
  const inputFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('intermediateFolder')
  );
  const inputFiles = inputFolder.getFiles();
  let tempFiles = [];
  while (inputFiles.hasNext()) {
    const file = inputFiles.next();
    tempFiles.push(file);
  }
  const files = targetFileList
    ? targetFileList.map(
        target => tempFiles.filter(file => target === file.getName())[0]
      )
    : [...tempFiles];
  const sortColName = '出版日(targetDate)';
  const headerAndColWidth = [
    ['施設コード', 74],
    ['施設名', 240],
    ['PubMed_ID', 77],
    ['WoS_ID(uid)', 154],
    ['著者', 240],
    ['タイトル', 240],
    ['雑誌名(publicationName)', 180],
    ['巻(vol)', 60],
    ['号(issue)', 60],
    ['ページ', 80],
    ['年(PubYear)', 90],
    ['月(PubMonth)', 90],
    ['Epub Date(earlyAccessDate)', 125],
    ['DT(docType)', 100],
    ['貴院著者名', 90],
    ['筆頭著者または筆頭著者以外', 200],
    ['出版日(targetDate)', 80],
  ];
  const sortIdx = headerAndColWidth
    .map((x, idx) => (x[0] === sortColName ? idx : null))
    .filter(x => x)[0];
  const header = [headerAndColWidth.map(x => x[0])];
  const colWidthsList = headerAndColWidth.map(x => x[1]);
  const sheetId = 0;
  const colWidths = colWidthsList.map((width, idx) =>
    spreadSheetBatchUpdate.getSetColWidthRequest(sheetId, width, idx, idx + 1)
  );
  files.forEach(file => {
    const values = JSON.parse(file.getBlob().getDataAsString());
    const body = values
      .map(x => x.map(x => x[1]))
      .sort((x, y) => new Date(x[sortIdx]) - new Date(y[sortIdx]));
    const editValues = [...header, ...body];
    const newSheet = Sheets.newSpreadsheet();
    newSheet.properties = Sheets.newSpreadsheetProperties();
    const outputSheetName = hospInfo
      .filter(x => x[0] === file.getName().replace(/\.json/i, ''))[0]
      .join('_');
    newSheet.properties.title = outputSheetName;
    const ss = Sheets.Spreadsheets.create(newSheet);
    const updateCellRequest = spreadSheetBatchUpdate.getRangeSetValueRequest(
      sheetId,
      0,
      0,
      editValues
    );
    const batchUpdateRequest = {
      requests: [
        updateCellRequest,
        ...colWidths,
        spreadSheetBatchUpdate.getAllCellWrapRequest(sheetId),
        spreadSheetBatchUpdate.getAutoResizeRowRequest(
          sheetId,
          1,
          editValues.length
        ),
        spreadSheetBatchUpdate.getSetRowHeightRequest(sheetId, 21, 0, 1),
      ],
    };
    try {
      Sheets.Spreadsheets.batchUpdate(batchUpdateRequest, ss.spreadsheetId);
      Utilities.sleep(200);
      DriveApp.getFileById(ss.spreadsheetId).moveTo(outputFolder);
    } catch (error) {
      console.log(`output error:${outputSheetName}`);
    }
  });
}
/**
 * @param none.
 * @return {string} For example '20230310_1435'.
 */
function todayYyyymmdd_() {
  return Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmm');
}
/**
 * @param {Object} parentFolder The folder object to which the folder will be created.
 * @param {string} folderName Name of the folder to be created.
 * @return {Object} The folder object.
 */
function createFolder_(parentFolder, folderName = todayYyyymmdd_()) {
  return parentFolder.createFolder(folderName);
}
/**
 * Move old files.
 * @param {Object} fromFolder The folder from which to move.
 * @param {Object} toFolder The destination folder.
 * @return none.
 */
function saveFiles_(fromFolder, toFolder) {
  const oldFiles = fromFolder.getFiles();
  while (oldFiles.hasNext()) {
    const file = oldFiles.next();
    file.moveTo(toFolder);
  }
}
/**
 * Output intermediate files.
 * @param none.
 * @return none.
 */
function outputJson() {
  const outputJsonFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('intermediateFolder')
  );
  const backupFolder = createFolder_(outputJsonFolder);
  saveFiles_(outputJsonFolder, backupFolder);
  const inputFolder = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('inputFolder')
  );
  const inputFiles = inputFolder.getFiles();
  let files = [];
  while (inputFiles.hasNext()) {
    const file = inputFiles.next();
    files.push(file);
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
/**
 * @param {Object} file file object.
 * @return {string}
 */
function getJson_(file) {
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
/**
 * Reads the input file, edits the necessary information, and returns a string in JSON format.
 * @param {Object} rec
 * @return {Object}
 */
function getJsonDetail_(rec) {
  const facility = rec.facility;
  const facilityNumber = facility.facilityNumber;
  const arrayFacilityInfo = getHospOoAd_().filter(
    x => x.facilityNumber === facilityNumber
  );
  const summaryFacilityInfo =
    arrayFacilityInfo.length > 1
      ? arrayFacilityInfo.reduce((total, current) => [
          [...total.OO, ...current.OO],
          [...total.AD, ...current.AD],
        ])
      : null;
  const facilityInfo = !summaryFacilityInfo
    ? arrayFacilityInfo[0]
    : Object.fromEntries([
        ['OO', summaryFacilityInfo[0]],
        ['AD', summaryFacilityInfo[1]],
        ['facilityNumber', facilityNumber],
      ]);
  // Add Japanese facility name.
  const tempFacilityInfo = hospInfo.filter(
    x => x[0] === String(facilityNumber)
  )[0];
  facilityInfo.facilityNameJp = tempFacilityInfo[1];
  const papers = rec.papers;
  const res = papers.map(paper => {
    const targetFacilityAuthors = paper.authors
      .map(authorInfo => {
        if (!authorInfo.isNhoStaff) {
          return null;
        }
        const ad = authorInfo.organizations
          .map(organization =>
            facilityInfo.AD.map(ad =>
              new RegExp(ad, 'i').test(organization.fullAddress)
            ).some(x => x)
          )
          .some(x => x);
        if (ad) {
          return authorInfo;
        }
        const oo = authorInfo.organizations
          .map(organization =>
            facilityInfo.OO.map(oo =>
              organization.content
                .map(content => new RegExp(oo, 'i').test(content))
                .some(x => x)
            ).some(x => x)
          )
          .some(x => x);
        if (oo) {
          return authorInfo;
        }
        return null;
      })
      .filter(x => x);
    const targetFacilityAuthorName = targetFacilityAuthors
      .map(x => x.name)
      .join(', ');
    const isFirstAuthor = targetFacilityAuthors
      .map(x => x.isFirstAuthor)
      .some(x => x);
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
    item.set('targetFacilityAuthorName', targetFacilityAuthorName);
    item.set(
      'isFirstAuthor',
      isFirstAuthor ? '（筆頭筆者）' : '（筆頭筆者以外）'
    );
    item.set(
      'sortDate',
      paper.targetDate ? paper.targetDate.split('T')[0] : ''
    );
    return [...item];
  });
  return res;
}
/**
 * Return basic hospital information.
 * @param none.
 * @return [[number, string]] A two-dimensional array of facility codes and facility names.
 */
function getHospInfo_() {
  const inputFile = spreadSheetBatchUpdate.rangeGetValue(
    PropertiesService.getScriptProperties().getProperty('hospInfoFileId'),
    'Base!A:I'
  )[0].values;
  const sheetNames = inputFile
    .map(x => [x[0], x[7]])
    .filter((_, idx) => idx !== 0);
  return sheetNames;
}
