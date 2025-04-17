const testTargetJsonFileName = '100.json';
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
