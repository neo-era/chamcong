// ─── BuocDuyetData.gs ─────────────────────────────────────────────────────────
// Truy cập sheet BuocDuyet — lưu vết từng bước duyệt (Điều 28 NQLĐ).

const BD_SHEET   = 'BuocDuyet';
const BD_HEADERS = ['maBuoc','maDon','capDuyet','nguoiDuyet','ketQua','yKien','thoiDiem'];

function genMaBuoc(maDon, cap) {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HHmmss');
  return 'BD_' + maDon + '_C' + cap + '_' + stamp;
}

function themBuocDuyet(buoc) {
  const sh = getOrCreateSheet(BD_SHEET, BD_HEADERS);
  const rec = {
    maBuoc:     buoc.maBuoc || genMaBuoc(buoc.maDon, buoc.capDuyet),
    maDon:      buoc.maDon,
    capDuyet:   buoc.capDuyet,
    nguoiDuyet: buoc.nguoiDuyet,
    ketQua:     buoc.ketQua,
    yKien:      buoc.yKien || '',
    thoiDiem:   toIsoVN(new Date())   // lưu vết — giờ VN (+07:00)
  };
  appendRow(sh, rec, BD_HEADERS);
  return rec;
}

// Các bước duyệt của 1 đơn, sắp theo cấp rồi theo thời điểm
function getBuocDuyetCuaDon(maDon) {
  const sh = getOrCreateSheet(BD_SHEET, BD_HEADERS);
  return sheetToObjects(sh)
    .filter(o => o.maDon === maDon)
    .sort((a, b) => (Number(a.capDuyet) - Number(b.capDuyet)) ||
                    (tsMs(a.thoiDiem) - tsMs(b.thoiDiem)));
}
