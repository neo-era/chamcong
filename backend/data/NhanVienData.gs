// ─── NhanVienData.gs ──────────────────────────────────────────────────────────

const NV_SHEET   = 'NhanVien';
const NV_HEADERS = ['maNV','hoTen','donVi','khoi','chucDanh','dieuKienCV',
                    'ngayVaoLam','quanLyTrucTiep','trangThai','email','vaiTro','matKhau','salt','phaiDoiMK','diaBan'];



// NC-G: in-execution memo + CacheService 60s → tránh đọc sheet NhanVien mỗi request.
const _NV_CACHE_KEY = 'cc_nv_v1';
const _NV_CACHE_TTL = 60;
let _nvMemo = null;
function _allNV() {
  if (_nvMemo) return _nvMemo;
  try {
    const hit = CacheService.getScriptCache().get(_NV_CACHE_KEY);
    if (hit) { _nvMemo = JSON.parse(hit); return _nvMemo; }
  } catch (_) {}
  _nvMemo = sheetToObjects(getSheet(NV_SHEET));
  try { CacheService.getScriptCache().put(_NV_CACHE_KEY, JSON.stringify(_nvMemo), _NV_CACHE_TTL); } catch (_) {}
  return _nvMemo;
}
function _resetNVMemo() {
  _nvMemo = null;
  try { CacheService.getScriptCache().remove(_NV_CACHE_KEY); } catch (_) {}
}

function getNVByEmail(email) {
  return _allNV().find(o => o.email === email) || null;
}

function getNVByMa(maNV) {
  return _allNV().find(o => o.maNV === maNV) || null;
}

function listNV(filters) {
  let list = _allNV().slice();
  if (!filters) return list;
  if (filters.trangThai) list = list.filter(o => o.trangThai === filters.trangThai);
  if (filters.donVi)     list = list.filter(o => o.donVi === filters.donVi);
  if (filters.khoi)      list = list.filter(o => o.khoi === filters.khoi);
  return list;
}

function createNV(nv) {
  if (!nv.maNV || !nv.email) throw new Error('maNV và email là bắt buộc');
  if (getNVByMa(nv.maNV))    throw new Error('maNV đã tồn tại: ' + nv.maNV);
  if (getNVByEmail(nv.email)) throw new Error('Email đã tồn tại: ' + nv.email);
  const sh = getOrCreateSheet(NV_SHEET, NV_HEADERS);
  nv.trangThai = nv.trangThai || 'Đang làm';
  nv.vaiTro    = nv.vaiTro    || 'NV';
  appendRow(sh, nv, NV_HEADERS);
  _resetNVMemo();
}

function updateNV(maNV, updates) {
  const sh = getSheet(NV_SHEET);
  const found = findRow(sh, 'maNV', maNV);
  if (!found) throw new Error('Không tìm thấy NV: ' + maNV);
  // Không cho cập nhật email (tránh mất liên kết auth)
  delete updates.email;
  delete updates.maNV;
  Object.assign(found.obj, updates);
  updateRow(sh, found.row, found.obj, NV_HEADERS);
  _resetNVMemo();
}

// Thêm cột matKhau + salt + phaiDoiMK vào sheet NhanVien nếu chưa có (migration an toàn).
function addMatKhauColumn() {
  const sh = getSheet(NV_SHEET);
  let added = false;
  ['matKhau', 'salt', 'phaiDoiMK'].forEach(col => {
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (headers.indexOf(col) === -1) { sh.getRange(1, headers.length + 1).setValue(col); added = true; }
  });
  if (added) _resetNVMemo();
}
function addSaltColumn() { addMatKhauColumn(); }   // alias

// Đặt mật khẩu (lưu thẳng, không băm).
// batBuocDoi=true (mặc định): đánh dấu phaiDoiMK (Admin/import/reset đặt). User tự đổi → false.
function datMatKhau(maNV, matKhauRaw, batBuocDoi) {
  addMatKhauColumn();
  const sh = getSheet(NV_SHEET);
  const found = findRow(sh, 'maNV', maNV);
  if (!found) throw new Error('Không tìm thấy NV: ' + maNV);
  found.obj.matKhau = matKhauRaw;
  found.obj.salt = '';
  found.obj.phaiDoiMK = (batBuocDoi === false) ? '' : 'TRUE';
  updateRow(sh, found.row, found.obj, NV_HEADERS);
  _resetNVMemo();
}

// Kiểm tra mật khẩu (so sánh thẳng).
function kiemTraMatKhau(nv, matKhauRaw) {
  if (!nv || !nv.matKhau) return false;
  return String(nv.matKhau) === String(matKhauRaw);
}

// ── Tiện ích dùng trong Apps Script Editor ──────────────────────────────────
// Admin chạy: setPassword('NV001', 'matkhau123')
function setPassword(maNV, matKhauRaw) {
  datMatKhau(maNV, matKhauRaw);
  Logger.log('✓ Đã đặt mật khẩu cho ' + maNV);
}

// Tính số năm thâm niên (dùng cho quota phép)
function tinhThamNien(maNV) {
  const nv = getNVByMa(maNV);
  if (!nv || !nv.ngayVaoLam) return 0;
  const ngayVao = new Date(nv.ngayVaoLam);
  const nam = (new Date() - ngayVao) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(nam);
}
