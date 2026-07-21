// ─── CaData.gs ────────────────────────────────────────────────────────────────

const CA_SHEET   = 'Ca';
const CA_HEADERS = ['maCa','tenCa','gioBatDau','gioKetThuc','banDem'];

// NC-G: in-execution memo + CacheService 10 phút → sheet Ca hiếm thay đổi.
const _CA_CACHE_KEY = 'cc_ca_v1';
const _CA_CACHE_TTL = 600;
let _caMemo = null;
function _allCa() {
  if (_caMemo) return _caMemo;
  try {
    const hit = CacheService.getScriptCache().get(_CA_CACHE_KEY);
    if (hit) { _caMemo = JSON.parse(hit); return _caMemo; }
  } catch (_) {}
  _caMemo = sheetToObjects(getSheet(CA_SHEET));
  try { CacheService.getScriptCache().put(_CA_CACHE_KEY, JSON.stringify(_caMemo), _CA_CACHE_TTL); } catch (_) {}
  return _caMemo;
}
function _resetCaMemo() {
  _caMemo = null;
  try { CacheService.getScriptCache().remove(_CA_CACHE_KEY); } catch (_) {}
}

function getCaByMa(maCa) {
  if (!maCa) return null;
  return _allCa().find(function(o) { return String(o.maCa) === String(maCa); }) || null;
}

function listCa() {
  return _allCa().slice();
}

function createCa(ca) {
  if (!ca.maCa) throw new Error('maCa là bắt buộc');
  if (getCaByMa(ca.maCa)) throw new Error('maCa đã tồn tại: ' + ca.maCa);
  ca.banDem = ca.banDem === true || ca.banDem === 'true' || ca.banDem === 1;
  const sh = getOrCreateSheet(CA_SHEET, CA_HEADERS);
  appendRow(sh, ca, CA_HEADERS);
  _resetCaMemo();
}

function updateCa(maCa, updates) {
  const sh = getSheet(CA_SHEET);
  const found = findRow(sh, 'maCa', maCa);
  if (!found) throw new Error('Không tìm thấy ca: ' + maCa);
  delete updates.maCa;
  if (updates.banDem !== undefined) {
    updates.banDem = updates.banDem === true || updates.banDem === 'true' || updates.banDem === 1;
  }
  Object.assign(found.obj, updates);
  updateRow(sh, found.row, found.obj, CA_HEADERS);
  _resetCaMemo();
}

// Lấy ca mặc định (khối gián tiếp / khi chưa phân ca)
function getCaMacDinh() {
  const maCaMacDinh = getConfig('ma_ca_mac_dinh') || 'CA_HC';
  return getCaByMa(maCaMacDinh);
}
