class SpreadSheetBatchUpdate{
  constructor(){

  }
  /**
   * @param {Object} batchUpdateRequest Request body.
   * @param {string} spreadsheetId Spreadsheet ID.
   * @return {Object} Sheet object.
   */
  execBatchUpdate_(batchUpdateRequest, spreadsheetId){
    return Sheets.Spreadsheets.batchUpdate(batchUpdateRequest, spreadsheetId).updatedSpreadsheet.sheets;
  }
  editBatchUpdateRequest(requests){
    return {
      requests: requests,
      includeSpreadsheetInResponse: true,
    }
  }
  /**
   * @param {Object} sheets Sheet object.
   * @param {string} sheetName Name of the sheet to be extracted.
   * @return {Object} Sheet object.
   */
  getSheetBySheetName_(sheets, sheetName){
    return sheets.filter(x => x.properties.title === sheetName)[0];
  }
  /**
   * @param {Object} sheets Sheet object.
   * @param {string} sheetId Id of the sheet to be extracted.
   * @return {Object} Sheet object.
   */
  getSheetBySheetId_(sheets, sheetId){
    return sheets.filter(x => x.properties.sheetId === sheetId)[0];
  }
  getSheetIdFromSheetName_(sheets, sheetName){
    return sheets.map(x => x.properties.title === sheetName ? x.properties.sheetId : null).filter(x => x)[0];
  }
  getCellWrapRequest(sheetId){
    return {
      'repeatCell': {
        'range': {'sheetId': sheetId},
        'cell': {
          'userEnteredFormat': {
            'wrapStrategy': 'WRAP',
            'verticalAlignment': 'TOP',
          },
        },
        'fields': 'userEnteredFormat.wrapStrategy,userEnteredFormat.verticalAlignment',
      }
    }
  }
  getAutoResizeRowRequest(sheetId, startIndex, endIndex){
    return {
      'autoResizeDimensions': {
        'dimensions': {
          'sheetId': sheetId,
          'dimension': 'ROWS',
          'startIndex': startIndex,
          'endIndex' : endIndex,
        },
      }
    }

  }
  getSetRowHeightRequest(sheetId, height=21, startIndex, endIndex){
    return {
      'updateDimensionProperties': {
        'range': {
          'sheetId': sheetId,
          'dimension': 'ROWS',
          'startIndex': startIndex,
          'endIndex' : endIndex,
        },
        'properties': {
          'pixelSize' : height,
        },
        'fields': 'pixelSize',
      }
    }
  }
  getSetColWidthRequest(sheetId, width=120, startIndex, endIndex){
    return {
      'updateDimensionProperties': {
        'range': {
          'sheetId': sheetId,
          'dimension': 'COLUMNS',
          'startIndex': startIndex,
          'endIndex' : endIndex,
        },
        'properties': {
          'pixelSize' : width,
        },
        'fields': 'pixelSize',
      }
    }
  }
  getRangeSetValueRequest(sheetId, startRowIndex, startColumnIndex, values){
    return { 
      'updateCells': {
        'range': this.getRangeGrid_(sheetId, startRowIndex, startColumnIndex, values),
        'rows': this.editSetValues_(values),
        'fields': 'userEnteredValue',
      }
    };
  }
  editRenameSheetRequest(sheetId, title){
    return {
      'updateSheetProperties': {
        'properties': {
          'sheetId': sheetId,
          'title': title,
        },
        'fields': 'title',
      },
    }
  }
  editSetValues_(testValues){
    const arr = testValues.map(row => {
      const cols = row.map(col => {
        const obj = {};
        obj.userEnteredValue = {};
        col = col === null ? '' : col;
        const type = col === true || col === false ? 'boolValue' 
                     : Number.isFinite(col) ? 'numberValue'
                     : toString.call(col) === '[object Date]' ? 'numberValue'
                     : col.substring(0, 1) === '=' ? 'formulaValue'
                     : 'stringValue';
        obj.userEnteredValue[type] = col;  
        return obj;
      });
      const values = {};
      values.values = cols;
      return values;
    });
    return arr;
  }
  getRangeGrid_(sheetId, startRowIndex, startColumnIndex, values){
    const endRowIndex = startRowIndex + values.length;
    const endColumnIndex = startColumnIndex + values[0].length;
    return {
      'sheetId': sheetId,
      'startRowIndex': startRowIndex,
      'endRowIndex': endRowIndex,
      'startColumnIndex': startColumnIndex,
      'endColumnIndex': endColumnIndex
    }
  }
  /**
   * @param {number} spreadsheetId
   * @param {number} sheetId
   * @param {string} title Sheet name to be set.
   * @return {Object} Sheet object.
   */
  renameSheet(spreadsheetId, sheetId, title){
    const batchUpdateRequest = 
    {
      'requests': [
        {
          'updateSheetProperties': {
            'properties': {
              'sheetId': sheetId,
              'title': title,
            },
            'fields': 'title',
          },
        },
      ],
      'includeSpreadsheetInResponse': true,
    };
    const sheets = Sheets.Spreadsheets.batchUpdate(batchUpdateRequest, spreadsheetId).updatedSpreadsheet.sheets;
    return sheets.filter(x => x.properties.title === title)[0];
  }
  rangeGetValue(spreadsheetId, range, valueRenderOption='FORMATTED_VALUE'){
    const param = 
    {
      ranges: range,
      valueRenderOption: valueRenderOption
    };
    const values = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, param);
    return values.valueRanges;
  }
  getValueRangesValue(spreadsheetId, range, valueRenderOption='FORMATTED_VALUE'){
    const valueRanges = this.rangeGetValue(spreadsheetId, range, valueRenderOption);
    return valueRanges[0].values[0][0];
  }
}
