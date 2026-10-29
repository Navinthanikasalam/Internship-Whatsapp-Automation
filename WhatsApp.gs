// ============================================================
// SHINE CRAFT TECHNOLOGY  |  WhatsApp.gs  |  v3.0
// Queue API — used by DoGet/DoPost (Chrome Extension polls this).
// ============================================================

var WA_QUEUE_HEADERS = [
  'QueueId','CreatedAt','RowSource','Name','Phone','Message',
  'EventType','TriggerColumn','OldValue','NewValue',
  'Status','Attempts','FailedReason','SentAt'
];

function _waGetSpreadsheet() {
  var id = (typeof CONFIG !== 'undefined' && CONFIG.SPREADSHEET_ID) ? CONFIG.SPREADSHEET_ID : null;
  if (!id) throw new Error('[WA] CONFIG.SPREADSHEET_ID missing');
  return SpreadsheetApp.openById(id);
}

function _waGetQueueSheet() {
  var ss   = _waGetSpreadsheet();
  var name = (typeof CONFIG !== 'undefined' && CONFIG.QUEUE_SHEET) ? CONFIG.QUEUE_SHEET : 'Message Queue';
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureQueueSheet() {
  var sheet    = _waGetQueueSheet();
  var existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, WA_QUEUE_HEADERS.length).getValues()[0]
    : [];
  var normEx = existing.map(function(h){ return (h||'').toString().trim().toLowerCase(); }).join('|');
  var normEx2 = WA_QUEUE_HEADERS.map(function(h){ return h.toLowerCase(); }).join('|');
  if (normEx !== normEx2) {
    sheet.clear();
    sheet.getRange(1, 1, 1, WA_QUEUE_HEADERS.length).setValues([WA_QUEUE_HEADERS]);
    sheet.setFrozenRows(1);
    try { sheet.setColumnWidths(1, WA_QUEUE_HEADERS.length, 160); } catch(e) {}
  }
  return sheet;
}

function _waColIdx(sheet, name) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  for (var i = 0; i < headers.length; i++) {
    if ((headers[i]||'').toString().trim().toLowerCase() === name.toLowerCase()) return i + 1;
  }
  return -1;
}

function queueMessage(payload) {
  var sheet = ensureQueueSheet();
  var id    = 'Q' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
  var map   = {
    QueueId:       id,
    CreatedAt:     new Date().toISOString(),
    RowSource:     (payload.rowSource || payload.rowIndex || '').toString(),
    Name:          payload.name          || '',
    Phone:         payload.phone         || '',
    Message:       payload.message       || '',
    EventType:     payload.eventType     || '',
    TriggerColumn: payload.triggerColumn || '',
    OldValue:      payload.oldValue      || '',
    NewValue:      payload.newValue      || '',
    Status:        'PENDING',
    Attempts:      0,
    FailedReason:  '',
    SentAt:        '',
  };
  sheet.appendRow(WA_QUEUE_HEADERS.map(function(h){ return map[h] !== undefined ? map[h] : ''; }));
  Logger.log('[WA] Queued ' + id + ' phone=' + (payload.phone || ''));
  return id;
}

function getPendingMessages(limit) {
  var sheet   = ensureQueueSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var rows      = sheet.getRange(2, 1, lastRow - 1, WA_QUEUE_HEADERS.length).getValues();
  var statusIdx = _waColIdx(sheet, 'Status') - 1;
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var s = (r[statusIdx] || '').toString().trim();
    if (s === 'PENDING' || s === 'QUEUED') {
      out.push({
        queueId:       r[0], createdAt: r[1], rowSource: r[2],
        name:          r[3], phone:     r[4], message:   r[5],
        eventType:     r[6], status:    r[10],
        attempts:      Number(r[11] || 0),
      });
      if (limit && out.length >= limit) break;
    }
  }
  return out;
}

function _waFindRow(sheet, queueId) {
  var idIdx = _waColIdx(sheet, 'QueueId');
  if (idIdx < 0) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var vals = sheet.getRange(2, idIdx, lastRow - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if ((vals[i][0] || '') === queueId) return i + 2;
  }
  return -1;
}

function markMessageAsSent(queueId) {
  var sheet  = ensureQueueSheet();
  var rowNum = _waFindRow(sheet, queueId);
  if (rowNum < 2) return false;
  sheet.getRange(rowNum, _waColIdx(sheet, 'Status')).setValue('SENT');
  sheet.getRange(rowNum, _waColIdx(sheet, 'SentAt')).setValue(new Date().toISOString());
  return true;
}

function markMessageAsFailed(queueId, reason) {
  var sheet  = ensureQueueSheet();
  var rowNum = _waFindRow(sheet, queueId);
  if (rowNum < 2) return false;
  var attCol  = _waColIdx(sheet, 'Attempts');
  var failCol = _waColIdx(sheet, 'FailedReason');
  sheet.getRange(rowNum, _waColIdx(sheet, 'Status')).setValue('FAILED');
  if (attCol > 0) {
    var cur = Number(sheet.getRange(rowNum, attCol).getValue() || 0);
    sheet.getRange(rowNum, attCol).setValue(cur + 1);
  }
  if (failCol > 0) sheet.getRange(rowNum, failCol).setValue(reason || 'Unknown');
  return true;
}

function countQueueStatus(status) {
  var sheet     = ensureQueueSheet();
  var statusCol = _waColIdx(sheet, 'Status');
  if (statusCol < 0) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  var vals = sheet.getRange(2, statusCol, lastRow - 1, 1).getValues();
  var c = 0;
  for (var i = 0; i < vals.length; i++) { if ((vals[i][0]||'') === status) c++; }
  return c;
}

// Global export — var ensures it's visible across all .gs files
var WhatsApp = {
  ensureQueueSheet:    ensureQueueSheet,
  queueMessage:        queueMessage,
  getPendingMessages:  getPendingMessages,
  markMessageAsSent:   markMessageAsSent,
  markMessageAsFailed: markMessageAsFailed,
  countQueueStatus:    countQueueStatus,
};