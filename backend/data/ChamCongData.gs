// ─── ChamCongData.gs ──────────────────────────────────────────────────────────

const CC_SHEET   = 'ChamCong';
const CC_HEADERS = ['maCC','maNV','ngay','maCa','gioVao','gioRa','nguon','toaDo','trangThai','isLocked','soGioCong'];

// Lấy sheet ChamCong và bảo đảm có đủ cột (migration an toàn, gọi nhiều lần được).
function ccSheet() {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  ensureChamCongCols(sh);
  return sh;
}

// Thêm cột mới (isLocked, soGioCong) vào sheet cũ — migration an toàn, gọi nhiều lần được.
function ensureChamCongCols(sh) {
  let headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
  if (headers.indexOf('isLocked') === -1) {
    sh.getRange(1, headers.length + 1).setValue('isLocked');
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }
  if (headers.indexOf('soGioCong') === -1) {
    sh.getRange(1, headers.length + 1).setValue('soGioCong');
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

// Tất cả bản ghi của 1 NV trong 1 ngày (đa ca). Trả về mảng.
function getChamCongNgayList(maNV, ngayStr) {
  const sh = ccSheet();
  return sheetToObjects(sh).filter(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr);
}

// Bản ghi của 1 NV trong 1 ngày + 1 ca cụ thể (khoá (maNV, ngày, maCa)).
function getChamCongNgayCa(maNV, ngayStr, maCa) {
  const sh = ccSheet();
  return sheetToObjects(sh)
    .find(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr && String(o.maCa) === String(maCa)) || null;
}

// Bản ghi đang mở (đã chấm VÀO, chưa chấm RA) gần nhất — gồm cả ca đêm vắt qua hôm sau.
function getChamCongMoDang(maNV) {
  const sh = ccSheet();
  const list = sheetToObjects(sh).filter(o => o.maNV === maNV && o.gioVao && !o.gioRa);
  if (!list.length) return null;
  list.sort((a, b) => tsMs(b.gioVao) - tsMs(a.gioVao));   // theo instant — bền với UTC cũ + giờ VN mới
  return list[0];
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

// Tạo mã chấm công: CC_NV001_20260619_CA_DEM (đa ca → kèm maCa cho duy nhất theo ca).
function genMaCC(maNV, ngayStr, maCa) {
  return 'CC_' + maNV + '_' + ngayStr.replace(/-/g, '') + (maCa ? '_' + maCa : '');
}
