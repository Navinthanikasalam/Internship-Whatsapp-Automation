// ============================================================
// SHINE CRAFT TECHNOLOGY
// File: DoGet_DoPost.gs
// Purpose: Web app endpoints for Chrome extension and queue access.
// ============================================================

function doGet(e) {
  try {
    // Default to getPending if no action specified (most common use case)
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getPending';
    const limit = e && e.parameter && e.parameter.limit ? Number(e.parameter.limit) : undefined;

    // Prefer WhatsApp API if present, otherwise try MessageQueue.
    // Wrap in try/catch to avoid ReferenceError escaping as raw text to clients.
    let api = null;
    try {
      api = (typeof WhatsApp !== 'undefined' && WhatsApp)
        ? WhatsApp
        : (typeof MessageQueue !== 'undefined' && MessageQueue)
          ? MessageQueue
          : null;
    } catch (selectErr) {
      Logger.log('[DoGet] API selection error: ' + selectErr.message);
      api = (typeof MessageQueue !== 'undefined' && MessageQueue) ? MessageQueue : null;
    }

    if (!api) {
      return buildResponse({ success: false, error: 'Server queue API not available' });
    }

    if (action === 'getPending') {
      const fn = api.getPendingMessages
        ? api.getPendingMessages
        : api.getPending
          ? api.getPending
          : null;

      if (typeof fn !== 'function') {
        return buildResponse({ success: false, error: 'getPending handler not found' });
      }

      const messages = typeof limit === 'number' ? fn.call(api, limit) : fn.call(api);
      Logger.log('[DoGet] getPending -> count=' + (messages && messages.length ? messages.length : 0));
      return buildResponse({ success: true, data: messages });
    }

    if (action === 'getDashboard') {
      const countFn = api.countQueueStatus
        ? api.countQueueStatus
        : function () { return 0; };

      return buildResponse({
        success: true,
        data: {
          totalPending: countFn.call(api, 'PENDING'),
          totalSent: countFn.call(api, 'SENT'),
          totalFailed: countFn.call(api, 'FAILED'),
        },
      });
    }

    return buildResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return buildResponse({ success: false, error: err && err.message ? err.message : String(err) });
  }
}

function doPost(e) {
  try {
    const bodyStr = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(bodyStr || '{}');

    let api = null;
    try {
      api = (typeof WhatsApp !== 'undefined' && WhatsApp)
        ? WhatsApp
        : (typeof MessageQueue !== 'undefined' && MessageQueue)
          ? MessageQueue
          : null;
    } catch (selectErr) {
      Logger.log('[DoPost] API selection error: ' + selectErr.message);
      api = (typeof MessageQueue !== 'undefined' && MessageQueue) ? MessageQueue : null;
    }

    if (!api) {
      return buildResponse({ success: false, error: 'Server queue API not available' });
    }

    if (body.action === 'markSent') {
      const fn = api.markMessageAsSent
        ? api.markMessageAsSent
        : api.markSent
          ? api.markSent
          : null;

      if (typeof fn !== 'function') {
        return buildResponse({ success: false, error: 'markSent handler not found' });
      }

      if (typeof fn !== 'function') return buildResponse({ success: false, error: 'markSent handler not found' });
      fn.call(api, body.queueId);
      return buildResponse({ success: true });
    }

    if (body.action === 'markFailed') {
      const fn = api.markMessageAsFailed
        ? api.markMessageAsFailed
        : api.markFailed
          ? api.markFailed
          : null;

      if (typeof fn !== 'function') {
        return buildResponse({ success: false, error: 'markFailed handler not found' });
      }

      fn.call(api, body.queueId, body.reason || 'Unknown error');
      return buildResponse({ success: true });
    }

    return buildResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return buildResponse({ success: false, error: err && err.message ? err.message : String(err) });
  }
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}