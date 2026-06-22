// ─── CauHinhData.gs ───────────────────────────────────────────────────────────
// Đọc tham số từ sheet CauHinh. KHÔNG hardcode hằng số pháp lý.
// NC-G: cache để giảm đọc sheet — memo theo execution + CacheService (TTL 60s).

let _cfgMemo = null;   // map { key: {value, moTa} } trong 1 execution

function _allConfigMap() {
  if (_cfgMemo) return _cfgMemo;
  const cache = CacheService.getScriptCache();
  const cached = cache.get('cfg_all');
  if (cached) {
    try { _cfgMemo = JSON.parse(cached); return _cfgMemo; } catch (_) {}
  }
  const obj = {};
  sheetToObjects(getSheet('CauHinh')).forEach(r => { obj[r.key] = { value: r.value, moTa: r.moTa }; });
  _cfgMemo = obj;
  try { cache.put('cfg_all', JSON.stringify(obj), 60); } catch (_) {}
  return obj;
}

function _resetCfgCache() {
  _cfgMemo = null;
  try { CacheService.getScriptCache().remove('cfg_all'); } catch (_) {}
}

function getConfig(key) {
  const m = _allConfigMap();
  return m[key] != null ? String(m[key].value) : null;
}

function getConfigNumber(key, fallback) {
  const v = getConfig(key);
  return v !== null ? parseFloat(v) : fallback;
}

// Trả về mảng toàn bộ config (dùng cho admin xem)
function getAllConfig() {
  const m = _allConfigMap();
  return Object.keys(m).map(k => ({ key: k, value: m[k].value, moTa: m[k].moTa }));
}

// Cập nhật 1 key (Admin only — quyền kiểm tra ở api layer)
function setConfig(key, value, moTa) {
  const sh = getSheet('CauHinh');
  const found = findRow(sh, 'key', key);
  if (found) {
    found.obj.value = value;
    if (moTa) found.obj.moTa = moTa;
    updateRow(sh, found.row, found.obj, ['key', 'value', 'moTa']);
  } else {
    appendRow(sh, { key, value, moTa: moTa || '' }, ['key', 'value', 'moTa']);
  }
  _resetCfgCache();
}
