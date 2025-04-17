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
    const groupAuthor = getGroupAuthor_(guiRow);
    const guiAddress = getGuiAddress_(guiValue, groupAuthor);
    const outputAddress = getOutputAddress_(outputValue, groupAuthor);
    const uniqueGuiAddress = getUniqueGuiAddress_(guiAddress);

    outputAddress.forEach(address => {
      // GUI側の出力にエラーがあるため無視するレコード
      if (
        (wosId === 'WOS:001162123600001' && address[0] === 'Nishimura K') ||
        (wosId === 'WOS:001162123600001' &&
          address[0] === 'Matsuhisa M; Meguro S') ||
        (wosId === 'WOS:001162123600001' && address[0] === 'Kouyama R') ||
        wosId === 'WOS:001283232400002' ||
        (wosId === 'WOS:001382600700002' &&
          address[0] === 'Satomi K; Takatsuki S') ||
        (wosId === 'WOS:001354231300040' &&
          address[0] === 'Namba S; Sonehara K; Okada Y') ||
        (wosId === 'WOS:001381238200026' && address[0] === 'Matsuda K') ||
        (wosId === 'WOS:001381238200026' && address[0] === 'Murakami Y') ||
        (wosId === 'WOS:001383183700001' &&
          address[0] === 'Kawaguchi M; Hayashi M') ||
        (wosId === 'WOS:001383183700001' &&
          address[0] === 'Kadono T; Fujimoto M') ||
        (wosId === 'WOS:001085123400001' && address[0] === 'Mannami T')
      ) {
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
function getGroupAuthor_(guiRow) {
  return guiRow[guiColIndexMap.get('groupAuthor')]
    .split(';')
    .map(x => x.trim());
}
function compareAuthors_(guiRow, guiValue, outputValue) {
  const groupAuthor = getGroupAuthor_(guiRow);
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
function splitAddress_(address) {
  return address.split('; ');
}

function compareAddress_(uniqueGuiAddress, address) {
  // 完全一致か
  const guiAddressItem = uniqueGuiAddress.filter(x => x[0] === address[0]);
  if (guiAddressItem.length !== 0) {
    const guiAddressItemFacility = guiAddressItem.filter(
      x => x[1] === address[1]
    );
    return guiAddressItemFacility.length === 0;
  }

  const authors = splitAddress_(address[0]);
  // 完全一致するものがない場合、特殊文字を置換して再検索
  const authorCombinations = getReplaceSpecialCharactersAuthors_(
    authors,
    address
  );
  const uniqueGuiAddressSplitByAuthors = uniqueGuiAddress.map(
    ([author, facility]) => [splitAddress_(author), facility]
  );
  let checkFlag = false;
  for (const [guiAuthors, facility] of uniqueGuiAddressSplitByAuthors) {
    // GUI側に重複著者がいる場合重複を削除して比較する
    const uniqueGuiAuthors = [...new Set(guiAuthors)];
    for (const outputAuthors of authorCombinations) {
      if (
        uniqueGuiAuthors.length === outputAuthors.length &&
        uniqueGuiAuthors.every(author => outputAuthors.includes(author))
      ) {
        if (facility === address[1]) {
          checkFlag = true;
          break;
        }
      }
    }
    if (checkFlag) {
      break;
    }
  }
  if (checkFlag) {
    return false;
  }

  // 著者順が異なるレコードを許容する
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
function cartesianProduct_(arrays) {
  return arrays.reduce(
    (acc, curr) => {
      const result = [];
      for (const a of acc) {
        for (const c of curr) {
          result.push([...a, c]);
        }
      }
      return result;
    },
    [[]]
  ); // 初期値は空の配列1つ（1組）
}
function getReplaceSpecialCharactersAuthors_(authors, address) {
  const specialCharCheck = specialCharacters.get('keys').some(key => {
    const regex = new RegExp(key, 'g');
    return address[0].match(regex) !== null;
  });
  let authorCombinations = [];
  if (specialCharCheck) {
    const replaceAuthors = authors.map(author =>
      replaceSpecialCharacters_(author)
    );
    authorCombinations = cartesianProduct_(replaceAuthors);
  } else {
    authorCombinations.push(authors);
  }
  return authorCombinations;
}
