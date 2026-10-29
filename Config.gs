// ============================================================
// SHINE CRAFT TECHNOLOGY  |  Config.gs  |  v3.1
// ONE source of truth — all other files read from this object.
// ⚠️  Only change SPREADSHEET_ID to match your sheet URL.
// ============================================================

var CONFIG = {

  // ── YOUR SPREADSHEET ID (copy from the sheet URL) ──────────
  SPREADSHEET_ID: '1HsRXH-3r_ZGKJ9ghWbChnkXXWRVGYXxsh9eIJifxf1o',

  // ── Sheet names ────────────────────────────────────────────
  DATA_SHEET:      'internship whatsapp automation',
  QUEUE_SHEET:     'Message Queue',
  LOG_SHEET:       'AUTOMATION LOG',
  DASHBOARD_SHEET: 'Dashboard',

  // ── Company info ───────────────────────────────────────────
  COMPANY_NAME: 'Shine Craft Technologies',
  COUNTRY_CODE: '+91',      // default country code for 10-digit numbers

  // ── Duplicate-guard cache ──────────────────────────────────
  CACHE_PREFIX:       'SC_MSG_',
  CACHE_EXPIRY_HOURS: 24,

  // ── Column header aliases ──────────────────────────────────
  HEADERS: {
    TIMESTAMP:              ['submittedAt', 'submitted at', 'Timestamp', 'timestamp', 'Date'],
    NAME:                   ['fullName', 'Full Name', 'Full Name with Initial', 'name', 'Candidate Name'],
    PHONE:                  ['phone', 'Phone', 'Phone Number', 'whatsapp number', 'WhatsApp Number', 'Whatsapp Number', 'Mobile', 'Contact'],
    EMAIL:                  ['email', 'Email', 'Email Address', 'email address'],
    GENDER:                 ['gender', 'Gender'],
    CURRENT_CITY:           ['currentLocation', 'Current Location', 'Current Location (City, State)', 'current city', 'Current City', 'City', 'city'],
    STATE:                  ['state', 'State'],
    COUNTRY:                ['country', 'Country'],
    SCHOOL_REG_NUMBER:      ['schoolRegNumber', 'School Registration Number', 'School Reg Number', 'school reg number'],
    SCHOOL_GROUP:           ['schoolGroup', 'School Group'],
    SCHOOL_NAME:            ['schoolName', 'School Name'],
    SCHOOL_ADDRESS:         ['schoolAddress', 'School Address'],
    SCHOOL_GRADUATION_YEAR: ['schoolGraduationYear', 'School Graduation Year'],
    EDUCATION_STATUS:       ['educationStatus', 'Education Status', 'education status', 'Education'],
    COLLEGE_REG_NUMBER:     ['collegeRegNumber', 'College Registration number', 'College Reg', 'Registration Number'],
    DEGREE:                 ['courseName', 'Course Name', 'Course / Degree Name', 'Degree', 'degree'],
    COLLEGE_NAME:           ['collegeName', 'College Name', 'Institution / College Name', 'University', 'university'],
    COLLEGE_ADDRESS:        ['collegeAddress', 'College Address', 'Institution / College Address', 'Address'],
    COLLEGE_GRADUATION_YEAR:['collegeGraduationYear', 'College Graduation Year', 'Graduation Year'],
    CURRENT_YEAR_SEMESTER:  ['yearOfStudy', 'Year of Study', 'Year of Study (or) Graduation', 'Current year/Semester', 'Year/Semester', 'Semester'],
    CGPA_PERCENTAGE:        ['Cgpa/percentage', 'CGPA/percentage', 'CGPA', 'cgpa', 'Percentage'],
    LINKEDIN_PROFILE:       ['profileLink', 'Linkedln Profile / Github / Portfolio (optional)', 'Linkedln Profile', 'LinkedIn Profile', 'linkedin profile', 'Linkedin', 'Github', 'Portfolio'],
    TECHNICAL_SKILLS:       ['technicalSkills', 'Briefly describe your technical skills / experience', 'Technical Skills', 'Skills'],
    PROJECTS:               ['projectDetails', 'Have you worked on any personal or academic projects? Briefly explain', 'Projects', 'project'],
    RESUME_UPLOAD:          ['resumeLinks', 'Attach Resume / Portfolio', 'Resume Upload', 'resume upload', 'Resume'],
    HOW_DID_YOU_HEAR:       ['hearAboutUs', 'How did you hear about Shine Craft Technologies?', 'How did you hear', 'Source'],
    HEAR_ABOUT_US_OTHER:    ['hearAboutUsOther', 'Hear About Us Other'],
    INTERNSHIP_EXPECTATIONS:['expectations', 'Do you have any specific expectations or goals from this internship?', 'Expectations', 'Goals'],
    DECLARATION:            ['declaration', 'Declaration', 'Acknowledgement', 'acknowledgement'],
    ACCEPT_TERMS:           ['acceptTerms', 'Accept Terms', 'Terms Accepted'],
    PREFERRED_DOMAINS:      ['internshipDomains', 'Preferred/Interested Internship Domain', 'Preferred internship domains', 'Preferred Domains', 'preferred domains'],
    INTERNSHIP_DOMAIN_OTHER:['internshipDomainOther', 'Internship Domain Other'],
    INTERNSHIP_TYPE:        ['internshipType', 'Available Internship Type', 'Internship Type', 'internship type'],
    PREFERRED_START_DATE:   ['preferredStartDate', 'Preferred Start Date', 'Prefered Start Date', 'start date'],
    PREFERRED_DURATION:     ['internshipDuration', 'Preferred Duration', 'Prefered Duration', 'duration'],
    DRIVE_FOLDER_LINK:      ['driveFolderLink', 'Drive Folder Link', 'Google Drive Folder Link'],
    YEAR_OF_STUDY:          ['yearOfStudy', 'Year of Study'],

    // ── Enrolled Status column ────────────────────────
    ENROLLED_STATUS:        ['Enrolled Status', 'enrolled status', 'EnrolledStatus', 'Enroll Status', 'enroll status'],

    // ── Interview scheduling / results ─────────────────────
    INTERVIEW_1_SCHEDULED:  ['Level 1 Schedule', 'Interview levell 1 Scheduled', 'Interview level 1 Scheduled', 'interview level 1 scheduled'],
    INTERVIEW_1_STATUS:     ['Interview level 1 Status', 'Interview level 1 status', 'Interview 1 Status', 'interview 1 status'],
    INTERVIEW_2_SCHEDULED:  ['Level 2 Schedule', 'IntervieW  level 2 Scheduled', 'Interview level 2 Scheduled', 'interview level 2 scheduled'],
    INTERVIEW_2_STATUS:     ['Interview level 2 Status', 'Interview level 2 status', 'Interview 2 Status', 'interview 2 status'],

    // ── Task columns ───────────────────────────────────────
    TASK_DETAIL:            ['Task detail', 'task detail', 'Task Detail', 'Task', 'task'],
    TASK_DEADLINE:          ['Deadline', 'task dead line', 'Task Deadline', 'task deadline', 'Task Dead Line'],
    TASK_STATUS:            ['Task staus', 'Task Status', 'task status', 'Task Status Change'],

    // ── Final status / designation ─────────────────────────
    STATUS:                 ['Status', 'Satuts', 'status', 'Current Status'],
    DESIGNATION:            ['Desgination', 'designation', 'Designation', 'Proficiency Level', 'proficiency', 'Proficiency', 'Position', 'Job Title', 'Role', 'Assigned Designation'],
    DESIGNATION_STATUS:     ['Desgination status', 'Designation status', 'designation status', 'Designation Status'],
    FEEDBACK_FORM:          ['Feedback Form', 'feedback form', 'Feedback Link', 'Feedback Form Link'],
    COMMENTS:               ['COMMENTS', 'Comments', 'comments'],
  },

  // ── Designation dropdown options ─────────────────────────
  DESIGNATION_OPTIONS: ['Intern', 'Begginer', 'learner', 'professional'],

  // ── Dropdown values recognised as SELECTED / REJECTED ──────
  DROPDOWNS: {
    SELECTED: ['Selected', 'selected', 'Yes', 'yes', 'Accepted', 'Pass', 'pass',
               'Passed', 'Shortlisted', 'shortlisted',
               'SELECTED FOR ROUND 2', 'Selected for Round 2', 'SELECTED FOR ROUND 3', 'Selected for Round 3',
               'enrolled', 'Enrolled', 'ENROLLED'],
    REJECTED: ['Rejected', 'rejected', 'REJECTED', 'No', 'no', 'Fail', 'fail',
               'Failed', 'Not Selected', 'not selected', 'blocklisted', 'Blocklisted', 'BLOCKLISTED',
               'blacklisted', 'Blacklisted'],
    NO_RESPONSE: ['NO RESPONSE', 'No Response', 'no response', 'NO_RESPONSE'],
    // ── NEW: Enrolled status dropdown values ───────────────
    ENROLLED:    ['enrolled', 'Enrolled', 'ENROLLED'],
    BLOCKLISTED: ['blocklisted', 'Blocklisted', 'BLOCKLISTED', 'blacklisted', 'Blacklisted'],
    COMPLETED:   ['completed', 'Completed', 'COMPLETED'],
    // ── Task Status dropdown values ────────────────────────
    NOT_ASSIGNED: ['Not Assigned', 'not assigned', 'NOT_ASSIGNED'],
    ASSIGNED:     ['Assigned', 'assigned', 'ASSIGNED'],
    IN_PROGRESS:  ['Onprogress', 'onprogress', 'On progress', 'In progress', 'IN_PROGRESS'],
    INCOMPLETED:  ['Incompleted', 'incompleted', 'INCOMPLETED', 'Incomplete', 'incomplete'],
  },

  // ── Internal event codes ───────────────────────────────────
  EVENTS: {
    FORM_SUBMIT:               'FORM_SUBMIT',
    INTERVIEW_1_SCHEDULE:      'INTERVIEW_1_SCHEDULE',
    INTERVIEW_1_SCHEDULED:     'INTERVIEW_1_SCHEDULED',
    INTERVIEW_ROUND_1_SELECTED:'INTERVIEW_ROUND_1_SELECTED',
    INTERVIEW_ROUND_1_REJECTED:'INTERVIEW_ROUND_1_REJECTED',
    INTERVIEW_1_NO_RESPONSE:   'INTERVIEW_1_NO_RESPONSE',
    INTERVIEW_1_STATUS_CHANGED:'INTERVIEW_1_STATUS_CHANGED',
    INTERVIEW_2_SCHEDULE:      'INTERVIEW_2_SCHEDULE',
    INTERVIEW_2_SCHEDULED:     'INTERVIEW_2_SCHEDULED',
    INTERVIEW_ROUND_2_SELECTED:'INTERVIEW_ROUND_2_SELECTED',
    INTERVIEW_ROUND_2_REJECTED:'INTERVIEW_ROUND_2_REJECTED',
    INTERVIEW_2_NO_RESPONSE:   'INTERVIEW_2_NO_RESPONSE',
    INTERVIEW_2_STATUS_CHANGED:'INTERVIEW_2_STATUS_CHANGED',
    INTERVIEW_3_SCHEDULE:      'INTERVIEW_3_SCHEDULE',
    INTERVIEW_ROUND_3_SELECTED:'INTERVIEW_ROUND_3_SELECTED',
    INTERVIEW_ROUND_3_REJECTED:'INTERVIEW_ROUND_3_REJECTED',
    TASK_ASSIGNMENT:           'TASK_ASSIGNMENT',
    TASK_STATUS_CHANGED:       'TASK_STATUS_CHANGED',
    FINAL_SELECTED:            'FINAL_SELECTED',
    FINAL_REJECTED:            'FINAL_REJECTED',
    ENROLLED_CONFIRMED:        'ENROLLED_CONFIRMED',
    ENROLLMENT_REJECTED:       'ENROLLMENT_REJECTED',
    ENROLLMENT_BLOCKLISTED:    'ENROLLMENT_BLOCKLISTED',
    DESIGNATION_NOTIFICATION:  'DESIGNATION_NOTIFICATION',  // No longer used - use FINAL_SELECTED instead
    DATA_UPDATED:              'DATA_UPDATED',
    FEEDBACK_FORM:             'FEEDBACK_FORM',
    TASK_REMINDER_1DAY:        'TASK_REMINDER_1DAY',
    TASK_REMINDER_SAME_DAY:    'TASK_REMINDER_SAME_DAY',
    // ── NEW events for enrolled status ────────────────────
    CANDIDATE_ENROLLED:        'CANDIDATE_ENROLLED',
    CANDIDATE_REJECTED_FINAL:  'CANDIDATE_REJECTED_FINAL',
    CANDIDATE_BLOCKLISTED:     'CANDIDATE_BLOCKLISTED',
    CANDIDATE_COMPLETED:       'CANDIDATE_COMPLETED',
    // ── NEW event for designation status ──────────────────
    DESIGNATION_STATUS_CHANGED:'DESIGNATION_STATUS_CHANGED',
  },

  TEMPLATES: {},

  // ── Workflow rules ─────────────────────────────────────────
  WORKFLOW_RULES: {
    // Interview scheduling - Level 1
    'Level 1 Schedule':            { conditional: false, eventType: 'INTERVIEW_1_SCHEDULE' },
    'Interview level 1 Status':    { conditional: false, eventType: 'INTERVIEW_1_STATUS_CHANGED' },

    // Interview scheduling - Level 2
    'Level 2 Schedule':            { conditional: false, eventType: 'INTERVIEW_2_SCHEDULE' },
    'Interview level 2 Status':    { conditional: false, eventType: 'INTERVIEW_2_STATUS_CHANGED' },

    // ── TASKS: ONLY Task status dropdown triggers ────────
    // (NOT Task detail or Deadline text fields)
    'Task status':                 { conditional: false, eventType: 'TASK_ASSIGNMENT', fetchFields: ['Task detail', 'Deadline'] },
    'Task staus':                  { conditional: false, eventType: 'TASK_ASSIGNMENT', fetchFields: ['Task detail', 'Deadline'] },

    // ── FINAL STATUS: ONLY Status dropdown triggers ────────
    // (NOT Designation field - that's fetched from Status dropdown)
    // Fetch Designation + Feedback Form when Status changes
    'Status':                      { conditional: false, eventType: 'FINAL_SELECTED', fetchFields: ['Desgination', 'Feedback Form'] },
    'Satuts':                      { conditional: false, eventType: 'FINAL_SELECTED', fetchFields: ['Desgination', 'Feedback Form'] },

    // ── ENROLLED STATUS: dropdown triggers combined message ──
    // Fetch Feedback Form when Enrolled Status changes
    'Enrolled Status':             { conditional: false, eventType: 'CANDIDATE_ENROLLED', fetchFields: ['Feedback Form'] },
  },
};

// Alias for WhatsApp.gs which historically checks Config (capital C)
var Config = CONFIG;
