// ============================================================
// SHINE CRAFT TECHNOLOGY  |  Trigger.gs  |  v3.0
// Installs triggers and wires every sheet event to WorkflowEngine.
// ============================================================

// ── Simple trigger wrappers ─────────────────────────────────

function onEdit(e) {
  try {
    onEditTrigger(e);
  } catch (err) {
    Logger.log('[Trigger] onEdit simple trigger error: ' + err.message);
  }
}

function onFormSubmit(e) {
  try {
    onFormSubmitTrigger(e);
  } catch (err) {
    Logger.log('[Trigger] onFormSubmit simple trigger error: ' + err.message);
  }
}

// ── Installable onEdit trigger ───────────────────────────────

function onEditTrigger(e) {
  try {
    var range  = e && e.range;
    if (!range) return;
    var sheet     = range.getSheet();
    var sheetName = sheet.getName();

    // Process the real data sheet even if its tab name differs slightly.
    var sheetNameNorm = normalizeHeaderName(sheetName);
    var dataSheetNorm  = normalizeHeaderName(CONFIG.DATA_SHEET);
    var isLikelyDataSheet = sheetNameNorm === dataSheetNorm ||
      sheetNameNorm.indexOf('whatsapp') >= 0 ||
      sheetNameNorm.indexOf('internship') >= 0 ||
      sheetNameNorm.indexOf('automation') >= 0;

    if (!isLikelyDataSheet) return;

    var rowIndex = range.getRow();
    if (rowIndex <= 1) return; // header row

    var changeType = (e && e.changeType) ? String(e.changeType).toLowerCase() : '';
    var editedCol  = range.getColumn();
    var lastCol    = sheet.getLastColumn();
    var headers    = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
    var columnHeader = (headers[editedCol - 1] || '').toString().trim();

    var oldValue = (e.oldValue !== undefined && e.oldValue !== null) ? e.oldValue : '';
    var newValue = (e.value   !== undefined && e.value   !== null)   ? e.value   :
                   sheet.getRange(rowIndex, editedCol).getValue();

    Logger.log('[Trigger] edit: sheet=' + sheetName + ' row=' + rowIndex +
               ' col=' + columnHeader + ' old="' + oldValue + '" new="' + newValue + '" changeType="' + changeType + '"');

    if (changeType === 'insert_row') {
      Logger.log('[Trigger] New row inserted — queueing application welcome message for row ' + rowIndex);
      var insertedCandidate = readCandidateFromRow(sheet, rowIndex);
      if (!insertedCandidate) {
        Logger.log('[Trigger] Inserted row could not be read — skipping queue');
        return;
      }
      handleWorkflowEvent(sheet, rowIndex, 'FORM_SUBMIT', null, null);
      return;
    }

    handleWorkflowEvent(sheet, rowIndex, columnHeader, oldValue, newValue);

  } catch (err) {
    Logger.log('[Trigger] onEditTrigger error: ' + err.message);
    try { logSystemError('onEditTrigger', err.message, err.stack || ''); } catch(_) {}
  }
}

// ── Form submit trigger ──────────────────────────────────────

function onFormSubmitTrigger(e) {
  try {
    var sheet    = e && e.range ? e.range.getSheet() : getSheet(CONFIG.DATA_SHEET);
    var rowIndex = e && e.range ? e.range.getRow()   : (sheet ? sheet.getLastRow() : null);
    if (!sheet || !rowIndex) return;

    Logger.log('[Trigger] Form submit received for sheet=' + sheet.getName() + ' row=' + rowIndex);

    var candidate = readCandidateFromRow(sheet, rowIndex);
    if (!candidate) {
      Logger.log('[Trigger] Form submit skipped: could not read row ' + rowIndex);
      return;
    }
    if (!candidate.phone) {
      Logger.log('[Trigger] Form submit skipped: no phone found for row ' + rowIndex + ' name=' + (candidate.name || 'unknown'));
      return;
    }

    handleWorkflowEvent(sheet, rowIndex, 'FORM_SUBMIT', null, null);
  } catch (err) {
    Logger.log('[Trigger] onFormSubmitTrigger error: ' + err.message);
  }
}

// ── Daily deadline reminder ───────────────────────────────────

function checkDeadlineReminders() {
  try {
    var sheet   = getSheet(CONFIG.DATA_SHEET);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;

    var deadlineIdx = getColumnIndexByHeader(sheet, CONFIG.HEADERS.TASK_DEADLINE);
    if (!deadlineIdx) return;

    for (var row = 2; row <= lastRow; row++) {
      var deadline = sheet.getRange(row, deadlineIdx).getValue();
      var days     = daysUntil(deadline);
      var candidate = readCandidateFromRow(sheet, row);
      if (!candidate || !candidate.phone) continue;

      if (days === 1) {
        var msg = generateMessage(CONFIG.EVENTS.TASK_REMINDER_1DAY, candidate, {});
        if (msg) { WhatsApp.queueMessage({ rowSource: row, name: candidate.name,
            phone: candidate.phone, message: msg, eventType: CONFIG.EVENTS.TASK_REMINDER_1DAY }); }
      } else if (days === 0) {
        var msg2 = generateMessage(CONFIG.EVENTS.TASK_REMINDER_SAME_DAY, candidate, {});
        if (msg2) { WhatsApp.queueMessage({ rowSource: row, name: candidate.name,
            phone: candidate.phone, message: msg2, eventType: CONFIG.EVENTS.TASK_REMINDER_SAME_DAY }); }
      }
    }
  } catch (err) {
    Logger.log('[Trigger] checkDeadlineReminders error: ' + err.message);
  }
}

function daysUntil(value) {
  if (!value) return -1;
  try {
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return -1;
    var today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - today.getTime()) / 86400000);
  } catch(_) { return -1; }
}

// ── Setup functions ──────────────────────────────────────────

function setupTriggers() {
  var ss = getSpreadsheet();

  // Remove stale installable triggers before recreating the correct ones.
  ScriptApp.getProjectTriggers().forEach(function(t) {
    var fn = t.getHandlerFunction();
    if (fn === 'onEditTrigger' || fn === 'onFormSubmitTrigger' || fn === 'checkDeadlineReminders') {
      ScriptApp.deleteTrigger(t);
    }
  });

  try {
    ScriptApp.newTrigger('onEditTrigger').forSpreadsheet(ss).onEdit().create();
    ScriptApp.newTrigger('onFormSubmitTrigger').forSpreadsheet(ss).onFormSubmit().create();
    ScriptApp.newTrigger('checkDeadlineReminders').timeBased().atHour(8).everyDays(1).create();
  } catch (err) {
    Logger.log('[Trigger] trigger install warning: ' + err.message);
  }

  Logger.log('[Trigger] Installable edit/form triggers recreated and reminder trigger installed');
}