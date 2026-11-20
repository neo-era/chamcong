// Giả lập tối thiểu các dịch vụ Google Apps Script để chạy backend/*.gs trong Node.
// Chạy: node tests/node/run.js  (không cần cài thêm gói nào)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function toSigned(buf) { return Array.from(buf, b => (b > 127 ? b - 256 : b)); }
function toBuf(bytes) { return Buffer.from(bytes.map(b => b & 0xff)); }

class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr: nr || 1, nc: nc || 1 }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = this.sh.data[this.r - 1 + i] || [];
      out.push(Array.from({ length: this.nc }, (_, j) => (row[this.c - 1 + j] !== undefined ? row[this.c - 1 + j] : '')));
    }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  setValues(vals) {
    vals.forEach((row, i) => {
      const ri = this.r - 1 + i;
      while (this.sh.data.length <= ri) this.sh.data.push([]);
      row.forEach((v, j) => { this.sh.data[ri][this.c - 1 + j] = v; });
    });
    return this;
  }
  setValue(v) { return this.setValues([[v]]); }
  setNumberFormat() { return this; }
  setFontWeight() { return this; }
  setBackground() { return this; }
}

class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  getName() { return this.name; }
  getDataRange() {
    const nc = Math.max(0, ...this.data.map(r => r.length));
    return new Range(this, 1, 1, this.data.length, nc);
  }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr, nc); }
  getLastColumn() { return Math.max(0, ...this.data.map(r => r.length)); }
  getLastRow() { return this.data.length; }
  appendRow(row) { this.data.push(row.slice()); return this; }
  setFrozenRows() { return this; }
  deleteRow(i) { this.data.splice(i - 1, 1); }
  clear() { this.data = []; }
}

class Spreadsheet {
  constructor() { this.sheets = {}; }
  getSheetByName(n) { return this.sheets[n] || null; }
  insertSheet(n) { this.sheets[n] = new Sheet(n); return this.sheets[n]; }
  getSheets() { return Object.values(this.sheets); }
  getId() { return 'TEST'; }
}

function fmtDate(d, tz, fmt) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz || 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
  if (parts.hour === '24') parts.hour = '00';
  return fmt.replace('yyyy', parts.year).replace('MM', parts.month).replace('dd', parts.day)
    .replace('HH', parts.hour).replace('mm', parts.minute).replace('ss', parts.second);
}

function createEnv(opts) {
  opts = opts || {};
  const ss = new Spreadsheet();
  const props = Object.assign({}, opts.props || {});
  const cache = {};
  const logs = [];
  const mails = [];
  const ctx = {
    console,
    SpreadsheetApp: { openById: () => ss, create: () => ss, flush: () => {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = String(v); },
        getProperties: () => Object.assign({}, props),
        deleteProperty: k => { delete props[k]; }
      })
    },
    CacheService: {
      getScriptCache: () => ({
        get: k => (k in cache ? cache[k] : null),
        put: (k, v) => { cache[k] = v; },
        remove: k => { delete cache[k]; },
        removeAll: ks => ks.forEach(k => delete cache[k])
      })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    Logger: { log: (...a) => logs.push(a.join(' ')) },
    MailApp: { sendEmail: m => mails.push(m) },
    Session: { getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: s => ({ content: s, setMimeType() { return this; }, getContent() { return this.content; } })
    },
    Utilities: {
      Charset: { UTF_8: 'utf8' },
      DigestAlgorithm: { SHA_256: 'sha256' },
      formatDate: fmtDate,
      computeHmacSha256Signature: (data, secret) =>
        toSigned(crypto.createHmac('sha256', String(secret)).update(String(data), 'utf8').digest()),
      computeDigest: (alg, s) => toSigned(crypto.createHash('sha256').update(String(s), 'utf8').digest()),
      base64EncodeWebSafe: s => Buffer.from(typeof s === 'string' ? s : toBuf(s)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      base64DecodeWebSafe: s => {
        if (/[^A-Za-z0-9\-_=]/.test(s)) throw new Error('bad base64');
        return toSigned(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
      },
      newBlob: bytes => ({ getDataAsString: () => toBuf(bytes).toString('utf8') }),
      getUuid: () => crypto.randomUUID(),
      sleep: () => {}
    },
    UrlFetchApp: { fetch: () => { throw new Error('mạng bị chặn trong test'); } },
    DriveApp: {},
    ScriptApp: { getProjectTriggers: () => [], WeekDay: {} }
  };
  vm.createContext(ctx);
  const root = path.join(__dirname, '..', '..', 'backend');
  const files = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.gs') && !/_Test\.gs$/.test(f)) files.push(p);
    }
  })(root);
  const src = files.map(f => '// ' + path.relative(root, f) + '\n' + fs.readFileSync(f, 'utf8')).join('\n;\n');
  // Đưa các hàm/hằng cấp cao nhất ra globalThis để test gọi được
  const names = [...src.matchAll(/^(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/gm)].map(m => m[1] || m[2]);
  vm.runInContext(src + '\n;globalThis.__exports = {' + [...new Set(names)].map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(',') + '};', ctx, { filename: 'backend.gs' });
  const g = ctx.__exports;

  // ── tiện ích cho test ──
  const api = {
    g, ss, props, logs, mails,
    sheet: n => ss.getSheetByName(n),
    seedSheet(name, headers, rows) {
      const sh = ss.getSheetByName(name) || ss.insertSheet(name);
      sh.data = [headers.slice()].concat(rows.map(r => headers.map(h => (r[h] !== undefined ? r[h] : ''))));
      return sh;
    },
    post(body) {
      const out = g.doPost({ postData: { contents: JSON.stringify(body) } });
      return { raw: out.getContent(), json: JSON.parse(out.getContent()) };
    },
    get(params) {
      const out = g.doGet({ parameter: params });
      return { raw: out.getContent(), json: JSON.parse(out.getContent()) };
    },
    resetCache() { Object.keys(cache).forEach(k => delete cache[k]); if (g._resetNVMemo) g._resetNVMemo(); }
  };
  return api;
}

module.exports = { createEnv };
