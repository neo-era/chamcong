// ─── BangCongData.gs ──────────────────────────────────────────────────────────
// Gom dữ liệu kỳ công + trạng thái khoá kỳ. Sheet BangCong lưu khoá theo (ky, maNV).

const BC_SHEET   = 'BangCong';
const BC_HEADERS = ['ky','maNV','isLocked','nguoiKhoa','thoiDiemKhoa'];

// Gom toàn bộ dữ liệu thô của kỳ cho danh sách NV.
function layDuLieuKyCong(maNVList, tuNgay, denNgay) {
  return {
    cc:     getChamCongDonVi(maNVList, tuNgay, denNgay),
    don:    listDonDaDuyetTrongKy(maNVList, tuNgay, denNgay),
    caList: listCa()
  };
}

function getBangCongKhoa(ky, maNV) {
  const sh = getOrCreateSheet(BC_SHEET, BC_HEADERS);
  return sheetToObjects(sh).find(o => o.ky === ky && o.maNV === maNV) || null;
}

function kiemTraKhoa(ky, maNV) {
  const r = getBangCongKhoa(ky, maNV);
  return !!(r && (r.isLocked === true || String(r.isLocked).toUpperCase() === 'TRUE'));
}

function _upsertBangCong(ky, maNV, vals) {
  const sh = getOrCreateSheet(BC_SHEET, BC_HEADERS);
  const data = sh.getDataRange().getValues();
  const obj = { ky, maNV, isLocked: vals.isLocked, nguoiKhoa: vals.nguoiKhoa || '', thoiDiemKhoa: vals.thoiDiemKhoa || '' };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(ky) && String(data[i][1]) === String(maNV)) {
      updateRow(sh, i + 1, obj, BC_HEADERS);
      return obj;
    }
  }
  appendRow(sh, obj, BC_HEADERS);
  return obj;
}

function datKhoaBangCong(ky, maNV, nguoi) {
  return _upsertBangCong(ky, maNV, { isLocked: 'TRUE', nguoiKhoa: nguoi, thoiDiemKhoa: toIsoVN(new Date()) });
}

function moKhoaBangCong(ky, maNV, nguoi) {
  return _upsertBangCong(ky, maNV, { isLocked: '', nguoiKhoa: nguoi, thoiDiemKhoa: toIsoVN(new Date()) });
}
