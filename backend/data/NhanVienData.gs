// ─── NhanVienData.gs ──────────────────────────────────────────────────────────

const NV_SHEET   = 'NhanVien';
const NV_HEADERS = ['maNV','hoTen','donVi','khoi','chucDanh','dieuKienCV',
                    'ngayVaoLam','quanLyTrucTiep','trangThai','email','vaiTro','matKhau','salt','phaiDoiMK'];

// Số vòng lặp băm (chống brute-force). Chỉ chạy khi đăng nhập/đổi mật khẩu.
const SALT_ITER = 1000;

// NC-G: memo danh sách NV trong 1 execution (giảm đọc sheet lặp lại).
let _nvMemo = null;
function _allNV() {
  if (!_nvMemo) _nvMemo = sheetToObjects(getSheet(NV_SHEET));
  return _nvMemo;
}
function _resetNVMemo() { _nvMemo = null; }

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

// ── Băm mật khẩu có salt ─────────────────────────────────────────────────────
function _genSalt() {
  return Utilities.getUuid().replace(/-/g, '');   // 32 ký tự hex ngẫu nhiên
}

// Băm có salt + lặp SALT_ITER vòng (chống dò mật khẩu yếu + chống rainbow table).
function _hashSalted(raw, salt) {
  let h = salt + '|' + raw;
  for (let i = 0; i < SALT_ITER; i++) h = _hashSHA256(h + salt);
  return h;
}

// Đặt mật khẩu (sinh salt mới + băm + lưu). Nguồn chân lý duy nhất để ghi mật khẩu.
// batBuocDoi=true (mặc định): đánh dấu phaiDoiMK (Admin/import/reset đặt). User tự đổi → false.
function datMatKhau(maNV, matKhauRaw, batBuocDoi) {
  addMatKhauColumn();
  const salt = _genSalt();
  const hash = _hashSalted(matKhauRaw, salt);
  const sh = getSheet(NV_SHEET);
  const found = findRow(sh, 'maNV', maNV);
  if (!found) throw new Error('Không tìm thấy NV: ' + maNV);
  found.obj.matKhau = hash;
  found.obj.salt = salt;
  found.obj.phaiDoiMK = (batBuocDoi === false) ? '' : 'TRUE';
  updateRow(sh, found.row, found.obj, NV_HEADERS);
  _resetNVMemo();
}

// Kiểm tra mật khẩu. Tự NÂNG CẤP bản ghi cũ (hash không salt) sang salted khi đăng nhập đúng.
function kiemTraMatKhau(nv, matKhauRaw) {
  if (!nv || !nv.matKhau) return false;
  if (nv.salt) {
    return _hashSalted(matKhauRaw, nv.salt) === nv.matKhau;
  }
  // Bản ghi cũ: so hash SHA-256 không salt; nếu đúng → nâng cấp sang salted
  if (_hashSHA256(matKhauRaw) === nv.matKhau) {
    try { datMatKhau(nv.maNV, matKhauRaw); } catch (_) {}
    return true;
  }
  return false;
}

// ── Tiện ích dùng trong Apps Script Editor ──────────────────────────────────
// Admin chạy: setPassword('NV001', 'matkhau123')
function setPassword(maNV, matKhauRaw) {
  datMatKhau(maNV, matKhauRaw);
  Logger.log('✓ Đã đặt mật khẩu (có salt) cho ' + maNV);
}

function _hashSHA256(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return digest.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// Tính số năm thâm niên (dùng cho quota phép)
function tinhThamNien(maNV) {
  const nv = getNVByMa(maNV);
  if (!nv || !nv.ngayVaoLam) return 0;
  const ngayVao = new Date(nv.ngayVaoLam);
  const nam = (new Date() - ngayVao) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(nam);
}
