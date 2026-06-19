// ─── ChamCongData.gs ──────────────────────────────────────────────────────────

const CC_SHEET   = 'ChamCong';
const CC_HEADERS = ['maCC','maNV','ngay','maCa','gioVao','gioRa','nguon','toaDo','trangThai'];

function getChamCongNgay(maNV, ngayStr) {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  const list = sheetToObjects(sh);
  return list.find(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr) || null;
}

function getChamCongByMaCC(maCC) {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  const found = findRow(sh, 'maCC', maCC);
  return found ? found.obj : null;
}

// Danh sách chấm công của 1 NV trong khoảng ngày
function getChamCongKhoang(maNV, tuNgay, denNgay) {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  const list = sheetToObjects(sh);
  return list.filter(o => {
    if (o.maNV !== maNV) return false;
    const ngay = toDateStr(o.ngay);
    return ngay >= tuNgay && ngay <= denNgay;
  });
}

// Danh sách chấm công của nhiều NV trong khoảng ngày (bảng công đơn vị)
function getChamCongDonVi(maNVList, tuNgay, denNgay) {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  const list = sheetToObjects(sh);
  return list.filter(o => {
    if (!maNVList.includes(o.maNV)) return false;
    const ngay = toDateStr(o.ngay);
    return ngay >= tuNgay && ngay <= denNgay;
  });
}

function saveChamCong(cc) {
  const sh = getOrCreateSheet(CC_SHEET, CC_HEADERS);
  appendRow(sh, cc, CC_HEADERS);
}

// Cập nhật một số trường của bản ghi chấm công (dùng cho chamRa & sửa thủ công)
function updateChamCong(maCC, updates) {
  const sh = getSheet(CC_SHEET);
  const found = findRow(sh, 'maCC', maCC);
  if (!found) throw new Error('Không tìm thấy ChamCong: ' + maCC);
  delete updates.maCC; // khoá chính không đổi
  Object.assign(found.obj, updates);
  updateRow(sh, found.row, found.obj, CC_HEADERS);
}

// Tạo mã chấm công: CC_NV001_20260619
function genMaCC(maNV, ngayStr) {
  return 'CC_' + maNV + '_' + ngayStr.replace(/-/g, '');
}
