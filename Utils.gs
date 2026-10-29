// ============================================================
// SHINE CRAFT TECHNOLOGY  |  Utils.gs  |  v3.1
// Shared helpers — header detection, phone formatting, caching.
// FIX: readCandidateFromRow now includes enrolled_status and designation_status.
// ============================================================

// ── Spreadsheet access ───────────────────────────────────────

function getSpreadsheet() {
  if (!CONFIG || !CONFIG.SPREADSHEET_ID) throw new Error('CONFIG.SPREADSHEET_ID missing');
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log('[Utils] Auto-created sheet: ' + name);
  }
  return sheet;
}

// ── Header detection (dynamic — works even if columns move) ──

function normalizeHeaderName(h) {
  return (h || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function getHeaderMapping(sheet) {
  if (!sheet) return {};
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  const row = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
  const map = {};
  row.forEach((h, i) => {
    const raw = (h || '').toString().trim();
    if (!raw) return;
    map[raw]                      = i + 1;
    map[normalizeHeaderName(raw)] = i + 1;
  });
  return map;
}

// Accepts a single string or array of alias strings.
function getColumnIndexByHeader(sheet, headerOrAliases) {
  const map     = getHeaderMapping(sheet);
  const aliases = Array.isArray(headerOrAliases) ? headerOrAliases : [headerOrAliases];
  for (const a of aliases) {
    const k = (a || '').toString().trim();
    if (map[k])                       return map[k];
    if (map[normalizeHeaderName(k)])  return map[normalizeHeaderName(k)];
  }
  // Heuristic fallback for phone-like headers when exact aliases miss.
  // Many sheets use variants like 'Mobile Number', 'Phone No', 'WhatsApp Number'.
  try {
    const aliasText = aliases.join(' ').toString().toLowerCase();
    if (aliasText.indexOf('phone') >= 0 || aliasText.indexOf('mobile') >= 0 || aliasText.indexOf('whatsapp') >= 0) {
      for (const rawHeader in map) {
        const h = (rawHeader || '').toString().toLowerCase();
        if (h.indexOf('phone') >= 0 || h.indexOf('mobile') >= 0 || h.indexOf('whatsapp') >= 0 || h.indexOf('contact') >= 0) {
          return map[rawHeader];
        }
      }
    }
  } catch (_) {}

  return null;
}

// ── Phone normalisation ──────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return '';
  const digits = raw.toString().replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 7)  return '';
  if (digits.length === 10) return CONFIG.COUNTRY_CODE + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  if (digits.length >= 7 && digits.length <= 15) return '+' + digits;
  return '';
}

// ── WA link builder ──────────────────────────────────────────

function buildWaLink(phone, message) {
  if (!phone) return '';
  const cleaned = phone.toString().replace(/\D/g, '');
  return 'https://web.whatsapp.com/send?phone=' + encodeURIComponent(cleaned) +
         '&text=' + encodeURIComponent(message || '');
}

// ── Candidate reader (fully dynamic — uses HEADERS aliases) ──

function readCandidateFromRow(sheet, rowIndex) {
  try {
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const rowData = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0] || [];

    const get = (key) => {
      const idx = getColumnIndexByHeader(sheet, CONFIG.HEADERS[key] || [key]);
      return idx ? (rowData[idx - 1] || '').toString().trim() : '';
    };

    const candidate = {
      rowIndex,
      timestamp:            get('TIMESTAMP'),
      name:                 get('NAME'),
      phone:                normalizePhone(get('PHONE')),
      email:                get('EMAIL'),
      gender:               get('GENDER'),
      dob:                  get('DOB'),
      current_city:         get('CURRENT_CITY'),
      state:                get('STATE'),
      country:              get('COUNTRY'),
      school_reg_number:    get('SCHOOL_REG_NUMBER'),
      school_group:         get('SCHOOL_GROUP'),
      school_name:          get('SCHOOL_NAME'),
      school_address:       get('SCHOOL_ADDRESS'),
      school_graduation_year: get('SCHOOL_GRADUATION_YEAR'),
      linkedin_profile:     get('LINKEDIN_PROFILE'),
      github_portfolio:     get('GITHUB_PORTFOLIO'),
      career_objectives:    get('CAREER_OBJECTIVES'),
      education_status:     get('EDUCATION_STATUS'),
      college_name:         get('COLLEGE_NAME'),
      college_address:      get('COLLEGE_ADDRESS'),
      college_reg_number:   get('COLLEGE_REG_NUMBER'),
      college_graduation_year: get('COLLEGE_GRADUATION_YEAR'),
      degree:               get('DEGREE'),
      current_year_sem:     get('CURRENT_YEAR_SEMESTER'),
      year_of_study:        get('YEAR_OF_STUDY'),
      cgpa_percentage:      get('CGPA_PERCENTAGE'),
      preferred_domains:    get('PREFERRED_DOMAINS'),
      internship_domain_other: get('INTERNSHIP_DOMAIN_OTHER'),
      skills_known:         get('TECHNICAL_SKILLS'),
      internship_type:      get('INTERNSHIP_TYPE'),
      preferred_start:      get('PREFERRED_START_DATE'),
      preferred_duration:   get('PREFERRED_DURATION'),
      available_timing:     get('AVAILABLE_TIMING'),
      resume_upload:        get('RESUME_UPLOAD'),
      working_days:         get('AVAILABLE_WORKING_DAYS'),
      laptop_available:     get('LAPTOP_AVAILABILITY'),
      internet_available:   get('INTERNET_AVAILABILITY'),
      hear_about_us:        get('HOW_DID_YOU_HEAR'),
      hear_about_us_other:  get('HEAR_ABOUT_US_OTHER'),
      expectations:         get('INTERNSHIP_EXPECTATIONS'),
      declaration:          get('DECLARATION'),
      accept_terms:         get('ACCEPT_TERMS'),
      drive_folder_link:    get('DRIVE_FOLDER_LINK'),
      // ── NEW columns ──────────────────────────────────────
      enrolled_status:      get('ENROLLED_STATUS'),
      designation_status:   get('DESIGNATION_STATUS'),
      // ── Interview fields ──────────────────────────────────
      interview_1_dt:       get('INTERVIEW_1_DT'),
      interview_2_dt:       get('INTERVIEW_2_DT'),
      interview_3_dt:       get('INTERVIEW_3_DT'),
      interview_1_status:   get('INTERVIEW_1_STATUS'),
      interview_2_status:   get('INTERVIEW_2_STATUS'),
      task_detail:          get('TASK_DETAIL'),
      task_deadline:        get('TASK_DEADLINE'),
      designation:          get('DESIGNATION'),
      feedback_form:        get('FEEDBACK_FORM'),
      comments:             get('COMMENTS'),
    };

    if (!candidate.phone) {
      Logger.log('[Utils] Row ' + rowIndex + ': phone empty after normalise. Raw="' + get('PHONE') + '"');
    }
    return candidate;
  } catch (err) {
    Logger.log('[Utils] readCandidateFromRow row=' + rowIndex + ': ' + err.message);
    return null;
  }
}

// ── Dropdown helpers ─────────────────────────────────────────

function isSelected(value) {
  const t = (value || '').toString().trim().toLowerCase();
  return CONFIG.DROPDOWNS.SELECTED.some(v => v.toLowerCase() === t);
}

function isRejected(value) {
  const t = (value || '').toString().trim().toLowerCase();
  return CONFIG.DROPDOWNS.REJECTED.some(v => v.toLowerCase() === t);
}

function isBlocklisted(value) {
  const t = (value || '').toString().trim().toLowerCase();
  return t.includes('blocklist') || t.includes('blacklist');
}

function isNoResponse(value) {
  const t = (value || '').toString().trim().toLowerCase();
  return CONFIG.DROPDOWNS.NO_RESPONSE && CONFIG.DROPDOWNS.NO_RESPONSE.some(v => v.toLowerCase() === t);
}

function isEmpty(value) {
  return value === null || value === undefined || value.toString().trim() === '';
}

// ── Date formatter ───────────────────────────────────────────

function formatDateTime(value) {
  if (isEmpty(value)) return 'TBD';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return value.toString();
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd MMM yyyy, hh:mm a');
  } catch (_) { return value.toString(); }
}

// ── Duplicate-message cache ──────────────────────────────────

function buildCacheKey(phone, eventType, rowIndex, valueHash) {
  const raw = phone + '_' + eventType + '_' + rowIndex + '_' + (valueHash || '');
  return (CONFIG.CACHE_PREFIX + raw).substring(0, 240);
}

// Real-time duplicate check — blocks if same phone+event queued in last 30 seconds
function isRecentlyQueued(phone, eventType) {
  const recentKey = 'SC_RECENT_' + phone + '_' + eventType;
  const val = PropertiesService.getScriptProperties().getProperty(recentKey);
  if (!val) return false;
  const ageSeconds = (Date.now() - Number(val)) / 1000;
  return ageSeconds < 30; // 30-second cooldown
}

function isDuplicateMessage(phone, eventType, rowIndex, valueHash) {
  // PRIORITY 1: Check real-time queue (30-second window)
  if (isRecentlyQueued(phone, eventType)) {
    Logger.log('[Utils] Real-time duplicate blocked: ' + phone + ' for ' + eventType);
    return true;
  }

  // PRIORITY 2: Check cache (24-hour window for message history)
  const key = buildCacheKey(phone, eventType, rowIndex, valueHash);
  const val = PropertiesService.getScriptProperties().getProperty(key);
  if (!val) return false;
  const ageHours = (Date.now() - Number(val)) / 3600000;
  return ageHours < CONFIG.CACHE_EXPIRY_HOURS;
}

function markMessageSent(phone, eventType, rowIndex, valueHash) {
  // Set both real-time and long-term cache
  const recentKey = 'SC_RECENT_' + phone + '_' + eventType;
  PropertiesService.getScriptProperties().setProperty(recentKey, Date.now().toString());

  const key = buildCacheKey(phone, eventType, rowIndex, valueHash);
  PropertiesService.getScriptProperties().setProperty(key, Date.now().toString());
}
