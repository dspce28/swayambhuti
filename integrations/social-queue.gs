/**
 * Swayambhuti social queue — the Google Sheet Sunil approves posts in.
 * The GitHub automation (automation/) reads and writes it through this web app.
 *
 * Setup (≈5 minutes):
 *  1. Create a Google Sheet, e.g. "Swayambhuti — Social queue".
 *  2. Extensions → Apps Script. Delete the sample code, paste this whole file, Save.
 *  3. Project Settings → Script properties → add SECRET = a long random phrase (keep it private).
 *  4. Run the function `setup` once (Run ▶, authorise). It creates the Queue, Config and Log tabs.
 *  5. Deploy → New deployment → "Web app". Execute as: Me. Who has access: Anyone. Copy the /exec URL.
 *  6. In GitHub → repo → Settings → Secrets and variables → Actions, add:
 *       SOCIAL_SHEET_URL    = the /exec URL
 *       SOCIAL_SHEET_SECRET = the same phrase as SECRET
 *  7. In the Config tab, set NOTIFY_EMAIL to the address that should get "new drafts" emails.
 *
 * How Sunil uses it: new drafts arrive with Status = Pending. Edit the text in the "Final" column,
 * set Status to Approved or Rejected, and optionally say why in "Notes for Claude".
 * Only Approved rows are posted, at their Planned time.
 */

var QUEUE = 'Queue';
var COLS = [
  'ID', 'Created', 'Platform', 'Format', 'Planned (IST)', 'Pillar', 'Topic', 'Source', 'Draft (AI)',
  'Final (edit this)', 'Preview', 'Images', 'Status', 'Notes for Claude', 'Approved by',
  'Posted at', 'Post URL', 'Error', 'Learned',
];
var KEYS = [
  'id', 'created', 'platform', 'format', 'planned', 'pillar', 'topic', 'source', 'draft',
  'final', 'preview', 'images', 'status', 'notes', 'approvedBy',
  'postedAt', 'postUrl', 'error', 'learned',
];
var STATUSES = ['Pending', 'Approved', 'Rejected', 'Publishing', 'Posted', 'Failed', 'Check manually'];
var CONFIG_DEFAULTS = [
  ['AUTOPILOT', 'OFF', 'ON = new drafts that pass the quality check are pre-approved (you can still reject before the planned time). Switch on only when Sunil says so.'],
  ['PAUSED', 'NO', 'YES = nothing is posted at all (emergency stop).'],
  ['NOTIFY_EMAIL', '', 'Who gets "new drafts to review" and warning emails.'],
  ['LINKEDIN_TOKEN_EXPIRES', '', 'YYYY-MM-DD — date the LinkedIn token expires (≈60 days after connecting).'],
  ['INSTAGRAM_TOKEN_EXPIRES', '', 'YYYY-MM-DD — date the Instagram token expires.'],
  ['READINESS', '', 'Written by the weekly learning job: how often Sunil still edits drafts.'],
];

function setup() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var q = book.getSheetByName(QUEUE) || book.insertSheet(QUEUE);
  if (q.getLastRow() === 0) {
    q.appendRow(COLS);
    q.setFrozenRows(1);
    q.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#0a1d14').setFontColor('#f6efe0');
    q.setColumnWidth(KEYS.indexOf('draft') + 1, 320);
    q.setColumnWidth(KEYS.indexOf('final') + 1, 420);
    q.setColumnWidth(KEYS.indexOf('preview') + 1, 160);
    q.hideColumns(KEYS.indexOf('draft') + 1);
  }
  var statusCol = KEYS.indexOf('status') + 1;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
  q.getRange(2, statusCol, 1000, 1).setDataValidation(rule);
  // Times are stored as plain text "YYYY-MM-DDTHH:mm" (IST) so Sheets never re-interprets them in another timezone.
  ['created', 'planned', 'postedAt'].forEach(function (k) {
    q.getRange(2, KEYS.indexOf(k) + 1, 1000, 1).setNumberFormat('@');
  });
  var wrap = q.getRange(2, KEYS.indexOf('final') + 1, 1000, 1);
  wrap.setWrap(true).setVerticalAlignment('top');

  var c = book.getSheetByName('Config') || book.insertSheet('Config');
  if (c.getLastRow() === 0) {
    c.appendRow(['Key', 'Value', 'What it does']);
    c.setFrozenRows(1);
    c.getRange(1, 1, 1, 3).setFontWeight('bold');
    CONFIG_DEFAULTS.forEach(function (r) { c.appendRow(r); });
    c.setColumnWidth(3, 520);
  }
  var log = book.getSheetByName('Log') || book.insertSheet('Log');
  if (log.getLastRow() === 0) log.appendRow(['Time', 'Event', 'Details']);
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Text a spreadsheet would execute as a formula is stored as text.
function safe(v) {
  var s = v === undefined || v === null ? '' : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function rowsAsObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var o = { row: r + 1 };
    for (var k = 0; k < KEYS.length; k++) {
      var v = values[r][k];
      o[KEYS[k]] = v instanceof Date ? Utilities.formatDate(v, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm") : String(v);
    }
    if (o.id) rows.push(o);
  }
  return rows;
}

function findRow(sheet, id) {
  var ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (var i = 1; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 1;
  return -1;
}

function config() {
  var c = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  var o = {};
  c.getDataRange().getValues().slice(1).forEach(function (r) {
    o[r[0]] = r[1] instanceof Date ? Utilities.formatDate(r[1], 'Asia/Kolkata', 'yyyy-MM-dd') : String(r[1]);
  });
  return o;
}

function log(event, details) {
  var l = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');
  if (l) l.appendRow([new Date(), event, safe(details)]);
}

function doPost(e) {
  var d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return out({ ok: false, error: 'bad json' });
  }
  var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || d.secret !== secret) return out({ ok: false, error: 'forbidden' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var q = book.getSheetByName(QUEUE);
    if (!q) return out({ ok: false, error: 'run setup() first' });

    if (d.action === 'list') {
      var rows = rowsAsObjects(q);
      if (d.statuses) rows = rows.filter(function (r) { return d.statuses.indexOf(r.status) !== -1; });
      return out({ ok: true, rows: rows });
    }

    if (d.action === 'config') return out({ ok: true, config: config() });

    if (d.action === 'append') {
      var existing = {};
      rowsAsObjects(q).forEach(function (r) { existing[r.id] = true; });
      var added = 0;
      (d.rows || []).forEach(function (r) {
        if (!r.id || existing[r.id]) return; // re-running a week never duplicates rows
        var first = String(r.images || '').split(/\s+/)[0];
        r.preview = first ? '=IMAGE("' + first.replace(/"/g, '') + '")' : '';
        q.appendRow(KEYS.map(function (k) { return k === 'preview' ? r.preview : safe(r[k]); }));
        ['created', 'planned', 'postedAt'].forEach(function (k) {
          q.getRange(q.getLastRow(), KEYS.indexOf(k) + 1).setNumberFormat('@').setValue(safe(r[k]));
        });
        q.setRowHeight(q.getLastRow(), first ? 160 : 90);
        added++;
      });
      log('append', added + ' drafts');
      var to = config().NOTIFY_EMAIL;
      if (added && to && d.notify) MailApp.sendEmail(to, d.notify.subject, d.notify.body + '\n\n' + book.getUrl());
      return out({ ok: true, added: added });
    }

    if (d.action === 'update') {
      var row = findRow(q, d.id);
      if (row < 0) return out({ ok: false, error: 'no such id' });
      // Optional guard: only update if the status is still what the caller last saw.
      if (d.expectStatus) {
        var now = String(q.getRange(row, KEYS.indexOf('status') + 1).getValue());
        if (now !== d.expectStatus) return out({ ok: false, error: 'status changed', status: now });
      }
      Object.keys(d.fields || {}).forEach(function (k) {
        var col = KEYS.indexOf(k);
        if (col >= 0 && k !== 'id') q.getRange(row, col + 1).setValue(safe(d.fields[k]));
      });
      return out({ ok: true });
    }

    if (d.action === 'setConfig') {
      var c = book.getSheetByName('Config');
      var keys = c.getRange(1, 1, c.getLastRow(), 1).getValues();
      for (var i = 1; i < keys.length; i++) {
        if (keys[i][0] === d.key) {
          c.getRange(i + 1, 2).setNumberFormat('@').setValue(safe(d.value));
          return out({ ok: true });
        }
      }
      c.appendRow([d.key, '', '']);
      c.getRange(c.getLastRow(), 2).setNumberFormat('@').setValue(safe(d.value));
      return out({ ok: true });
    }

    if (d.action === 'notify') {
      var addr = config().NOTIFY_EMAIL;
      if (addr) MailApp.sendEmail(addr, d.subject, d.body + '\n\n' + book.getUrl());
      log('notify', d.subject);
      return out({ ok: true, sent: !!addr });
    }

    return out({ ok: false, error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}
