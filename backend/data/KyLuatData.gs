// ─── KyLuatData.gs ────────────────────────────────────────────────────────────
// Truy cập sheet CanhBaoKyLuat (docs/02-data-model.md).

const CB_SHEET   = 'CanhBaoKyLuat';
const CB_HEADERS = ['maCB','maNV','soNgayBoViec30','soNgayBoViec365','mucCanhBao','thoiDiem'];

function genMaCB(maNV) {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd_HHmmss');
  return 'CB_' + maNV + '_' + stamp;
}

function themCanhBao(cb) {
  const sh = getOrCreateSheet(CB_SHEET, CB_HEADERS);
  const rec = {
    maCB:           genMaCB(cb.maNV),
    maNV:           cb.maNV,
    soNgayBoViec30: cb.soNgayBoViec30,
    soNgayBoViec365: cb.soNgayBoViec365,
    mucCanhBao:     cb.mucCanhBao,
    thoiDiem:       new Date().toISOString()
  };
  appendRow(sh, rec, CB_HEADERS);
  return rec;
}

function listCanhBao() {
  const sh = getOrCreateSheet(CB_SHEET, CB_HEADERS);
  return sheetToObjects(sh);
}

// Đã có cảnh báo cùng NV + mức trong ngày `ngayStr` (yyyy-MM-dd, giờ VN) chưa — tránh ghi trùng.
function daCoCanhBaoTrongNgay(maNV, muc, ngayStr) {
  const sh = getOrCreateSheet(CB_SHEET, CB_HEADERS);
  return sheetToObjects(sh).some(o =>
    o.maNV === maNV && o.mucCanhBao === muc && toDateStr(o.thoiDiem) === ngayStr);
}
