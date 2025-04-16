function compareAuthors_(guiRow, guiValue, outputValue) {
  const groupAuthor = guiRow[guiColIndexMap.get('groupAuthor')]
    .split(';')
    .map(x => x.trim());
  const guiAuthor = guiValue.split(';').map(x => x.replace(/,/g, '').trim());
  const outputAuthor = outputValue
    .split(',')
    .map(x => x.trim())
    .filter(x => !groupAuthor.includes(x));
  if (
    guiAuthor.length !== outputAuthor.length ||
    !guiAuthor.every(author => outputAuthor.includes(author))
  ) {
    return { guiAuthor: guiAuthor, outputAuthor: outputAuthor };
  } else {
    return null;
  }
}
function comparePublicationMonth_(guiValue, outputValue) {
  if (guiValue === outputValue) {
    return false;
  }
  const temp1 = guiValue.replace(/^[0-9]{4}/, '').trim();
  if (temp1 === outputValue) {
    return false;
  }
  return true;
}
function compareTitle_(guiValue, outputValue) {
  // HTMLタグを除去
  const outputTitle = outputValue.replace(/<[^>]*>/g, '').trim();
  // &apos;を'に置換
  const outputTitle2 = outputTitle.replace(/&apos;/g, "'");
  // 文字列中のダブルクォーテーションを除去
  const outputTitle3 = outputTitle2.replace(/"/g, '');
  return guiValue !== outputTitle3;
}
function compareDocType_(guiValue, outputValue) {
  const guiDocType = guiValue.split(';').map(x => x.trim());
  const outputDocType = outputValue.split(',').map(x => x.trim());
  return (
    guiDocType.length !== outputDocType.length ||
    !guiDocType.every(docType => outputDocType.includes(docType))
  );
}
function compareAddress_(uniqueGuiAddress, address) {
  const guiAddressItem = uniqueGuiAddress.filter(x => x[0] === address[0]);
  if (guiAddressItem.length !== 0) {
    const guiAddressItemFacility = guiAddressItem.filter(
      x => x[1] === address[1]
    );
    return guiAddressItemFacility.length === 0;
  }
  // 著者順が異なるレコードを許容する
  const authors = address[0].split('; ');
  const testAddressItems = uniqueGuiAddress
    .map(([author, facility]) => {
      const authorArray = author.split('; ');
      if (authors.every(author => authorArray.includes(author))) {
        return [author, facility];
      } else {
        return null;
      }
    })
    .filter(x => x !== null);
  if (testAddressItems.length === 0) {
    return true;
  }
  const testAddressItem2 = testAddressItems.filter(([_, facility]) => {
    return facility === address[1];
  });
  if (testAddressItem2.length === 0) {
    return true;
  }
  return false;
}
