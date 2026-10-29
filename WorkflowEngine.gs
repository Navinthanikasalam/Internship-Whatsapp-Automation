// ============================================================
// SHINE CRAFT TECHNOLOGY  |  WorkflowEngine.gs  |  v3.1
// Handles every dropdown / cell change and fires the right message.
// FIX: generateMessage no longer references undefined `newText` variable.
// FIX: CANDIDATE_ENROLLED, CANDIDATE_BLOCKLISTED, DESIGNATION_STATUS_CHANGED events added.
// FIX: TASK_ASSIGNMENT message now includes candidate greeting.
// ============================================================

// ── Resolve workflow rule for any column name ─────────────────
function getWorkflowRule(columnHeader) {
  if (!columnHeader) return null;
  const norm = normalizeHeaderName(columnHeader);

  for (const ruleKey in CONFIG.WORKFLOW_RULES) {
    if (normalizeHeaderName(ruleKey) === norm) return CONFIG.WORKFLOW_RULES[ruleKey];
  }

  // Also check via HEADERS aliases so any synonym triggers the rule
  for (const ruleKey in CONFIG.WORKFLOW_RULES) {
    for (const headerKey in CONFIG.HEADERS) {
      const aliases = CONFIG.HEADERS[headerKey] || [];
      if (aliases.some(a => normalizeHeaderName(a) === normalizeHeaderName(ruleKey))) {
        if (aliases.some(a => normalizeHeaderName(a) === norm)) {
          return CONFIG.WORKFLOW_RULES[ruleKey];
        }
      }
    }
  }
  return null;
}

// ── Queue a welcome message for a newly added application row ──
function queueNewApplicationMessage(sheet, rowIndex) {
  try {
    if (!sheet || rowIndex <= 1) return false;

    const candidate = readCandidateFromRow(sheet, rowIndex);
    if (!candidate) {
      Logger.log('[WE] New application: could not read candidate at row ' + rowIndex);
      return false;
    }

    const rawPhone = sheet.getRange(rowIndex, getColumnIndexByHeader(sheet, CONFIG.HEADERS.PHONE) || 1).getValue();
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      Logger.log('[WE] New application: no valid phone found for row ' + rowIndex + ' (' + (candidate.name || 'unknown') + ')');
      logMessageEvent(candidate, 'FORM_SUBMIT', '', '', CONFIG.EVENTS.FORM_SUBMIT, 'SKIPPED', 'Phone extraction failed - no phone number found', '');
      return false;
    }

    candidate.phone = phone;
    const message = generateMessage(CONFIG.EVENTS.FORM_SUBMIT, candidate, {});
    if (!message) {
      Logger.log('[WE] New application: message generation failed for row ' + rowIndex);
      return false;
    }

    queueWhatsApp({ candidate, eventType: CONFIG.EVENTS.FORM_SUBMIT,
                   triggerColumn: 'FORM_SUBMIT', oldText: '', newText: '', message });
    logMessageEvent(candidate, 'FORM_SUBMIT', '', '', CONFIG.EVENTS.FORM_SUBMIT, 'QUEUED', '', message);
    Logger.log('[WE] New application queued for row ' + rowIndex + ' to ' + phone);
    return true;
  } catch (err) {
    Logger.log('[WE] queueNewApplicationMessage error: ' + err.message);
    return false;
  }
}

// ── Main event handler (called from Trigger.gs) ───────────────

function handleWorkflowEvent(sheet, rowIndex, columnHeader, oldValue, newValue) {
  try {
    if (rowIndex <= 1) return;

    const oldText = (oldValue === undefined || oldValue === null) ? '' : oldValue.toString().trim();
    const newText = (newValue === undefined || newValue === null) ? '' : newValue.toString().trim();

    Logger.log('[WE] col="' + columnHeader + '" row=' + rowIndex +
               ' old="' + oldText + '" new="' + newText + '"');

    // ── Form submission / new row welcome message ───────────
    if (columnHeader === 'FORM_SUBMIT') {
      const queued = queueNewApplicationMessage(sheet, rowIndex);
      if (queued) {
        Logger.log('[WE] Form submit handled for row ' + rowIndex);
      }
      return;
    }

    // ── Regular cell edit ────────────────────────────────────
    if (oldText === newText || isEmpty(newText)) {
      Logger.log('[WE] Skipped: value unchanged or empty');
      return;
    }

    const candidate = readCandidateFromRow(sheet, rowIndex);
    if (!candidate) {
      Logger.log('[WE] Could not read candidate at row ' + rowIndex);
      return;
    }

    // ── CRITICAL: Ensure phone exists for ANY WhatsApp message ──
    if (!candidate.phone) {
      Logger.log('[WE] ⚠️  CRITICAL: No phone for ' + (candidate.name || 'unknown') + ' at row ' + rowIndex + 
                 ' column "' + columnHeader + '". Phone extraction may be failing.');
      logMessageEvent(candidate, columnHeader, oldText, newText, '', 'SKIPPED', 'Phone extraction failed - no phone number found', '');
      return;
    }

    // ── Get workflow rule ──
    const rule = getWorkflowRule(columnHeader);
    Logger.log('[WE] Column "' + columnHeader + '" → Rule found: ' + (rule ? 'YES' : 'NO'));

    if (!rule) {
      Logger.log('[WE] No workflow rule for column "' + columnHeader + '" — logging only, no WhatsApp sent.');
      logMessageEvent(candidate, columnHeader, oldText, newText, '', 'SKIPPED', 'Column has no workflow rule defined', '');
      return;
    }

    // Determine which event(s) to fire
    let eventTypes = [];
    const normalizedColumn = normalizeHeaderName(columnHeader);

    // ── SPECIAL HANDLING: Status dropdown (Selected vs Rejected) ──
    if (normalizedColumn === 'status' || normalizedColumn === 'satuts') {
      Logger.log('[WE] 🟡 FINAL STATUS detected: value="' + newText + '"');
      if (isSelected(newText)) {
        eventTypes = [CONFIG.EVENTS.FINAL_SELECTED];
        Logger.log('[WE] → Triggered: FINAL_SELECTED');
      } else if (isRejected(newText) || isBlocklisted(newText)) {
        eventTypes = [CONFIG.EVENTS.FINAL_REJECTED];
        Logger.log('[WE] → Triggered: FINAL_REJECTED');
      } else {
        Logger.log('[WE] ⚠️  Status "' + newText + '" not recognized. Expected: Selected/Rejected/Blocklisted.');
        return;
      }
    }
    else if (normalizedColumn === 'designation' || normalizedColumn === 'desgination' || normalizedColumn === 'designation status' || normalizedColumn === 'feedback form') {
      Logger.log('[WE] Ignoring designation/feedback change for WhatsApp queue: ' + columnHeader);
      return;
    }
    // ── SPECIAL HANDLING: Enrolled Status with multiple outcomes ──
    else if (normalizeHeaderName(columnHeader).includes('enrolled')) {
      Logger.log('[WE] 🔵 ENROLLED STATUS detected: value="' + newText + '"');
      // Handle enrolled/rejected/blocklisted/completed statuses
      if (isSelected(newText) || newText.toLowerCase().includes('enrolled')) {
        eventTypes = [CONFIG.EVENTS.CANDIDATE_ENROLLED];
        Logger.log('[WE] → Triggered: CANDIDATE_ENROLLED');
      } else if (newText.toLowerCase().includes('completed')) {
        eventTypes = [CONFIG.EVENTS.CANDIDATE_COMPLETED];
        Logger.log('[WE] → Triggered: CANDIDATE_COMPLETED');
      } else if (isRejected(newText) || isBlocklisted(newText)) {
        if (isBlocklisted(newText)) {
          eventTypes = [CONFIG.EVENTS.CANDIDATE_BLOCKLISTED];
          Logger.log('[WE] → Triggered: CANDIDATE_BLOCKLISTED');
        } else {
          eventTypes = [CONFIG.EVENTS.CANDIDATE_REJECTED_FINAL];
          Logger.log('[WE] → Triggered: CANDIDATE_REJECTED_FINAL');
        }
      } else {
        Logger.log('[WE] ⚠️  Enrolled status "' + newText + '" not recognized. Expected: enrolled/completed/rejected/blocklisted.');
        return;
      }
    } else if (normalizeHeaderName(columnHeader).includes('level 1 schedule')) {
      Logger.log('[WE] 🟢 LEVEL 1 SCHEDULE detected: value="' + newText + '"');
      eventTypes = [CONFIG.EVENTS.INTERVIEW_1_SCHEDULE];
      Logger.log('[WE] → Triggered: INTERVIEW_1_SCHEDULE');
    } else if (rule.conditional === true) {
      // Check for SELECTED (primary option)
      if (isSelected(newText)) {
        eventTypes = [Array.isArray(rule.eventType) ? rule.eventType[0] : rule.eventType];
      } 
      // Check for REJECTED or BLOCKLISTED (secondary option)
      else if (isRejected(newText) || isBlocklisted(newText)) {
        eventTypes = [Array.isArray(rule.eventType) ? rule.eventType[1] : null];
      } else {
        Logger.log('[WE] Conditional column "' + columnHeader + '": value "' + newText + '" not recognized');
        return;
      }
    } else if (rule.conditional === 'NO_RESPONSE') {
      // Special handling for NO_RESPONSE
      if (isNoResponse(newText)) {
        eventTypes = [rule.eventType];
      } else {
        Logger.log('[WE] NO_RESPONSE column "' + columnHeader + '": value "' + newText + '" not NO_RESPONSE');
        return;
      }
    } else {
      eventTypes = Array.isArray(rule.eventType) ? rule.eventType : [rule.eventType];
    }

    // Fetch extra fields specified in the rule
    const fetchData = { newValue: newText, oldValue: oldText, triggerColumn: columnHeader };
    if (rule.fetchFields) {
      rule.fetchFields.forEach(function(fieldHeader) {
        const idx = getColumnIndexByHeader(sheet, fieldHeader);
        if (idx) fetchData[normalizeHeaderName(fieldHeader)] = sheet.getRange(rowIndex, idx).getValue();
      });
    }

    // For status events, ensure the combined message uses the current row's designation and feedback values.
    if (eventTypes.includes(CONFIG.EVENTS.FINAL_SELECTED) || eventTypes.includes(CONFIG.EVENTS.FINAL_REJECTED)) {
      const designationIdx = getColumnIndexByHeader(sheet, CONFIG.HEADERS.DESIGNATION);
      const feedbackIdx = getColumnIndexByHeader(sheet, CONFIG.HEADERS.FEEDBACK_FORM);
      if (designationIdx) {
        fetchData.designation = sheet.getRange(rowIndex, designationIdx).getValue();
      }
      if (feedbackIdx) {
        fetchData['feedback form'] = sheet.getRange(rowIndex, feedbackIdx).getValue();
      }
    }

    eventTypes.forEach(function(eventType) {
      if (!eventType) return;

      // Duplicate guard
      const valueHash = newText + '_' + columnHeader;
      if (isDuplicateMessage(candidate.phone, eventType, rowIndex, valueHash)) {
        Logger.log('[WE] Duplicate prevented: ' + eventType);
        logMessageEvent(candidate, columnHeader, oldText, newText, eventType, 'DUPLICATE', 'Already sent', '');
        return;
      }

      const message = generateMessage(eventType, candidate, fetchData);
      if (!message) {
        Logger.log('[WE] No message generated for: ' + eventType);
        logMessageEvent(candidate, columnHeader, oldText, newText, eventType, 'ERROR', 'Message generation failed', '');
        return;
      }

      queueWhatsApp({ candidate, eventType, triggerColumn: columnHeader, oldText, newText, message });
      markMessageSent(candidate.phone, eventType, rowIndex, valueHash);
      logMessageEvent(candidate, columnHeader, oldText, newText, eventType, 'QUEUED', '', message);
    });

  } catch (err) {
    Logger.log('[WE] handleWorkflowEvent error: ' + err.message);
    logSystemError('handleWorkflowEvent', err.message, err.stack || '');
  }
}

// ── Queue helper ─────────────────────────────────────────────

function queueWhatsApp(opts) {
  const phone  = opts.candidate.phone;
  const waLink = buildWaLink(phone, opts.message);
  WhatsApp.queueMessage({
    rowSource:     opts.candidate.rowIndex,
    name:          opts.candidate.name,
    phone:         phone,
    message:       opts.message,
    eventType:     opts.eventType,
    triggerColumn: opts.triggerColumn,
    oldValue:      opts.oldText,
    newValue:      opts.newText,
    waLink:        waLink,
  });
  Logger.log('[WE] Queued ' + opts.eventType + ' for ' + opts.candidate.name + ' (' + phone + ')');
}

// ── Status message builder ────────────────────────────────────

function buildStatusMessage(name, levelName, statusValue, company) {
  const status = (statusValue || '').toString().trim().toLowerCase();
  const original = (statusValue || '').toString().trim();

  if (status.includes('assigned')) {
    return 'Dear ' + name + ',\n\nWe are pleased to inform you that your ' + levelName + ' interview has been assigned as per our recruitment timeline.\n\nOur Human Resources team will contact you with the interview schedule, duration, panel information, and any preparation materials that may be required.\n\nPlease ensure that your contact information is current and you maintain availability for the scheduled interview slot.\n\nWe appreciate your continued interest in ' + company + ' and look forward to speaking with you.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('progress') || status.includes('in progress')) {
    return 'Dear ' + name + ',\n\nThank you for your participation in the interview process.\n\nThis is to inform you that your ' + levelName + ' interview evaluation is currently under review by our assessment committee.\n\nOur team is thoroughly evaluating your qualifications, technical competency, and overall fit for the position. We will communicate the outcomes within the next 3-5 business days.\n\nWe appreciate your patience during the evaluation process.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('completed')) {
    return 'Dear ' + name + ',\n\nWe would like to thank you for completing your ' + levelName + ' interview with us.\n\nWe genuinely appreciate the time you invested and the thoughtful responses you provided throughout the interview. Your candidature is now being evaluated by our recruitment panel against other qualified candidates.\n\nFurther communication regarding the interview outcome will be shared with you within the stipulated timeframe.\n\nWe will be in touch shortly with updates on your application status.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('incomplete')) {
    return 'Dear ' + name + ',\n\nWe are reaching out as we noticed that your ' + levelName + ' interview has been recorded as incomplete in our system.\n\nThis might have occurred due to technical issues, connectivity problems, or scheduling conflicts. We would like to provide you with an opportunity to complete the interview process.\n\nPlease contact our Human Resources team at your earliest convenience to reschedule your interview. We are committed to ensuring a fair evaluation process for all candidates.\n\nWe look forward to your response.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('not assigned')) {
    return 'Dear ' + name + ',\n\nThank you for your application to ' + company + '.\n\nYour application is currently being reviewed as part of our multi-stage recruitment process. Your ' + levelName + ' interview has not yet been scheduled. We are evaluating all applications systematically and will proceed with scheduling based on our recruitment pipeline.\n\nWe will contact you as soon as your interview slot is confirmed.\n\nThank you for your patience and continued interest.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('selected') || status.includes('round 2') || status.includes('round 3')) {
    return 'Dear ' + name + ',\n\n🎉 *Congratulations!*\n\nWe are delighted to inform you that you have successfully advanced to the next stage of our recruitment process.\n\n*Interview Status Update:* ' + original + '\n\nYour outstanding performance and demonstrated competencies have impressed our evaluation panel. We are pleased to move you forward in our hiring process.\n\nOur Human Resources team will reach out to you shortly with details regarding the next interview round, including date, time, format, and specific focus areas.\n\nWe truly appreciate your time and effort invested in this opportunity. We look forward to continuing our conversation.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('rejected') || status.includes('not selected')) {
    return 'Dear ' + name + ',\n\nThank you for your participation in the interview process with ' + company + '.\n\nAfter a thorough evaluation of your qualifications and interview performance, we regret to inform you that we will not be proceeding further with your candidature at this time.\n\nThis decision was made after careful consideration by our recruitment panel. While you demonstrated certain strengths, there were other candidates whose profiles more closely matched our current organizational requirements.\n\nWe encourage you to keep strengthening your technical skills, domain expertise, and professional capabilities. We would welcome your application for future opportunities that may align better with your profile.\n\nThank you once again for your time and interest in ' + company + '.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('no response')) {
    return 'Dear ' + name + ',\n\nWe are reaching out regarding your scheduled ' + levelName + ' interview with ' + company + '.\n\nUnfortunately, we have not received any response or confirmation from you for the scheduled interview slot. We value your candidature and would like to provide you with another opportunity.\n\nPlease contact our Human Resources team immediately if you wish to proceed with the interview. We are flexible with rescheduling and will work with you to find a mutually convenient time.\n\nIf we do not hear from you within the next 24 hours, we may consider your application as withdrawn from further consideration.\n\nWe look forward to hearing from you.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else {
    return 'Dear ' + name + ',\n\nWe are writing to update you on your interview status with ' + company + '.\n\n*Current Status Update:* ' + original + '\n\nOur Human Resources and recruitment team is actively reviewing your application and interview performance as part of our comprehensive evaluation process.\n\nThis status update reflects the latest progression of your candidature through our multi-stage recruitment pipeline.\n\nShould you require any clarification or have specific queries regarding your application, please feel free to contact our Human Resources department directly. We are here to assist you.\n\nThank you for your continued interest in becoming part of our organization.\n\nBest regards,\nHuman Resources Department\n' + company;
  }
}

// ── Enrolled Status message builder ──────────────────────

function buildEnrolledStatusMessage(name, enrolledValue, feedbackFormLink, company) {
  const status = (enrolledValue || '').toString().trim().toLowerCase();
  const original = (enrolledValue || '').toString().trim();
  const feedbackLink = (feedbackFormLink || '').toString().trim();

  if (status.includes('enrolled')) {
    return 'Dear ' + name + ',\n\n🎉 *Congratulations!*\n\nYou have been successfully enrolled as an intern at ' + company + '!\n\nWe are excited to have you join our team. Your selection reflects your potential, enthusiasm, and commitment demonstrated during the assessment process.\n\n*What\'s Next:*\nOur team will reach out to you shortly with:\n• Onboarding formalities and documentation\n• Reporting structure and team details\n• Internship duration and schedule\n• Initial project assignments and expectations\n• Training and mentorship details\n\nWelcome aboard! We look forward to supporting your professional growth and learning journey with us.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (status.includes('rejected') || status.includes('blocklisted')) {
    var message = 'Dear ' + name + ',\n\nThank you for your participation in the internship recruitment process with ' + company + '.\n\nAfter careful review of all candidates, we regret to inform you that you have not been selected for enrollment at this time.\n\nThis was a competitive process with many qualified candidates. While you demonstrated certain strengths, we have selected candidates whose profiles more closely aligned with our current organizational needs.\n\n*We value your feedback:*\nTo help us improve our recruitment and selection process, we would greatly appreciate your feedback on your experience with us.\n\n';
    if (feedbackLink) {
      message += 'Please take a few moments to complete our feedback form:\n' + feedbackLink + '\n\n';
    }
    message += 'We encourage you to continue strengthening your technical skills and professional capabilities. We would welcome your application for future opportunities that may align better with your profile.\n\nThank you for your time and interest in ' + company + '.\n\nBest regards,\nHuman Resources Department\n' + company;
    return message;
  } else if (status.includes('completed')) {
    var message = 'Dear ' + name + ',\n\n🎓 *Congratulations on Completing Your Internship!*\n\nWe are pleased to inform you that your internship with ' + company + ' has been marked as completed.\n\nThis is a significant milestone in your professional journey. Throughout your tenure with us, you have demonstrated:\n• Strong technical capabilities and problem-solving skills\n• Commitment to delivering quality work\n• Positive collaboration with team members\n• Willingness to learn and grow professionally\n\n*Your Achievements:*\nYour contributions to our projects and team have been valuable. The experience and knowledge you gained during this internship will serve you well in your future career.\n\n*We Value Your Feedback:*\nAs you conclude your internship, we would greatly appreciate your feedback on your experience with ' + company + '. Your insights will help us continue to improve our internship program and organizational culture.\n\n';
    if (feedbackLink) {
      message += '📋 *Please complete our feedback form:*\n' + feedbackLink + '\n\n';
    }
    message += 'We wish you all the best in your future endeavors. We hope to remain connected and welcome you to apply for future full-time opportunities with our organization.\n\nThank you for being part of the ' + company + ' family!\n\nBest regards,\nHuman Resources Department\n' + company;
    return message;
  } else {
    return 'Dear ' + name + ',\n\nYour enrollment status has been updated to: ' + original + '\n\nPlease contact our Human Resources team for further details.\n\nBest regards,\nHuman Resources Department\n' + company;
  }
}

// ── Designation message builder ──────────────────────────────

function buildDesignationMessage(name, designationValue, company) {
  const designation = (designationValue || '').toString().trim().toLowerCase();
  const original = (designationValue || '').toString().trim();

  if (designation.includes('beginner')) {
    return 'Dear ' + name + ',\n\nWe are pleased to inform you that your professional designation has been set to *Beginner Level* with ' + company + '.\n\n*Designation Level:* Beginner\n\nAt this level, you will focus on:\n• Building foundational knowledge and skills in your domain\n• Learning industry best practices and methodologies\n• Receiving mentorship from senior team members\n• Developing a strong understanding of our organizational processes and culture\n\nYour role will include structured learning opportunities, hands-on projects, and regular feedback sessions to support your professional growth.\n\nWe are committed to nurturing your talent and helping you progress through your career journey with us.\n\nShould you have any questions or require further clarification, please reach out to our Human Resources department.\n\nWe look forward to your contributions and growth.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (designation.includes('learner')) {
    return 'Dear ' + name + ',\n\nWe are pleased to inform you that your professional designation has been updated to *Learner Level* with ' + company + '.\n\n*Designation Level:* Learner\n\nAt this level, you will:\n• Deepen your technical and domain expertise\n• Take on increasingly complex projects and responsibilities\n• Mentor junior team members and contribute to knowledge sharing\n• Participate in advanced training and professional development programs\n• Collaborate with cross-functional teams on strategic initiatives\n\nThis level represents significant progress in your professional journey. We recognize your commitment and potential for continued growth.\n\nYou will have access to additional learning resources, certification programs, and career advancement opportunities.\n\nCongratulations on this milestone. We are excited to see you grow and contribute even more meaningfully to our organization.\n\nFor any questions regarding your new role and responsibilities, please contact our Human Resources department.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else if (designation.includes('professional') || designation.includes('professionalist')) {
    return 'Dear ' + name + ',\n\nWe are delighted to inform you that your professional designation has been elevated to *Professional Level* with ' + company + '.\n\n*Designation Level:* Professional\n\n🎉 This promotion reflects:\n• Your exceptional technical competency and domain expertise\n• Consistent demonstration of professional excellence\n• Strong leadership qualities and team contribution\n• Commitment to organizational goals and values\n\nAt the Professional level, you will:\n• Lead critical projects and strategic initiatives\n• Provide technical guidance and mentorship to team members\n• Participate in decision-making and policy development\n• Represent the organization in client and stakeholder interactions\n• Contribute to innovation and process improvement\n\nThis is a significant recognition of your capabilities and dedication. We have confidence in your ability to excel at this level and drive positive impact across the organization.\n\nYour career trajectory with us is a testament to your professional growth. We look forward to your continued contributions as a valued member of our senior team.\n\nPlease schedule a meeting with our Human Resources department to discuss your new responsibilities, expectations, and benefits associated with this designation.\n\nCongratulations once again on this well-deserved promotion.\n\nBest regards,\nHuman Resources Department\n' + company;
  } else {
    return 'Dear ' + name + ',\n\nWe are writing to inform you that your professional designation has been updated within our organization.\n\n*New Designation:* ' + original + '\n\nThis designation change reflects our assessment of your skills, experience, and contributions to ' + company + '. Your new role comes with updated responsibilities, expectations, and opportunities for professional development.\n\nOur Human Resources team will provide you with detailed information regarding:\n• Job responsibilities and key deliverables\n• Performance expectations and KPIs\n• Available training and development opportunities\n• Compensation and benefits adjustments (if applicable)\n• Career progression pathways\n\nWe are confident that you will excel in this new role and continue to make valuable contributions to our organization.\n\nPlease feel free to reach out to our Human Resources department if you have any questions or require clarification regarding your new designation.\n\nThank you for your continued dedication and commitment.\n\nBest regards,\nHuman Resources Department\n' + company;
  }
}

function generateMessage(eventType, candidate, fetchData) {
  fetchData = fetchData || {};
  const name      = candidate.name || 'Candidate';
  const company   = CONFIG.COMPANY_NAME;
  // ▶ FIX: use fetchData.newValue (passed in from handleWorkflowEvent)
  const newValue  = (fetchData.newValue || '').toString().trim();

  function fd(key) {
    return fetchData[normalizeHeaderName(key)] ||
           candidate[normalizeHeaderName(key).replace(/ /g, '_')] || '';
  }

  try {
    switch (eventType) {

      case CONFIG.EVENTS.FORM_SUBMIT:
        return 'Hello ' + name + ',\n\nThank you for applying for the internship program at ' + company + '! 🚀\n\nWe have received your application and will review it shortly.\n\n✅ Next Steps:\n• Our team will evaluate your profile\n• You\'ll receive updates on your application status via WhatsApp\n• Be prepared for potential interview rounds\n\nWe appreciate your interest in joining our innovation-driven team!\n\nBest wishes,\n' + company;

      case CONFIG.EVENTS.INTERVIEW_1_SCHEDULE:
        return 'Hello ' + name + ',\n\nThank you for applying for the internship at ' + company + '! 🚀\n\nWe\'re excited to see your interest in being part of our innovation-driven team and contributing to real-world tech projects.\n\n📞 This message confirms your First-Level Interview Call.\n🕒 Interview scheduled: ' + (newValue || 'Today') + '\nKindly be available to attend a call from our team shortly.\n\nBest wishes,\n' + company;

      case CONFIG.EVENTS.INTERVIEW_ROUND_1_SELECTED:
        return 'Hello ' + name + ',\n\nGreetings from ' + company + '.\n\nBased on your initial screening, you have been shortlisted for the Second-Level (Non-Technical) Interview Call.\n\n📞 Interview Type: HR / Non-Technical Discussion\n🕒 Scheduled: Today\n\nThis discussion will focus on your career goals, learning mindset, availability, and cultural alignment.\n\nKindly ensure your availability at the scheduled time.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_ROUND_1_REJECTED:
        return 'Hello ' + name + ',\n\nThank you for attending the Level-1 Interview process.\n\nAfter careful evaluation, you were not selected for the next round.\n\nWe appreciate your effort and encourage you to continue strengthening your domain knowledge and technical skills.\n\nWe hope to connect with you again in future opportunities.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_1_NO_RESPONSE:
        return 'Hello ' + name + ',\n\nWe have tried to reach you regarding your scheduled interview, but have not received a response.\n\nIf you still wish to participate in the interview process, please reach out to us as soon as possible.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_1_STATUS_CHANGED:
        // ▶ FIX: was `newText` (undefined in this scope) — now uses `newValue`
        return buildStatusMessage(name, 'Level 1 Interview', newValue, company);

      case CONFIG.EVENTS.INTERVIEW_2_SCHEDULE:
        return 'Hello ' + name + ',\n\nGreetings from ' + company + '.\n\nBased on your initial screening, you have been shortlisted for the Second-Level (Non-Technical) Interview Call.\n\n📞 Interview Type: HR / Non-Technical Discussion\n🕒 Scheduled: ' + (newValue || 'Today') + '\n\nThis discussion will focus on your career goals, learning mindset, availability, and cultural alignment.\n\nKindly ensure your availability at the scheduled time.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_ROUND_2_SELECTED:
        return 'Hello ' + name + ',\n\nGreetings from *' + company + '*.\n\n✅ Based on your performance, you have been shortlisted for the *next interview round*.\n\nFurther instructions will be shared shortly.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_ROUND_2_REJECTED:
        return 'Hello ' + name + ',\n\nThank you for participating in the Level-2 Interview process.\n\nAfter review, you were not selected for the next round.\n\nWe sincerely appreciate your effort and interest. Keep improving your technical and professional skills.\n\nBest wishes for your future career.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_2_STATUS_CHANGED:
        // ▶ FIX: was `newText` (undefined) — now uses `newValue`
        return buildStatusMessage(name, 'Level 2 Interview', newValue, company);

      case CONFIG.EVENTS.INTERVIEW_2_NO_RESPONSE:
        return 'Hello ' + name + ',\n\nWe have tried to reach you regarding your scheduled Level-2 interview, but have not received a response.\n\nIf you still wish to participate in the interview process, please reach out to us as soon as possible.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_3_SCHEDULE:
        return 'Hello ' + name + ',\n\n📞 *Final Technical Interview Scheduled*\n\n🕒 Scheduled:\n' + formatDateTime(candidate.interview_3_dt) + '\n\nPlease be prepared to discuss your task submission, technical approach, and problem-solving experience.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_ROUND_3_SELECTED:
      // ▶ FIX: falls through to TASK_ASSIGNMENT which now has proper greeting
      case CONFIG.EVENTS.TASK_ASSIGNMENT:
        // ▶ COMBINED MESSAGE: Task Detail + Deadline + Task Status
        const taskDetail = fd('task detail') || 'Your assigned task';
        const taskDeadline = formatDateTime(fd('task deadline') || fd('task dead line') || candidate.task_deadline);
        const taskStatus = fd('task status') || fd('task staus') || 'Assigned';
        return 'Hello ' + name + ',\n\n' +
               '📋 *TASK ASSIGNMENT*\n\n' +
               '*Task Details:*\n' + taskDetail + '\n\n' +
               '*Deadline:*\n' + taskDeadline + '\n\n' +
               '*Current Status:*\n' + taskStatus + '\n\n' +
               'Please ensure the task is completed and submitted within the given timeline.\n\n' +
               'If you have any questions or require clarification, please contact the HR Team.\n\n' +
               'Reply "YES" to confirm within 48 hours or it will be considered as rejected.\n\n' +
               'Regards,\nHR Team\n' + company;

      case CONFIG.EVENTS.TASK_STATUS_CHANGED:
        return 'Hello ' + name + ',\n\nYour task status has been updated.\n\n📋 Task Details:\n' + (fd('task detail') || 'Your assigned task') + '\n\n⏰ Deadline:\n' + formatDateTime(fd('task dead line') || candidate.task_deadline) + '\n\nPlease refer to your dashboard for more information.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.INTERVIEW_ROUND_3_REJECTED:
        return 'Hello ' + name + ',\n\nThank you for participating in the Level-3 Interview process.\n\nAfter evaluation, you were not selected for the next round.\n\nWe truly appreciate your effort and dedication. We wish you all the best for your future.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.FINAL_SELECTED:
        // ▶ COMBINED MESSAGE: Status + Designation + Feedback Form
        const designation_selected = fd('designation') || fd('desgination') || candidate.designation || 'Intern';
        const feedbackLink_selected = fd('feedback form') || fd('feedbackform') || '';
        let msg_selected = 'Dear ' + name + ',\n\nWe are pleased to inform you that, based on your overall performance in the evaluation process, you have been selected for the Internship Program at ' + company + ' under the ' + designation_selected + ' level category.\n\nThis opportunity is designed to provide you with practical exposure, structured learning, and hands-on experience in a professional work environment. Your selection reflects your dedication, potential, and commitment demonstrated throughout the assessment stages.\n\n*Designation Level:* ' + designation_selected + '\n\nFurther details regarding onboarding formalities, reporting structure, internship duration, and initial assignments will be shared with you shortly through a separate communication.\n\nPlease confirm your acceptance of this offer by replying to this message at your earliest convenience.\n\nWe are excited to welcome you to our team and look forward to supporting your professional growth.\n\nRegards,\nHR Team\n' + company;
        if (feedbackLink_selected) {
          msg_selected += '\n*Your Feedback:*\n' + feedbackLink_selected + '\n';
        }
        return msg_selected;

      case CONFIG.EVENTS.DESIGNATION_NOTIFICATION:
        return buildDesignationMessage(name, (candidate.designation || fd('designation') || 'Unknown'), company);

      // ── NEW: Designation Status changed ──────────────────
      case CONFIG.EVENTS.DESIGNATION_STATUS_CHANGED:
        return 'Hello ' + name + ',\n\nYour designation status has been updated to: *' + (newValue || 'N/A') + '*\n\nDesignation: *' + (candidate.designation || fd('designation') || 'N/A') + '*\n\nIf you have any questions, please reach out to the HR Team.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.DATA_UPDATED:
        return 'Hello ' + name + ',\n\nYour record has been updated on the recruitment sheet.\n\nUpdated field: *' + (fetchData.triggerColumn || 'Unknown') + '*\nNew value: *' + (newValue || 'N/A') + '*\n\nIf this update is incorrect, please reply here.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.FINAL_REJECTED:
        // ▶ COMBINED MESSAGE: Status + Designation + Feedback Form
        const feedbackLink_rejected = fd('feedback form') || fd('feedbackform') || '';
        let msg_rejected = 'Thank you for participating in the internship recruitment process at *' + company + '*.\n\nAfter careful consideration of all candidates, we regret to inform you that you have not been selected for the final internship list at this time.\n\nThis was a highly competitive process with many qualified candidates. While you demonstrated certain strengths, we have selected candidates whose profiles more closely aligned with our current organizational requirements.\n\nWe appreciate your effort, time, and genuine interest. We encourage you to continue strengthening your technical skills, domain expertise, and professional capabilities.\n\n';
        if (feedbackLink_rejected) {
          msg_rejected += '*We Value Your Feedback:*\nPlease help us improve by sharing your feedback:\n' + feedbackLink_rejected + '\n\n';
        }
        msg_rejected += 'We would welcome your application for future opportunities that may align better with your profile.\n\nBest wishes for your future career!\n\nRegards,\nHR Team\n' + company;
        return msg_rejected;

      case CONFIG.EVENTS.FEEDBACK_FORM:
        return 'Hello ' + name + ',\n\nPlease complete the feedback form for our recruitment process:\n\n' + (fd('feedback form') || 'Link will be shared shortly') + '\n\nYour response helps us improve our process.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.TASK_REMINDER_1DAY:
        return 'Hello ' + name + ',\n\n⚠️ *Reminder:* Your assigned task deadline is *tomorrow*.\n\n🕒 Deadline:\n' + formatDateTime(candidate.task_deadline) + '\n\nPlease submit on time.\n\nRegards,\nHR Team\n' + company;

      case CONFIG.EVENTS.TASK_REMINDER_SAME_DAY:
        return 'Hello ' + name + ',\n\n🔔 *Final Reminder:* Your task is due *today*!\n\n🕒 Deadline:\n' + formatDateTime(candidate.task_deadline) + '\n\nPlease submit before the deadline.\n\nRegards,\nHR Team\n' + company;

      // ── NEW: Enrolled status messages ────────────────────
      case CONFIG.EVENTS.CANDIDATE_ENROLLED:
        return buildEnrolledStatusMessage(name, 'enrolled', fd('feedback form'), company);

      case CONFIG.EVENTS.CANDIDATE_REJECTED_FINAL:
        return buildEnrolledStatusMessage(name, 'rejected', fd('feedback form'), company);

      case CONFIG.EVENTS.CANDIDATE_BLOCKLISTED:
        return buildEnrolledStatusMessage(name, 'blocklisted', fd('feedback form'), company);

      case CONFIG.EVENTS.CANDIDATE_COMPLETED:
        return buildEnrolledStatusMessage(name, 'completed', fd('feedback form'), company);

      default:
        Logger.log('[WE] Unknown event: ' + eventType);
        return null;
    }
  } catch (err) {
    Logger.log('[WE] generateMessage error for ' + eventType + ': ' + err.message);
    return null;
  }
}
