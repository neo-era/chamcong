// ─── DonTuData.gs ─────────────────────────────────────────────────────────────
// Truy cập sheet DonTu (docs/02-data-model.md).

const DT_SHEET   = 'DonTu';
const DT_HEADERS = ['maDon','maNV','loaiDon','donViTinh','nguonChiTra','tuNgay','denNgay','soNgay','lyDo','dinhKem','trangThai','ngayTao','soGio','lyDoDinhMuc'];

// Lấy sheet DonTu + bảo đảm đủ cột (migration an toàn cho soGio, lyDoDinhMuc).
function dtSheet() {
  const sh0 = getOrCreateSheet(DT_SHEET, DT_HEADERS);
  const headers = sh0.getRange(1, 1, 1, Math.max(sh0.getLastColumn(), 1)).getValues()[0];
  ['soGio', 'lyDoDinhMuc'].forEach(col => {
    if (headers.indexOf(col) === -1) { sh0.getRange(1, sh0.getLastColumn() + 1).setValue(col); }
  });
  return sh0;
}

function genMaDon(maNV) {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd_HHmmss');
  return 'DON_' + maNV + '_' + stamp;
}

function createDon(don) {
  const sh = dtSheet();
  appendRow(sh, don, DT_HEADERS);
}

function getDonByMa(maDon) {
  const sh = dtSheet();
  const found = findRow(sh, 'maDon', maDon);
  return found ? found.obj : null;
}

// Đơn của 1 NV; filters tuỳ chọn: { loaiDon, trangThai, tuNgay, denNgay }
function listDonCuaNV(maNV, filters) {
  filters = filters || {};
  const sh = dtSheet();
  return sheetToObjects(sh).filter(o => {
    if (o.maNV !== maNV) return false;
    if (filters.loaiDon   && o.loaiDon   !== filters.loaiDon)   return false;
    if (filters.trangThai && o.trangThai !== filters.trangThai) return false;
    if (filters.tuNgay  && toDateStr(o.denNgay) < filters.tuNgay)  return false;
    if (filters.denNgay && toDateStr(o.tuNgay)  > filters.denNgay) return false;
    return true;
  });
}

// Tất cả đơn đang chờ xử lý (Chờ duyệt / Bổ sung) — phục vụ định tuyến người duyệt
function listDonChoDuyet() {
  const sh = dtSheet();
  return sheetToObjects(sh).filter(o =>
    o.trangThai === 'Chờ duyệt' || o.trangThai === 'Bổ sung');
}

// Đơn ĐÃ DUYỆT của nhiều NV, phủ (giao) khoảng [tuNgay, denNgay] — phục vụ bảng công.
function listDonDaDuyetTrongKy(maNVList, tuNgay, denNgay) {
  const sh = dtSheet();
  return sheetToObjects(sh).filter(o => {
    if (o.trangThai !== 'Đã duyệt') return false;
    if (maNVList.indexOf(o.maNV) === -1) return false;
    const tu = toDateStr(o.tuNgay), den = toDateStr(o.denNgay);
    return !(den < tuNgay || tu > denNgay);   // có giao nhau
  });
}

function updateDon(maDon, updates) {
  const sh = dtSheet();
  const found = findRow(sh, 'maDon', maDon);
  if (!found) throw new Error('Không tìm thấy đơn: ' + maDon);
  delete updates.maDon;
  Object.assign(found.obj, updates);
  updateRow(sh, found.row, found.obj, DT_HEADERS);
  return found.obj;
}
