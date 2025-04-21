const specialCharacters = getSpecialCharactersArray_();
function test() {
  getSpecialCharactersArray_();
}
function createReplaceSpecialCharacterArray_(
  fromLower,
  fromUpper,
  toLowerArray,
  toUpperArray
) {
  const lowerArray = toLowerArray.map(x => [fromLower, x]);
  const upperArray = toUpperArray.map(x => [fromUpper, x]);
  const array = lowerArray
    .map(arr => {
      const res = upperArray.map(arr2 => [arr, arr2]);
      return res;
    })
    .flat();
  return array;
}
function getSpecialCharactersArray_() {
  // 特殊文字リスト
  const u_umulautLower = 'ü';
  const u_umulautUpper = 'Ü';
  const u_umulautArray = createReplaceSpecialCharacterArray_(
    u_umulautLower,
    u_umulautUpper,
    ['u', 'ue'],
    ['U', 'UE']
  );

  const o_umulautLower = 'ö';
  const o_umulautUpper = 'Ö';
  const o_umulautArray = createReplaceSpecialCharacterArray_(
    o_umulautLower,
    o_umulautUpper,
    ['o', 'oe'],
    ['O', 'OE']
  );
  const specialCharactersUmulautArray = u_umulautArray
    .map(arr => {
      const res = o_umulautArray.map(arr2 => [...arr, ...arr2]);
      return res;
    })
    .flat();
  const specialCharactersArray = [
    ['ä', 'a'],
    ['ß', 'ss'],
    ['Ä', 'A'],
    ['ñ', 'n'],
    ['Ñ', 'N'],
    ['é', 'e'],
    ['É', 'E'],
    ['í', 'i'],
    ['Í', 'I'],
    ['á', 'a'],
    ['Á', 'A'],
    ['ó', 'o'],
    ['Ó', 'O'],
    ['ú', 'u'],
    ['Ú', 'U'],
    ['â', 'a'],
    ['ê', 'e'],
    ['î', 'i'],
    ['ô', 'o'],
    ['û', 'u'],
    ['Â', 'A'],
    ['Ê', 'E'],
    ['Î', 'I'],
    ['ç', 'c'],
    ['Ç', 'C'],
    ['ñ', 'n'],
    ['Ñ', 'N'],
    ['ý', 'y'],
    ['Ý', 'Y'],
    ['ø', 'o'],
    ['Ø', 'O'],
  ];
  const specialCharactersKeys = specialCharactersArray.map(([key, _]) => key);
  specialCharactersKeys.push(u_umulautLower);
  specialCharactersKeys.push(u_umulautUpper);
  specialCharactersKeys.push(o_umulautLower);
  specialCharactersKeys.push(o_umulautUpper);
  const res = new Map();
  res.set('keys', specialCharactersKeys);
  const array = new Set();
  specialCharactersUmulautArray.forEach(x => {
    const arr = [...specialCharactersArray, ...x];
    array.add(arr);
  });
  res.set('values', array);
  return res;
}
// ウムラウトなどの特殊文字を含む場合、正規表現で置換する
function replaceSpecialCharacters_(str) {
  const specialCharactersArray = Array.from(specialCharacters.get('values'));
  const replaceValue = specialCharactersArray.map(array => {
    let replaceStr = str;
    for (const [key, value] of array) {
      const regex = new RegExp(key, 'g');
      replaceStr = replaceStr.replace(regex, value);
    }
    return replaceStr;
  });
  // 重複を削除する
  const uniqueRes = new Set(replaceValue);
  // Setを配列に変換して返す
  const uniqueArray = Array.from(uniqueRes);
  return uniqueArray;
}
function editAddressForCompare_(value) {
  return value
    .replace(/^\[/, '')
    .split('; [')
    .map(x => x.split('] '));
}
function getGuiAddress_(guiValue, groupAuthor) {
  const addressValues = editAddressForCompare_(guiValue);
  const guiAddress = addressValues
    .map(([names, facilities]) => {
      //const tempNames = replaceSpecialCharacters_(names);
      const tempNames = removeGroupAuthor_(names, groupAuthor);
      if (tempNames === '') {
        return null;
      }
      const nameArray = tempNames.split(';').map(x => x.split(','));
      const initialNameArray = nameArray.map(([sei, mei]) => {
        const tempSei =
          sei.split(' ').length > 2 ? removeNamePrefix_(sei) : sei;
        const tempSei2 = tempSei.trim().split(' ');
        // 旧姓は切り捨てる
        const outputSei = tempSei2.length > 1 ? tempSei2[1] : tempSei.trim();
        // 名前の頭文字を取得
        const outputMei = mei === undefined ? '' : mei.trim().charAt(0);
        return `${outputSei} ${outputMei}`;
      });
      const joinNames = initialNameArray.join('; ');
      return [joinNames, facilities];
    })
    .filter(x => x !== null);
  return guiAddress;
}
function removeNamePrefix_(fullName) {
  const prefixes = [
    'van den',
    'Van Den',
    'Van den',
    'van Den',
    'bin abd',
    'bin Abd',
    'Bin Abd',
    'Bin abd',
    'de',
    'De',
    'van',
    'Van',
    'von',
    'Von',
    'da',
    'Da',
    'di',
    'Di',
    'del',
    'Del',
    'la',
    'La',
    'le',
    'Le',
    'al',
    'Al',
  ];

  // スペースで区切られた単語として一致するように分割して処理
  const words = fullName.split(' ');
  const cleaned = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const next = words[i + 1];
    const twoWordPrefix = `${current} ${next}`;
    if (prefixes.includes(twoWordPrefix)) {
      i++; // 2単語前置詞をスキップ
      continue;
    }
    if (!prefixes.includes(current)) {
      cleaned.push(words[i]);
    }
  }

  return cleaned.join(' ');
}

function removeGroupAuthor_(str, groupAuthor) {
  let tempNames = str;
  if (groupAuthor.length > 0 && groupAuthor[0] !== '') {
    groupAuthor.forEach(author => {
      const regex = new RegExp(author, 'g');
      tempNames = tempNames.replace(regex, '');
    });
  }
  return tempNames;
}

function getOutputAddress_(outputValue, groupAuthor) {
  const addressValues = editAddressForCompare_(outputValue);
  const outputAddress = addressValues
    .map(([names, facilities]) => {
      const tempNames = removeGroupAuthor_(names, groupAuthor);
      if (tempNames === '') {
        return null;
      }
      const namesSplit = tempNames.split('; ');
      const nameArray = namesSplit.map(x => {
        const tempName = x.split(' ').length > 2 ? removeNamePrefix_(x) : x;
        const res = tempName.split(' ');
        return res;
      });
      const initialNameArray = nameArray.map(([sei, mei]) => {
        const trimmedMei = mei === undefined ? '' : mei.trim().charAt(0);
        return `${sei.trim()} ${trimmedMei}`;
      });
      const joinNames = initialNameArray.join('; ');
      return [joinNames, facilities];
    })
    .filter(x => x !== null);
  return outputAddress;
}
function getUniqueGuiAddress_(guiAddress) {
  const removeGuiAddress = guiAddress.map(([name, facility]) => {
    const tempFacility = facility.split('; ').map(x => x.trim());
    return [name, tempFacility[0]];
  });

  const groupedGuiAddress = removeGuiAddress.reduce((acc, [name, facility]) => {
    const existing = acc.find(([n, f]) => n === name && f === facility);
    if (existing) {
      return acc;
    }
    acc.push([name, facility]);
    return acc;
  }, []);
  return groupedGuiAddress;
}
