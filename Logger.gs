// ============================================================
// SHINE CRAFT TECHNOLOGY  |  Logger.gs  |  v3.0
// Writes structured rows to the AUTOMATION LOG sheet.
// ============================================================

var LOG_HEADERS = [
  'Log ID','Timestamp','Candidate Name','Phone','Email',
  'Trigger Column','Old Value','New Value','Workflow Type',
  'Status','Notes','Message Length','Message Content'
];

function _ensureLogSheet() {
  var sheet = getSheet(CONFIG.LOG_SHEET);
  if (sheet.getLastRow() === 0 ||
      (sheet.getRange(1,1).getValue()||'').toString().trim() !== 'Log ID') {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);
    sheet.getRange(1, 1, 1, LOG_HEADERS.length)
      .setBackground('#004D40').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, LOG_HEADERS.length, 140);
  }
  return sheet;
}

function logMessageEvent(candidate, triggerColumn, oldValue, newValue, eventType, status, notes, message) {
  try {
    var sheet = _ensureLogSheet();
    var msg   = message || '';
    sheet.appendRow([
      'LOG' + Date.now(),
      new Date().toISOString(),
      (candidate && candidate.name)  ? candidate.name  : 'N/A',
      (candidate && candidate.phone) ? candidate.phone : 'N/A',
      (candidate && candidate.email) ? candidate.email : '',
      triggerColumn || '',
      oldValue      || '',
      newValue      || '',
      eventType     || '',
      status        || '',
      notes         || '',
      msg.length,
      msg,
    ]);
    var last   = sheet.getLastRow();
    var colors = { QUEUED:'#E3F2FD', SENT:'#E8F5E9', FAILED:'#FFEBEE',
                   DUPLICATE:'#FFF9C4', ERROR:'#FCE4EC', SKIPPED:'#F3E5F5' };
    sheet.getRange(last, 1, 1, LOG_HEADERS.length).setBackground(colors[status] || '#FFFFFF');
  } catch (err) {
    Logger.log('[Logger] logMessageEvent error: ' + err.message);
  }
}

function logSystemError(context, errorMessage, errorStack) {
  try {
    var sheet = _ensureLogSheet();
    sheet.appendRow([
      'ERR' + Date.now(), new Date().toISOString(), 'SYSTEM', '', '',
      context || '', '', '', 'SYSTEM_ERROR', 'ERROR',
      ((errorMessage || '') + ' | ' + (errorStack || '')).substring(0, 500),
      0, ''
    ]);
    var last = sheet.getLastRow();
    sheet.getRange(last, 1, 1, LOG_HEADERS.length).setBackground('#FCE4EC');
  } catch (err) {
    Logger.log('[Logger] logSystemError error: ' + err.message);
  }
}

// LoggerSystem alias used by older code paths
var LoggerSystem = {
  write: function(candidate, status, event, notes, queueId) {
    logMessageEvent(candidate, '', '', '', event, status, notes, '');
  },
  writeError: function(msg) {
    logSystemError('LoggerSystem', msg, '');
  },
  updateDelivery: function(queueId, deliveryStatus, failReason) {
    // No-op — delivery status lives in the Queue sheet
    Logger.log('[LoggerSystem] updateDelivery ' + queueId + ' -> ' + deliveryStatus);
  },
};