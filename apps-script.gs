/**
 * The Kokumi — workshop board backend
 * Paste this into: your Google Sheet -> Extensions -> Apps Script
 * Then: Deploy -> New deployment -> Web app
 *        Execute as: Me
 *        Who has access: Anyone
 * Copy the /exec URL it gives you.
 */

var SHEET_NAME = 'answers';
var HEAD = ['timestamp', 'session', 'name', 'role', 'block', 'card', 'answer'];

function _sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
  }
  return sh;
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** WRITE — the participant board posts here */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // test harness can wipe the sheet so repeat runs stay clean
    if (body.action === 'reset') {
      var s = _sheet();
      s.clear();
      s.appendRow(HEAD);
      s.setFrozenRows(1);
      return _json({ ok: true, reset: true });
    }

    var rows = body.rows || [body];
    var sh = _sheet();
    var stamp = new Date();

    rows.forEach(function (r) {
      var a = r.answer;
      if (a === undefined || a === null) a = '';
      else if (typeof a === 'object') a = JSON.stringify(a);
      else a = String(a);

      sh.appendRow([
        stamp,
        body.session || r.session || '',
        body.name    || r.name    || '',
        body.role    || r.role    || '',
        r.block || '',
        r.card  || '',
        a
      ]);
    });

    return _json({ ok: true, written: rows.length });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

/** READ — the host dashboard polls here */
function doGet(e) {
  try {
    var sh = _sheet();
    var values = sh.getDataRange().getValues();
    var head = values.shift() || [];
    var out = [];
    for (var i = 0; i < values.length; i++) {
      var o = {};
      for (var j = 0; j < head.length; j++) o[head[j]] = values[i][j];
      out.push(o);
    }
    return _json({ ok: true, count: out.length, rows: out });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
