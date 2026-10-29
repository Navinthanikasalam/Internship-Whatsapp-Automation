// ============================================================
// SHINE CRAFT TECHNOLOGY
// File: Validation.gs
// Purpose: basic configuration validation utilities
// ============================================================

/**
 * Pre-deployment sanity check. Returns an object with findings.
 */
function preDeployCheck() {
  const issues = [];
  try {
    validateConfig();
  } catch (err) {
    issues.push({ type: 'CONFIG', message: err.message });
    return { ok: false, issues };
  }

  const ss = getSpreadsheet();
  if (!ss) {
    issues.push({ type: 'SPREADSHEET', message: 'Unable to open spreadsheet with provided SPREADSHEET_ID' });
    return { ok: false, issues };
  }

  // Data sheet header audit
  const sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) {
    issues.push({ type: 'SHEET', message: 'Data sheet not found: ' + CONFIG.DATA_SHEET });
  } else {
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headerRow = sheet.getRange(1,1,1,lastCol).getValues()[0] || [];
    Object.keys(CONFIG.HEADERS).forEach(key => {
      const aliases = CONFIG.HEADERS[key] || [];
      const found = aliases.some(alias => headerRow.some(h => normalizeHeaderName(h) === normalizeHeaderName(alias)));
      if (!found) {
        issues.push({ type: 'HEADER_MISSING', key, aliases, message: `No header found matching aliases for ${key}: ${aliases.join(', ')}` });
      }
    });
  }

  // Queue sheet
  const q = ss.getSheetByName(CONFIG.QUEUE_SHEET);
  if (!q) {
    issues.push({ type: 'SHEET', message: 'Queue sheet not found: ' + CONFIG.QUEUE_SHEET });
  }

  // Templates are optional. Only validate when user has defined template entries.
  if (CONFIG.TEMPLATES && typeof CONFIG.TEMPLATES === 'object' && Object.keys(CONFIG.TEMPLATES).length > 0) {
    Object.keys(CONFIG.EVENTS).forEach(k => {
      const evt = CONFIG.EVENTS[k];
      if (!CONFIG.TEMPLATES[evt] && !CONFIG.TEMPLATES[k]) {
        issues.push({ type: 'TEMPLATE_MISSING', event: evt, message: `Template missing for event ${evt}` });
      }
    });
  }

  const ok = issues.length === 0;
  Logger.log('[preDeployCheck] ok=' + ok + ' issues=' + JSON.stringify(issues));
  return { ok, issues };
}

function auditWorkflowCoverage() {
  const lines = [];
  const sheet = getSheet(CONFIG.DATA_SHEET);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = (sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [])
    .map(h => (h || '').toString().trim())
    .filter(h => h);

  lines.push('Data sheet tab name in CONFIG: "' + CONFIG.DATA_SHEET + '"');
  lines.push('Actual tab name found:          "' + sheet.getName() + '"');
  lines.push('');
  lines.push('-- Column → Workflow Rule coverage --');
  headers.forEach(h => {
    const rule = getWorkflowRule(h);
    lines.push((rule ? '[OK]      ' : '[GENERIC] ') + h +
      (rule ? '  -> ' + (Array.isArray(rule.eventType) ? rule.eventType.join(' / ') : rule.eventType) : '  (no specific rule — will send a generic "data updated" message)'));
  });

  lines.push('');
  lines.push('-- Row 2 candidate read test --');
  if (sheet.getLastRow() >= 2) {
    const candidate = readCandidateFromRow(sheet, 2);
    lines.push('name:  "' + (candidate && candidate.name)  + '"');
    lines.push('phone: "' + (candidate && candidate.phone) + '"  (must NOT be blank, or nothing will ever queue)');
  } else {
    lines.push('No data rows yet to test.');
  }

  const report = lines.join('\n');
  Logger.log(report);
  try { SpreadsheetApp.getUi().alert(report.substring(0, 1500) + (report.length > 1500 ? '\n...(see Executions log for full report)' : '')); } catch (_) {}
  return report;
}

function validateConfig() {

  if (!CONFIG || !CONFIG.SPREADSHEET_ID) {
    throw new Error('CONFIG.SPREADSHEET_ID is required. Update Config.gs with your spreadsheet ID.');
  }

  if (!CONFIG.DATA_SHEET) {
    throw new Error('CONFIG.DATA_SHEET is required. Set your data sheet name in Config.gs.');
  }

  if (!CONFIG.QUEUE_SHEET) {
    throw new Error('CONFIG.QUEUE_SHEET is required. Set your queue sheet name in Config.gs.');
  }

  if (!CONFIG.LOG_SHEET) {
    throw new Error('CONFIG.LOG_SHEET is required. Set your log sheet name in Config.gs.');
  }

  if (!CONFIG.HEADERS || typeof CONFIG.HEADERS !== 'object') {
    throw new Error('CONFIG.HEADERS must be defined with header aliases.');
  }
}

function validateSheetHeaders() {
  const sheet = getSheet(CONFIG.DATA_SHEET);
  if (!sheet) {
    throw new Error(`Data sheet not found: ${CONFIG.DATA_SHEET}`);
  }

  const requiredKeys = [
    'TIMESTAMP',
    'NAME',
    'PHONE',
    'EMAIL',
    'GENDER',
    'CURRENT_CITY',
    'SCHOOL_NAME',
    'EDUCATION_STATUS',
    'COLLEGE_NAME',
    'DEGREE',
    'CURRENT_YEAR_SEMESTER',
    'PREFERRED_DOMAINS',
    'TECHNICAL_SKILLS',
    'INTERNSHIP_TYPE',
    'PREFERRED_START_DATE',
    'PREFERRED_DURATION',
    'RESUME_UPLOAD',
    'INTERVIEW_1_SCHEDULED',
    'INTERVIEW_2_SCHEDULED',
    'INTERVIEW_1_STATUS',
    'INTERVIEW_2_STATUS',
    'STATUS',
    'TASK_DETAIL',
    'TASK_DEADLINE',
    'TASK_STATUS',
    'DESIGNATION',
    'ENROLLED_STATUS',
    'FEEDBACK_FORM',
    'COMMENTS',
  ];

  const missing = [];
  requiredKeys.forEach(key => {
    const headers = CONFIG.HEADERS[key];
    if (!Array.isArray(headers) || !getColumnIndexByHeader(sheet, headers)) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required data sheet headers: ${missing.join(', ')}`);
  }
}
