// ============================================================
// SHINE CRAFT TECHNOLOGY  |  Code.gs  |  v3.0
// Menu and setup entrypoints for the spreadsheet automation.
// ============================================================

// ── Menu ─────────────────────────────────────────────────────

function onOpen() {
  try {
    ensureAutomationTriggers();

    SpreadsheetApp.getUi().createMenu('ShineCraft ATS')
      .addItem('1. Install Automation', 'installAutomation')
      .addItem('2. Clear Sent Cache',   'clearSentCache')
      .addItem('3. Preview Log Sheet',  'manualDashboardRefresh')
      .addItem('4. Run Column Audit',   'auditWorkflowCoverage')
      .addItem('5. DEBUG: Test Column Triggers', 'debugTestColumnTriggers')
      .addItem('6. Run Queue Test',     'runQueueTest')
      .addSeparator()
      .addItem('🔍 DEBUG: Message Queue Analysis', 'debugMessageQueue')
      .addItem('🔍 DEBUG: Inspect Row Data', 'inspectRowData')
      .addItem('🔍 DEBUG: Test Single Column', 'testSingleColumnChange')
      .addToUi();
  } catch (err) {
    Logger.log('[Code] onOpen: ' + err.message);
  }
}

// ── Install (run once) ────────────────────────────────────────

function installAutomation() {
  try {
    validateConfig();

    // Ensure all sheets exist
    var dataSheet = getSheet(CONFIG.DATA_SHEET);
    ensureDesignationDropdown(dataSheet);
    ensureQueueSheet();
    getSheet(CONFIG.LOG_SHEET);
    getSheet(CONFIG.DASHBOARD_SHEET);

    ensureAutomationTriggers();
    Logger.log('[Code] installAutomation complete');
    safeAlert('✅ Installation complete!\n\nSheets created, triggers installed.\n\nNext step: Deploy as Web App and paste the URL into the Chrome Extension config.js');
  } catch (err) {
    Logger.log('[Code] installAutomation error: ' + err.message);
    safeAlert('❌ Error: ' + err.message);
  }
}

function ensureAutomationTriggers() {
  try {
    const existing = ScriptApp.getProjectTriggers() || [];
    const hasEdit = existing.some(function (t) { return t.getHandlerFunction() === 'onEditTrigger'; });
    const hasForm = existing.some(function (t) { return t.getHandlerFunction() === 'onFormSubmitTrigger'; });
    const hasReminder = existing.some(function (t) { return t.getHandlerFunction() === 'checkDeadlineReminders'; });

    if (hasEdit && hasForm && hasReminder) {
      Logger.log('[Code] Automation triggers already installed');
      return;
    }

    Logger.log('[Code] Missing automation triggers — installing now');
    setupTriggers();
  } catch (err) {
    Logger.log('[Code] ensureAutomationTriggers error: ' + err.message);
  }
}

// ── Utility helpers ───────────────────────────────────────────

function safeAlert(msg) {
  try { SpreadsheetApp.getUi().alert(msg); }
  catch (_) { Logger.log('[safeAlert] ' + msg); }
}

function clearSentCache() {
  var props = PropertiesService.getScriptProperties();
  var keys  = props.getKeys().filter(function(k){ return k.indexOf(CONFIG.CACHE_PREFIX) === 0; });
  keys.forEach(function(k){ props.deleteProperty(k); });
  safeAlert('Cleared ' + keys.length + ' cached entries.');
}

function runQueueTest() {
  try {
    const sheet = getSheet(CONFIG.DATA_SHEET);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      safeAlert('No data rows found to test.');
      return;
    }

    const testRow = lastRow;
    const testCol = getColumnIndexByHeader(sheet, CONFIG.HEADERS.INTERVIEW_1_SCHEDULED);
    if (!testCol) {
      safeAlert('Level 1 Schedule column was not found.');
      return;
    }

    const oldValue = sheet.getRange(testRow, testCol).getValue();
    const newValue = 'MANUAL TEST ' + new Date().toLocaleString();
    sheet.getRange(testRow, testCol).setValue(newValue);
    handleWorkflowEvent(sheet, testRow, 'Level 1 Schedule', oldValue, newValue);

    safeAlert('Queue test started for row ' + testRow + '. Check the Message Queue sheet and Apps Script logs.');
    Logger.log('[Code] runQueueTest -> row=' + testRow + ' col=' + testCol + ' old=' + oldValue + ' new=' + newValue);
  } catch (err) {
    Logger.log('[Code] runQueueTest error: ' + err.message);
    safeAlert('❌ Queue test failed: ' + err.message);
  }
}

function manualDashboardRefresh() {
  safeAlert('Log sheet is at: ' + CONFIG.LOG_SHEET);
}

// ── DEBUG: Test column triggers ──────────────────────────────

function debugTestColumnTriggers() {
  try {
    var sheet = getSheet(CONFIG.DATA_SHEET);
    var lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      safeAlert('No data rows found to test.');
      return;
    }

    // Test the last data row (usually the most recent applicant)
    var testRow = lastRow;
    var rowData = sheet.getRange(testRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Extract candidate data
    var candidate = readCandidateFromRow(sheet, testRow);
    
    Logger.log('\n' + '='.repeat(60));
    Logger.log('[DEBUG] Testing row ' + testRow);
    Logger.log('='.repeat(60));
    Logger.log('Candidate Name: ' + candidate.name);
    Logger.log('Candidate Phone: ' + candidate.phone);
    Logger.log('Phone exists: ' + (candidate.phone ? 'YES ✅' : 'NO ❌'));
    
    // Check key columns
    var level1Col = getColumnIndexByHeader(sheet, CONFIG.HEADERS.INTERVIEW_1_SCHEDULED);
    var enrolledCol = getColumnIndexByHeader(sheet, CONFIG.HEADERS.ENROLLED_STATUS);
    
    Logger.log('\n[COLUMNS]');
    Logger.log('Level 1 Schedule column: ' + (level1Col ? 'Found at column ' + level1Col + ' ✅' : 'NOT FOUND ❌'));
    Logger.log('Enrolled Status column: ' + (enrolledCol ? 'Found at column ' + enrolledCol + ' ✅' : 'NOT FOUND ❌'));
    
    if (level1Col) {
      var level1Value = sheet.getRange(testRow, level1Col).getValue();
      Logger.log('Level 1 Schedule value: "' + level1Value + '"');
    }
    
    if (enrolledCol) {
      var enrolledValue = sheet.getRange(testRow, enrolledCol).getValue();
      Logger.log('Enrolled Status value: "' + enrolledValue + '"');
    }
    
    // Check workflow rules
    Logger.log('\n[WORKFLOW RULES]');
    var rule1 = getWorkflowRule('Level 1 Schedule');
    var ruleEnrolled = getWorkflowRule('Enrolled Status');
    
    Logger.log('Level 1 Schedule rule: ' + (rule1 ? JSON.stringify(rule1) : 'NOT FOUND ❌'));
    Logger.log('Enrolled Status rule: ' + (ruleEnrolled ? JSON.stringify(ruleEnrolled) : 'NOT FOUND ❌'));
    
    Logger.log('='.repeat(60) + '\n');
    
    safeAlert('✅ DEBUG INFO LOGGED\n\nCheck AppScript Logs (Cmd+Enter) for details:\n\n' +
              '• Candidate: ' + candidate.name + '\n' +
              '• Phone: ' + (candidate.phone ? candidate.phone : 'MISSING ❌') + '\n' +
              '• Level 1 Schedule: ' + (level1Col ? 'Found' : 'Missing') + '\n' +
              '• Enrolled Status: ' + (enrolledCol ? 'Found' : 'Missing'));
  } catch (err) {
    Logger.log('[DEBUG] Error: ' + err.message);
    safeAlert('❌ Error: ' + err.message);
  }
}

function ensureDesignationDropdown(sheet) {
  var designationColumn = getColumnIndexByHeader(sheet, CONFIG.HEADERS.DESIGNATION);
  if (!designationColumn || !CONFIG.DESIGNATION_OPTIONS || !CONFIG.DESIGNATION_OPTIONS.length) {
    Logger.log('[Code] Designation header not found; dropdown not applied');
    return false;
  }

  var rowCount = Math.max(sheet.getMaxRows() - 1, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.DESIGNATION_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, designationColumn, rowCount, 1).setDataValidation(rule);
  Logger.log('[Code] Designation dropdown applied to column ' + designationColumn);
  return true;
}