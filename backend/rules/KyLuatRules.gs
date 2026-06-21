// ─── KyLuatRules.gs ───────────────────────────────────────────────────────────
// Logic THUẦN cảnh báo kỷ luật (Điều 33, 34, 35 NQLĐ). KHÔNG truy cập Sheets.
// Hệ thống CHỈ CẢNH BÁO, không tự ra quyết định kỷ luật.

/**
 * Đếm số NGÀY bỏ việc (mỗi ngày tính 1) trong danh sách chấm công.
 * "Bỏ việc" = trạng thái TRE/SOM/MAT_CONG/VANG_KHONG_PHEP (dùng laBoViec).
 */
function demBoViecTrongKhoang(danhSachChamCong) {
  const days = {};
  (danhSachChamCong || []).forEach(function (cc) {
    if (laBoViec(cc.trangThai)) {
      days[String(cc.ngay).substring(0, 10)] = true;
    }
  });
  return Object.keys(days).length;
}

/**
 * Xác định mức cảnh báo cao nhất chạm tới.
 * @param {number} s30   số ngày bỏ việc trong 30 ngày
 * @param {number} s365  số ngày bỏ việc trong 365 ngày
 * @param {object} ng    { khien, keo, sa30, sa365 }
 * @returns {string|null} 'Sa thải' | 'Kéo dài nâng lương' | 'Khiển trách' | null
 */
function xacDinhMucCanhBao(s30, s365, ng) {
  if (s30 >= ng.sa30 || s365 >= ng.sa365) return 'Sa thải';
  if (s30 >= ng.keo)   return 'Kéo dài nâng lương';
  if (s30 >= ng.khien) return 'Khiển trách';
  return null;
}
