// ============================================================
// SHINE CRAFT TECHNOLOGY  |  TESTING_GUIDE.gs
// Step-by-step verification of combined message automation
// ============================================================

/**
 * 🧪 TEST 1: Task Status Combined Message
 * 
 * Expected Flow:
 * 1. Change Task status dropdown → ONLY Task status triggers (not Task detail/Deadline)
 * 2. System fetches Task detail + Deadline automatically
 * 3. Creates ONE combined message with all three fields
 * 4. Message queued to "Message Queue" sheet
 * 5. Chrome extension sends via WhatsApp
 * 
 * DO THIS NOW:
 * 1. Open your Google Sheet
 * 2. Find any data row (not header row)
 * 3. Go to "Task status" column
 * 4. Change it to "Assigned" (or any valid dropdown value)
 * 5. Wait 5 seconds
 * 6. Check "Message Queue" sheet for new PENDING message
 * 7. Message should show:
 *    - Task Details: [content from Task detail column]
 *    - Deadline: [date/time from Deadline column]
 *    - Current Status: Assigned
 * 
 * ✅ PASS: Message appears with all three fields combined
 * ❌ FAIL: No message appears, or only one field shows
 */
function testTaskStatusMessage() {
  Logger.log('\n🧪 TEST 1: Task Status Combined Message');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Change Task status dropdown to "Assigned"');
  Logger.log('Step 2: Wait 5 seconds');
  Logger.log('Step 3: Check Message Queue sheet');
  Logger.log('Expected: Message with Task Detail + Deadline + Status');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🧪 TEST 2: Status Combined Message (Selected)
 * 
 * Expected Flow:
 * 1. Change Status dropdown to "Selected" → ONLY Status triggers (not Designation/Feedback Form)
 * 2. System fetches Designation + Feedback Form automatically
 * 3. Creates ONE combined message with all three fields
 * 4. Message queued to "Message Queue" sheet
 * 5. Chrome extension sends via WhatsApp
 * 
 * DO THIS NOW:
 * 1. Open your Google Sheet
 * 2. Find any data row
 * 3. Go to "Status" column
 * 4. Change it to "Selected"
 * 5. Wait 5 seconds
 * 6. Check "Message Queue" sheet for new PENDING message
 * 7. Message should show:
 *    - Selection congratulation message
 *    - Designation Level: [content from Designation column]
 *    - Your Feedback: [link from Feedback Form column]
 * 
 * ✅ PASS: Message appears with all three fields combined
 * ❌ FAIL: No message appears, or fields missing
 */
function testStatusSelectedMessage() {
  Logger.log('\n🧪 TEST 2: Status Combined Message (Selected)');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Change Status dropdown to "Selected"');
  Logger.log('Step 2: Wait 5 seconds');
  Logger.log('Step 3: Check Message Queue sheet');
  Logger.log('Expected: Message with Status + Designation + Feedback Form');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🧪 TEST 3: Status Combined Message (Rejected)
 * 
 * Expected Flow:
 * 1. Change Status dropdown to "Rejected" → Triggers FINAL_REJECTED (not FINAL_SELECTED)
 * 2. System fetches Designation + Feedback Form automatically
 * 3. Creates ONE combined rejection message
 * 4. Message includes feedback form link for improvement
 * 
 * DO THIS NOW:
 * 1. Open your Google Sheet
 * 2. Find any data row
 * 3. Go to "Status" column
 * 4. Change it to "Rejected"
 * 5. Wait 5 seconds
 * 6. Check "Message Queue" sheet for new PENDING message
 * 7. Message should show rejection message with Feedback Form link
 * 
 * ✅ PASS: Message appears with rejection content + Feedback Form
 * ❌ FAIL: No message appears, or shows selection instead of rejection
 */
function testStatusRejectedMessage() {
  Logger.log('\n🧪 TEST 3: Status Combined Message (Rejected)');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Change Status dropdown to "Rejected"');
  Logger.log('Step 2: Wait 5 seconds');
  Logger.log('Step 3: Check Message Queue sheet');
  Logger.log('Expected: Rejection message with Feedback Form');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🧪 TEST 4: Enrolled Status Combined Message (Enrolled)
 * 
 * Expected Flow:
 * 1. Change Enrolled Status dropdown to "ENROLLED"
 * 2. System fetches Feedback Form automatically
 * 3. Creates ONE combined enrollment message
 * 4. Message includes onboarding info + Feedback Form link
 * 
 * DO THIS NOW:
 * 1. Open your Google Sheet
 * 2. Find any data row
 * 3. Go to "Enrolled Status" column
 * 4. Change it to "ENROLLED"
 * 5. Wait 5 seconds
 * 6. Check "Message Queue" sheet for new PENDING message
 * 7. Message should show congratulations + onboarding details + Feedback Form
 * 
 * ✅ PASS: Message appears with enrollment + Feedback Form
 * ❌ FAIL: No message appears
 */
function testEnrolledStatusMessage() {
  Logger.log('\n🧪 TEST 4: Enrolled Status Combined Message (Enrolled)');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Change Enrolled Status dropdown to "ENROLLED"');
  Logger.log('Step 2: Wait 5 seconds');
  Logger.log('Step 3: Check Message Queue sheet');
  Logger.log('Expected: Enrollment message with Feedback Form');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🧪 TEST 5: Task Detail Text Field (Should NOT Queue)
 * 
 * Expected Flow:
 * 1. Change Task detail text field (type something)
 * 2. System should NOT trigger message (only dropdown triggers)
 * 3. No message appears in Message Queue
 * 
 * DO THIS NOW:
 * 1. Open your Google Sheet
 * 2. Find any data row
 * 3. Go to "Task detail" column
 * 4. Edit the text (e.g., add extra word)
 * 5. Wait 5 seconds
 * 6. Check "Message Queue" sheet
 * 
 * ✅ PASS: NO new message appears (correct behavior)
 * ❌ FAIL: Message appears (wrong - should only trigger from dropdown)
 */
function testTaskDetailNoTrigger() {
  Logger.log('\n🧪 TEST 5: Task Detail Text Field (Should NOT Queue)');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Edit Task detail text field');
  Logger.log('Step 2: Wait 5 seconds');
  Logger.log('Step 3: Check Message Queue sheet');
  Logger.log('Expected: NO new message (only Task status dropdown should trigger)');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🧪 TEST 6: Deadline Text Field (Should NOT Queue)
 * 
 * Expected Flow:
 * 1. Change Deadline text field (type something)
 * 2. System should NOT trigger message (only Task status dropdown triggers)
 * 3. No message appears in Message Queue
 * 
 * DO THIS NOW:
 * 1. Open your Google Sheet
 * 2. Find any data row
 * 3. Go to "Deadline" column
 * 4. Edit the text
 * 5. Wait 5 seconds
 * 6. Check "Message Queue" sheet
 * 
 * ✅ PASS: NO new message appears (correct behavior)
 * ❌ FAIL: Message appears (wrong - should only trigger from dropdown)
 */
function testDeadlineNoTrigger() {
  Logger.log('\n🧪 TEST 6: Deadline Text Field (Should NOT Queue)');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Edit Deadline text field');
  Logger.log('Step 2: Wait 5 seconds');
  Logger.log('Step 3: Check Message Queue sheet');
  Logger.log('Expected: NO new message (only Task status dropdown should trigger)');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🧪 TEST 7: End-to-End Chrome Extension Send
 * 
 * Expected Flow:
 * 1. Task Status message queued
 * 2. Chrome extension polls Message Queue every 60 seconds
 * 3. Extension opens WhatsApp Web tab
 * 4. Extension pre-fills message
 * 5. Extension clicks send button
 * 6. Message sent to WhatsApp number
 * 7. Message Queue status updated to "SENT"
 * 
 * DO THIS NOW:
 * 1. Complete TEST 1 (Task Status message)
 * 2. Wait 60 seconds (extension polling interval)
 * 3. Check your WhatsApp:
 *    - New message from test phone number
 *    - Should include Task Detail + Deadline + Status
 * 4. Check "Message Queue" sheet:
 *    - Message status should be "SENT"
 *    - SentAt should show current timestamp
 * 
 * ✅ PASS: WhatsApp message received + Message Queue shows SENT
 * ❌ FAIL: Message not sent, or status not updated
 */
function testEndToEndExtensionSend() {
  Logger.log('\n🧪 TEST 7: End-to-End Chrome Extension Send');
  Logger.log('═'.repeat(70));
  Logger.log('Step 1: Complete TEST 1 (Task Status message queued)');
  Logger.log('Step 2: Wait 60 seconds (extension polling)');
  Logger.log('Step 3: Check WhatsApp on test phone');
  Logger.log('Step 4: Check Message Queue sheet status');
  Logger.log('Expected: WhatsApp message received + status = SENT');
  Logger.log('═'.repeat(70) + '\n');
}

/**
 * 🔧 DEBUG: Run all diagnostic checks
 */
function runAllTests() {
  testTaskStatusMessage();
  testStatusSelectedMessage();
  testStatusRejectedMessage();
  testEnrolledStatusMessage();
  testTaskDetailNoTrigger();
  testDeadlineNoTrigger();
  testEndToEndExtensionSend();
  
  Logger.log('\n\n✅ ALL TESTS PRINTED TO LOGS');
  Logger.log('Follow each test step in order');
  Logger.log('Use menu: ShineCraft ATS → 🔍 DEBUG: Message Queue Analysis between tests');
}

// ============================================================
// VERIFICATION CHECKLIST
// ============================================================

/**
 * VERIFICATION CHECKLIST:
 * 
 * Before running tests:
 * □ Config.gs WORKFLOW_RULES updated (Task status, Status, Enrolled Status only)
 * □ WorkflowEngine.gs has Status/Enrolled Status special handling
 * □ Message generation includes fetchData fields
 * □ Chrome extension configured with correct AppScript URL
 * 
 * During testing:
 * □ TEST 1: Task Status → Combined message with all 3 fields
 * □ TEST 2: Status=Selected → Combined message with Designation + Feedback
 * □ TEST 3: Status=Rejected → Rejection message with Feedback
 * □ TEST 4: Enrolled Status=ENROLLED → Enrollment message with Feedback
 * □ TEST 5: Task detail change → NO message (correct)
 * □ TEST 6: Deadline change → NO message (correct)
 * □ TEST 7: Chrome extension → Message sent to WhatsApp within 60 sec
 * 
 * Expected Results:
 * ✅ Dropdowns trigger combined messages
 * ✅ Text fields do NOT trigger messages
 * ✅ Multiple related fields combined into ONE message
 * ✅ Related fields auto-fetched from same row
 * ✅ Messages queue to "Message Queue" sheet
 * ✅ Chrome extension detects and sends via WhatsApp
 * ✅ Status updated to "SENT" after successful send
 */
