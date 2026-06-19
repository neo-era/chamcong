// ─── NhanVienData.gs ──────────────────────────────────────────────────────────

const NV_SHEET   = 'NhanVien';
const NV_HEADERS = ['maNV','hoTen','donVi','khoi','chucDanh','dieuKienCV',
                    'ngayVaoLam','quanLyTrucTiep','trangThai','email','vaiTro'];

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

// Tính số năm thâm niên (dùng cho quota phép)
function tinhThamNien(maNV) {
  const nv = getNVByMa(maNV);
  if (!nv || !nv.ngayVaoLam) return 0;
  const ngayVao = new Date(nv.ngayVaoLam);
  const nam = (new Date() - ngayVao) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(nam);
}
