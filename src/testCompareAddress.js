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
function editAddressForCompare_(value) {
  return value
    .replace(/^\[/, '')
    .split('; [')
    .map(x => x.split('] '));
}
function getGuiAddress_(guiValue) {
  const addressValues = editAddressForCompare_(guiValue);
  const guiAddress = addressValues.map(([names, facilities]) => {
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
  const addressValues = editAddressForCompare_(outputValue);
  const outputAddress = addressValues.map(([names, facilities]) => {
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
