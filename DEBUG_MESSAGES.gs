// ============================================================
// SHINE CRAFT TECHNOLOGY  |  DEBUG_MESSAGES.gs
// Comprehensive debugging for message queuing issues
// ============================================================

function debugMessageQueue() {
  try {
    var sheet = getSheet(CONFIG.DATA_SHEET);
    var lastRow = sheet.getLastRow();
    
    Logger.log('\n' + '='.repeat(80));
    Logger.log('DEBUG: MESSAGE QUEUE ANALYSIS');
    Logger.log('='.repeat(80));
    Logger.log('Timestamp: ' + new Date().toISOString());
    Logger.log('Data Sheet: ' + CONFIG.DATA_SHEET);
    Logger.log('Last Row: ' + lastRow);
    
    if (lastRow < 2) {
      Logger.log('⚠️  No data rows found!');
      return;
    }

    // Test last data row
    var testRow = lastRow;
    var candidate = readCandidateFromRow(sheet, testRow);
    
    Logger.log('\n--- CANDIDATE EXTRACTION ---');
    Logger.log('Row #: ' + testRow);
    Logger.log('Name: ' + candidate.name);
    Logger.log('Phone: ' + candidate.phone);
    Logger.log('Phone Valid: ' + (candidate.phone ? '✅ YES' : '❌ NO'));
    Logger.log('Email: ' + candidate.email);
    
    // Check each workflow column
    Logger.log('\n--- WORKFLOW COLUMNS ---');
    
    var cols = [
      ['Level 1 Schedule', CONFIG.HEADERS.INTERVIEW_1_SCHEDULED],
      ['Enrolled Status', CONFIG.HEADERS.ENROLLED_STATUS],
      ['Interview level 1 Status', CONFIG.HEADERS.INTERVIEW_1_STATUS],
      ['Task detail', CONFIG.HEADERS.TASK_DETAIL],
      ['Deadline', CONFIG.HEADERS.TASK_DEADLINE],
      ['Task status', CONFIG.HEADERS.TASK_STATUS],
      ['Status', CONFIG.HEADERS.STATUS],
      ['Desgination', CONFIG.HEADERS.DESIGNATION],
      ['Feedback Form', CONFIG.HEADERS.FEEDBACK_FORM],
    ];
    
    cols.forEach(function(colInfo) {
      var colName = colInfo[0];
      var aliases = colInfo[1];
      var idx = getColumnIndexByHeader(sheet, aliases);
      var value = '';
      if (idx) {
        value = sheet.getRange(testRow, idx).getValue();
      }
      Logger.log('  ' + colName + ': ' + (idx ? '✅ Found (Col ' + idx + ')' : '❌ NOT FOUND') + ' | Value: "' + value + '"');
    });
    
    // Check workflow rules
    Logger.log('\n--- WORKFLOW RULES ---');
    var ruleTests = [
      'Level 1 Schedule',
      'Enrolled Status',
      'Interview level 1 Status',
      'Task detail',
      'Task status',
      'Status',
      'Desgination'
    ];
    
    ruleTests.forEach(function(colName) {
      var rule = getWorkflowRule(colName);
      if (rule) {
        Logger.log('  ✅ ' + colName + ': eventType=' + rule.eventType + ', conditional=' + rule.conditional + ', fetchFields=' + JSON.stringify(rule.fetchFields));
      } else {
        Logger.log('  ❌ ' + colName + ': NO RULE FOUND');
      }
    });
    
    // Check Queue Sheet
    Logger.log('\n--- MESSAGE QUEUE SHEET ---');
    var queueSheet = getSheet(CONFIG.QUEUE_SHEET);
    var queueLastRow = queueSheet.getLastRow();
    Logger.log('Queue Sheet Name: ' + CONFIG.QUEUE_SHEET);
    Logger.log('Last Queue Row: ' + queueLastRow);
    
    if (queueLastRow > 1) {
      Logger.log('Recent Queue Entries:');
      var startRow = Math.max(2, queueLastRow - 4);
      for (var i = startRow; i <= queueLastRow; i++) {
        var queueRow = queueSheet.getRange(i, 1, 1, 14).getValues()[0];
        Logger.log('  Row ' + i + ': ID=' + queueRow[0] + ' | Name=' + queueRow[2] + ' | Status=' + queueRow[10]);
      }
    } else {
      Logger.log('Queue is empty (no messages yet)');
    }
    
    Logger.log('\n' + '='.repeat(80) + '\n');
    
  } catch (err) {
    Logger.log('❌ DEBUG ERROR: ' + err.message);
  }
}

function testSingleColumnChange() {
  try {
    var sheet = getSheet(CONFIG.DATA_SHEET);
    var lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      Logger.log('No data rows to test');
      return;
    }
    
    var testRow = lastRow;
    var testCol = getColumnIndexByHeader(sheet, CONFIG.HEADERS.INTERVIEW_1_SCHEDULED);
    
    if (!testCol) {
      Logger.log('Level 1 Schedule column not found!');
      return;
    }
    
    Logger.log('\n🧪 SIMULATING COLUMN CHANGE');
    Logger.log('Row: ' + testRow);
    Logger.log('Column: Level 1 Schedule (Col ' + testCol + ')');
    
    var oldValue = sheet.getRange(testRow, testCol).getValue();
    var newValue = 'Today 6:00:00 PM';
    
    Logger.log('Old Value: "' + oldValue + '"');
    Logger.log('New Value: "' + newValue + '"');
    Logger.log('\nCalling handleWorkflowEvent...');
    
    // Manually trigger workflow
    handleWorkflowEvent(sheet, testRow, 'Level 1 Schedule', oldValue, newValue);
    
    Logger.log('✅ Workflow triggered');
    
  } catch (err) {
    Logger.log('❌ TEST ERROR: ' + err.message);
  }
}

function inspectRowData() {
  try {
    var sheet = getSheet(CONFIG.DATA_SHEET);
    var lastRow = sheet.getLastRow();
    
    Logger.log('\n📊 FULL ROW DATA (Last Row #' + lastRow + ')');
    Logger.log('='.repeat(100));
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i] || '';
      var value = data[i] || '';
      if (header) {
        Logger.log('Col ' + (i+1) + ': ' + header + ' = "' + value + '"');
      }
    }
    
    Logger.log('='.repeat(100) + '\n');
    
  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
  }
}

function checkSpreadsheetBinding() {
  try {
    Logger.log('\n--- SPREADSHEET BINDING CHECK ---');
    var active = null;
    try { active = SpreadsheetApp.getActive(); } catch(_) { active = null; }
    if (active) {
      Logger.log('Active Spreadsheet: id=' + active.getId() + ' name=' + active.getName());
      var sheets = active.getSheets().map(function(s){ return s.getName(); }).join(', ');
      Logger.log('Active sheets: ' + sheets);
    } else {
      Logger.log('Active Spreadsheet: <not available in this execution context>');
    }

    var configuredId = (CONFIG && CONFIG.SPREADSHEET_ID) ? CONFIG.SPREADSHEET_ID : '<none>';
    Logger.log('CONFIG.SPREADSHEET_ID: ' + configuredId);
    try {
      var byId = SpreadsheetApp.openById(configuredId);
      Logger.log('OpenById Spreadsheet: id=' + byId.getId() + ' name=' + byId.getName());
      var sheets2 = byId.getSheets().map(function(s){ return s.getName(); }).join(', ');
      Logger.log('OpenById sheets: ' + sheets2);
    } catch (err) {
      Logger.log('OpenById failed: ' + err.message);
    }
    Logger.log('--- END SPREADSHEET BINDING CHECK ---\n');
  } catch (err) {
    Logger.log('❌ checkSpreadsheetBinding error: ' + err.message);
  }
}
