// ============================================================
// SHINE CRAFT TECHNOLOGY
// File: MessageQueue.gs
// Purpose: Queue management — Chrome Extension polls this sheet
// ============================================================

/**
 * MessageQueue — manages the "Message Queue" spreadsheet sheet.
 *
 * Queue Sheet Columns (A → M):
 *   A  queueId       Unique ID for this queue entry
 *   B  rowIndex      Source data row
 *   C  name          Candidate name
 *   D  phone         Formatted E.164 phone
 *   E  email         Candidate email
 *   F  domain        Internship domain
 *   G  status        Recruitment status
 *   H  message       Full WhatsApp message text
 *   I  waLink        Pre-filled wa.me URL
 *   J  queuedAt      ISO timestamp when queued
 *   K  deliveryStatus  PENDING | SENT | FAILED
 *   L  sentAt        ISO timestamp when sent/failed
 *   M  failReason    Error reason if FAILED
 */
if (typeof MessageQueue === 'undefined') {
  MessageQueue = (() => {

    const QUEUE_COLS = {
    QUEUE_ID:        1,
    ROW_INDEX:       2,
    NAME:            3,
    PHONE:           4,
    EMAIL:           5,
    DOMAIN:          6,
    STATUS:          7,
    MESSAGE:         8,
    WA_LINK:         9,
    QUEUED_AT:       10,
    DELIVERY_STATUS: 11,
    SENT_AT:         12,
    FAIL_REASON:     13,
  };

  function _getSheet() {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    return ss.getSheetByName(CONFIG.QUEUE_SHEET);
  }

  function _generateId() {
    return 'Q' + new Date().getTime() + Math.floor(Math.random() * 1000);
  }

  /**
   * Adds a new entry to the queue.
   * @param {Object} entry
   * @returns {string} queueId
   */
  function push(entry) {
    const sheet   = _getSheet();
    const queueId = _generateId();

    sheet.appendRow([
      queueId,
      entry.rowIndex,
      entry.name,
      entry.phone,
      entry.email,
      entry.domain,
      entry.status,
      entry.message,
      entry.waLink,
      entry.timestamp,
      'PENDING',
      '',
      '',
    ]);

    const lastRow = sheet.getLastRow();
    _styleQueueRow(sheet, lastRow, 'PENDING');

    Logger.log(`[Queue] Pushed ${queueId} for ${entry.name} (${entry.status})`);
    return queueId;
  }

  /**
   * Returns all PENDING queue entries as an array of objects.
   * Called by Chrome Extension via the Web App doGet endpoint.
   * @returns {Object[]}
   */
  function getPending() {
    const sheet = _getSheet();
    const last  = sheet.getLastRow();
    if (last <= 1) return [];

    const data = sheet.getRange(2, 1, last - 1, 13).getValues();
    const c    = QUEUE_COLS;

    return data
      .filter(row => row[c.DELIVERY_STATUS - 1] === 'PENDING' && row[c.QUEUE_ID - 1])
      .map(row => ({
        queueId:        row[c.QUEUE_ID - 1],
        rowIndex:       row[c.ROW_INDEX - 1],
        name:           row[c.NAME - 1],
        phone:          row[c.PHONE - 1],
        email:          row[c.EMAIL - 1],
        domain:         row[c.DOMAIN - 1],
        status:         row[c.STATUS - 1],
        message:        row[c.MESSAGE - 1],
        waLink:         row[c.WA_LINK - 1],
        queuedAt:       row[c.QUEUED_AT - 1],
        deliveryStatus: row[c.DELIVERY_STATUS - 1],
      }));
  }

  /**
   * Marks a queued entry as SENT.
   * @param {string} queueId
   */
  function markSent(queueId) {
    _updateRow(queueId, 'SENT', new Date().toISOString(), '');
  }

  /**
   * Marks a queued entry as FAILED.
   * @param {string} queueId
   * @param {string} reason
   */
  function markFailed(queueId, reason) {
    _updateRow(queueId, 'FAILED', new Date().toISOString(), reason || 'Unknown error');
  }

  function _updateRow(queueId, status, sentAt, reason) {
    const sheet = _getSheet();
    const last  = sheet.getLastRow();
    if (last <= 1) return;

    const ids = sheet.getRange(2, QUEUE_COLS.QUEUE_ID, last - 1, 1).getValues();

    for (let i = 0; i < ids.length; i++) {
      if (ids[i][0] === queueId) {
        const dataRow = i + 2;
        sheet.getRange(dataRow, QUEUE_COLS.DELIVERY_STATUS).setValue(status);
        sheet.getRange(dataRow, QUEUE_COLS.SENT_AT).setValue(sentAt);
        sheet.getRange(dataRow, QUEUE_COLS.FAIL_REASON).setValue(reason);
        _styleQueueRow(sheet, dataRow, status);
        return;
      }
    }

    Logger.log(`[Queue] WARNING: queueId "${queueId}" not found for update.`);
  }

  function _styleQueueRow(sheet, row, status) {
    const range = sheet.getRange(row, 1, 1, 13);
    const colors = { PENDING: '#FFF9C4', SENT: '#C8E6C9', FAILED: '#FFCDD2' };
    range.setBackground(colors[status] || '#FFFFFF');

    const statusCell = sheet.getRange(row, QUEUE_COLS.DELIVERY_STATUS);
    const fontColors = { PENDING: '#F57F17', SENT: '#1B5E20', FAILED: '#B71C1C' };
    statusCell.setFontColor(fontColors[status] || '#000000');
    statusCell.setFontWeight('bold');
  }

  return { push, getPending, markSent, markFailed };

  })();
}


// ── Sheet bootstrap (called from initialSetup) ──────────────
function setupQueueSheet(sheet) {
  // Allow calling this function directly from the editor without args.
  if (!sheet) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    sheet = ss.getSheetByName(CONFIG.QUEUE_SHEET) || ss.insertSheet(CONFIG.QUEUE_SHEET);
  }
  sheet.getRange(1, 1, 1, 13).setValues([[
    'Queue ID', 'Row Index', 'Name', 'Phone', 'Email',
    'Domain', 'Status', 'Message', 'WA Link', 'Queued At',
    'Delivery Status', 'Sent At', 'Fail Reason',
  ]]);

  const header = sheet.getRange(1, 1, 1, 13);
  header.setBackground('#1A237E');
  header.setFontColor('#FFFFFF');
  header.setFontWeight('bold');
  header.setFontSize(11);

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(8, 400);
  sheet.setColumnWidth(9, 300);
  sheet.setFrozenRows(1);
  sheet.setTabColor('#1565C0');
}