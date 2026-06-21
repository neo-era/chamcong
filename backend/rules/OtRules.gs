// ─── OtRules.gs ───────────────────────────────────────────────────────────────
// Logic THUẦN kiểm soát trần làm thêm giờ (Điều 5.3 / Mục 4.3 SRS). KHÔNG truy cập Sheets.

// Tổng số giờ OT trong danh sách đơn OT (mỗi đơn có trường soGio).
function tongOtGio(danhSachDonOT) {
  return (danhSachDonOT || []).reduce((s, d) => s + (Number(d.soGio) || 0), 0);
}

/**
 * Kiểm tra trần OT.
 * @param {number} gioThang  tổng giờ OT trong tháng (gồm đơn đang xét)
 * @param {number} gioNam    tổng giờ OT trong năm (gồm đơn đang xét)
 * @param {object} nguong    { thang, nam }
 * @returns {{vuotThang:boolean, vuotNam:boolean, thongBao:string}}
 */
function kiemTraTranOT(gioThang, gioNam, nguong) {
  const vuotThang = gioThang > nguong.thang;
  const vuotNam   = gioNam > nguong.nam;
  let tb = '';
  if (vuotThang) tb += 'Vượt trần OT tháng (' + gioThang + '/' + nguong.thang + 'h). ';
  if (vuotNam)   tb += 'Vượt trần OT năm (' + gioNam + '/' + nguong.nam + 'h).';
  return { vuotThang: vuotThang, vuotNam: vuotNam, thongBao: tb.trim() };
}
