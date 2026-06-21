// ─── ChamCongData.gs ──────────────────────────────────────────────────────────

const CC_SHEET   = 'ChamCong';
const CC_HEADERS = ['maCC','maNV','ngay','maCa','gioVao','gioRa','nguon','toaDo','trangThai','isLocked'];

// Lấy sheet ChamCong và bảo đảm có đủ cột (migration an toàn, gọi nhiều lần được).
function ccSheet() {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  ensureChamCongCols(sh);
  return sh;
}

// Thêm cột isLocked vào sheet cũ (đã tạo trước khi có khoá kỳ công).
function ensureChamCongCols(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf('isLocked') === -1) {
    sh.getRange(1, headers.length + 1).setValue('isLocked');
  }
}

// Một bản ghi chấm công có đang bị khoá không (chấp nhận bool TRUE hoặc chuỗi 'TRUE').
function ccDaKhoa(cc) {
  return cc && (cc.isLocked === true || String(cc.isLocked).toUpperCase() === 'TRUE');
}

function getChamCongNgay(maNV, ngayStr) {
  const sh = ccSheet();
  const list = sheetToObjects(sh);
  return list.find(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr) || null;
}

function getChamCongByMaCC(maCC) {
  const sh = ccSheet();
  const found = findRow(sh, 'maCC', maCC);
  return found ? found.obj : null;
}

// Danh sách chấm công của 1 NV trong khoảng ngày
function getChamCongKhoang(maNV, tuNgay, denNgay) {
  const sh = ccSheet();
  const list = sheetToObjects(sh);
  return list.filter(o => {
    if (o.maNV !== maNV) return false;
    const ngay = toDateStr(o.ngay);
    return ngay >= tuNgay && ngay <= denNgay;
  });
}

// Danh sách chấm công của nhiều NV trong khoảng ngày (bảng công đơn vị)
function getChamCongDonVi(maNVList, tuNgay, denNgay) {
  const sh = ccSheet();
  const list = sheetToObjects(sh);
  return list.filter(o => {
    if (!maNVList.includes(o.maNV)) return false;
    const ngay = toDateStr(o.ngay);
    return ngay >= tuNgay && ngay <= denNgay;
  });
}

function saveChamCong(cc) {
  const sh = ccSheet();
  appendRow(sh, cc, CC_HEADERS);
}

// Cập nhật một số trường của bản ghi chấm công (dùng cho chamRa & sửa thủ công)
function updateChamCong(maCC, updates) {
  const sh = ccSheet();
  const found = findRow(sh, 'maCC', maCC);
  if (!found) throw new Error('Không tìm thấy ChamCong: ' + maCC);
  delete updates.maCC; // khoá chính không đổi
  Object.assign(found.obj, updates);
  updateRow(sh, found.row, found.obj, CC_HEADERS);
}

// Khoá / mở khoá một bản ghi chấm công (lưu trạng thái trong cột isLocked).
function setChamCongLock(maCC, locked) {
  const sh = ccSheet();
  const found = findRow(sh, 'maCC', maCC);
  if (!found) throw new Error('Không tìm thấy ChamCong: ' + maCC);
  found.obj.isLocked = locked ? 'TRUE' : '';
  updateRow(sh, found.row, found.obj, CC_HEADERS);
  return found.obj;
}

// Tạo mã chấm công: CC_NV001_20260619
function genMaCC(maNV, ngayStr) {
  return 'CC_' + maNV + '_' + ngayStr.replace(/-/g, '');
}
