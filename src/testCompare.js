function execCompareByColumn_(value, key, guiRow, outputRow, wosId) {
  let errorMessage = '';
  const guiValue = guiRow[guiColIndexMap.get(key)];
  const outputValue = outputRow[value];
  if (key === 'author') {
    const res = compareAuthors_(guiRow, guiValue, outputValue);
    if (res === null) {
      return;
    }
    errorMessage = `WOS ID ${wosId} の著者情報が一致しません。GUI: ${res.guiAuthor} スプレッドシート: ${res.outputAuthor}`;
  } else if (key === 'publicationMonth') {
    const error_f = comparePublicationMonth_(guiValue, outputValue);
    if (!error_f) {
      return;
    }
    errorMessage = `WOS ID ${wosId} の月情報が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`;
  } else if (key === 'title') {
    const error_f = compareTitle_(guiValue, outputValue);
    if (!error_f) {
      return;
    }
    errorMessage = `WOS ID ${wosId} のタイトル情報が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`;
  } else if (key === 'page') {
    const guiPage = guiValue === '-' ? '' : guiValue;
    if (guiPage === outputValue) {
      return;
    }
    errorMessage = `WOS ID ${wosId} のページ情報が一致しません。GUI: ${guiPage} スプレッドシート: ${outputValue}`;
  } else if (key === 'docType') {
    const error_f = compareDocType_(guiValue, outputValue);
    if (!error_f) {
      return;
    }
    errorMessage = `WOS ID ${wosId} の文献種別情報が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`;
  } else if (key === 'publicationName') {
    const guiPublicationName = guiValue.replace(/\./g, '');
    if (guiPublicationName === outputValue) {
      return;
    }
    errorMessage = `WOS ID ${wosId} の雑誌名情報が一致しません。GUI: ${guiPublicationName} スプレッドシート: ${outputValue}`;
  } else if (key === 'pubmedId') {
    if (String(guiValue) === String(outputValue)) {
      return;
    }
    errorMessage = `WOS ID ${wosId} のPubMed IDが一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`;
  } else if (key === 'addresses') {
    const guiAddress = getGuiAddress_(guiValue);
    const outputAddress = getOutputAddress_(outputValue);
    const uniqueGuiAddress = getUniqueGuiAddress_(guiAddress, outputAddress);
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
      if (wosId === 'WOS:001156433100009' && address[0] === 'HepatoBiliary P') {
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
      if (!error_f) {
        return;
      }
      errorMessage = `WOS ID ${wosId} のアドレス情報が一致しません。GUI: ${uniqueGuiAddress} スプレッドシート: ${address}`;
    });
  } else {
    if (guiValue === outputValue) {
      return;
    }
    errorMessage = `WOS ID ${wosId} の ${key} が一致しません。GUI: ${guiValue} スプレッドシート: ${outputValue}`;
  }
  if (errorMessage !== '') {
    throw new Error(errorMessage);
  }
}
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
