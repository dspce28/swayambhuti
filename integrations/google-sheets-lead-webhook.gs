/**
 * Swayambhuti website → Google Sheet lead log.
 *
 * Setup (≈3 minutes):
 *  1. Create a Google Sheet (e.g. "Swayambhuti Leads").
 *  2. Extensions → Apps Script. Delete the sample code, paste this whole file, Save.
 *  3. Change SECRET below to any long random phrase (keep it private).
 *  4. Deploy → New deployment → type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Deploy, authorise, and copy the Web app URL (ends in /exec).
 *  5. In Vercel → Project → Settings → Environment Variables, add:
 *       LEAD_WEBHOOK_URL    = the /exec URL
 *       LEAD_WEBHOOK_SECRET = the same phrase as SECRET
 *     then redeploy. Every enquiry now appears as a new row.
 */
const SECRET = 'CHANGE-ME-to-a-long-random-phrase';

const HEADERS = [
  'Received', 'Type', 'Name', 'Company', 'Phone', 'Email', 'Industry', 'Challenge',
  'Score', 'Tier', 'Systemize', 'Humanize', 'Monetize', 'Biggest leaks', 'Answers',
  'Source', 'Medium', 'Campaign', 'Landing page', 'Lead ID',
];

function doPost(e) {
  const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return out({ ok: false, error: 'bad json' });
  }
  if (!SECRET || d.secret !== SECRET) return out({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName('Leads') || book.insertSheet('Leads');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
    // prefix values that a spreadsheet would execute as a formula
    const safe = (v) => {
      const s = v === undefined || v === null ? '' : String(v);
      return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
    };
    const s = d.score || {};
    const a = d.attribution || {};
    sheet.appendRow([
      d.receivedAt, d.type === 'health_check' ? 'Health Check' : 'Contact form', d.name, d.company, d.phone, d.email,
      d.industry, d.challenge, s.total, s.tier, s.systemize, s.humanize, s.monetize, (s.leaks || []).join(', '), s.answers,
      a.utm_source, a.utm_medium, a.utm_campaign, a.landing_page, d.id,
    ].map(safe));
  } finally {
    lock.releaseLock();
  }
  return out({ ok: true });
}
