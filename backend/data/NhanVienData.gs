// ─── NhanVienData.gs ──────────────────────────────────────────────────────────

const NV_SHEET   = 'NhanVien';
const NV_HEADERS = ['maNV','hoTen','donVi','khoi','chucDanh','dieuKienCV',
                    'ngayVaoLam','quanLyTrucTiep','trangThai','email','vaiTro','matKhau'];

function getNVByEmail(email) {
  const sh = getSheet(NV_SHEET);
  const found = findRow(sh, 'email', email);
  return found ? found.obj : null;
}

function getNVByMa(maNV) {
  const sh = getSheet(NV_SHEET);
  const found = findRow(sh, 'maNV', maNV);
  return found ? found.obj : null;
}

function listNV(filters) {
  const sh = getSheet(NV_SHEET);
  let list = sheetToObjects(sh);
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
}

// Lưu hash mật khẩu cho NV (Admin gọi, hoặc dùng setPassword() dưới)
function setMatKhauNV(maNV, matKhauHash) {
  const sh = getSheet(NV_SHEET);
  const found = findRow(sh, 'maNV', maNV);
  if (!found) throw new Error('Không tìm thấy NV: ' + maNV);
  found.obj.matKhau = matKhauHash;
  updateRow(sh, found.row, found.obj, NV_HEADERS);
}

// Thêm cột matKhau vào sheet NhanVien nếu chưa có (migration)
function addMatKhauColumn() {
  const sh = getSheet(NV_SHEET);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  if (!headers.includes('matKhau')) {
    sh.getRange(1, headers.length + 1).setValue('matKhau');
    Logger.log('Đã thêm cột matKhau vào sheet NhanVien');
  } else {
    Logger.log('Cột matKhau đã tồn tại');
  }
}

// ── Hàm tiện ích dùng trong Apps Script Editor ──────────────────────────────
// Admin chạy: setPassword('NV001', 'matkhau123') để đặt mật khẩu cho NV
function setPassword(maNV, matKhauRaw) {
  const hash = _hashSHA256(matKhauRaw);
  setMatKhauNV(maNV, hash);
  Logger.log('✓ Đã đặt mật khẩu cho ' + maNV + ' (hash: ' + hash.substring(0,16) + '...)');
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
