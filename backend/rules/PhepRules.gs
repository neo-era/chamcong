// ─── PhepRules.gs ─────────────────────────────────────────────────────────────
// Logic THUẦN tính phép năm (Điều 25, 26 NQLĐ). KHÔNG truy cập Sheets.

// Số ngày cơ bản theo điều kiện công việc (giá trị thực truyền vào qua baseMap từ CauHinh).
const BASE_PHEP_MAC_DINH = {
  'Bình thường':        12,
  'Nặng nhọc':          14,
  'Đặc biệt nặng nhọc': 16
};

/**
 * Tính quota phép năm.
 *   - Đã làm trọn năm đầu: quota = base + ⌊thâmNiên / 5⌋
 *   - Vào làm trong chính năm `nam` (chưa đủ 12 tháng): quota = base × sốThángLàmViệc / 12
 *     (làm tròn XUỐNG bội số 0.5)
 *
 * @param {string} dieuKienCV  'Bình thường' | 'Nặng nhọc' | 'Đặc biệt nặng nhọc'
 * @param {string} ngayVaoLam  'yyyy-MM-dd'
 * @param {number} nam         năm áp dụng
 * @param {object} baseMap     map điều kiện → số ngày cơ bản (mặc định BASE_PHEP_MAC_DINH)
 * @returns {number}
 */
function tinhQuota(dieuKienCV, ngayVaoLam, nam, baseMap) {
  const map  = baseMap || BASE_PHEP_MAC_DINH;
  const base = map[dieuKienCV] != null ? Number(map[dieuKienCV]) : 12;
  if (!ngayVaoLam) return base;

  const vao = new Date(ngayVaoLam);
  const yearVao = vao.getFullYear();

  if (yearVao > nam) return 0;                 // chưa vào làm tính tới năm đó

  if (yearVao === nam) {
    // Năm đầu (một phần): từ tháng vào làm đến hết năm
    const soThang = 12 - vao.getMonth();       // getMonth 0-11; vào tháng 4 (idx3) → 9 tháng
    return roundTo05(base * soThang / 12);
  }

  // Đã qua năm đầu → đủ năm: base + thâm niên
  const soNamLamViec = nam - yearVao;
  const bonus = Math.floor(soNamLamViec / 5);
  return base + bonus;
}

/**
 * Kiểm tra số dư phép có đủ cho số ngày xin nghỉ không.
 * @returns {{du:boolean, thieu:number}}
 */
function kiemTraDuPhep(soDuConLai, soNgayXin) {
  const con = Number(soDuConLai) || 0;
  const xin = Number(soNgayXin) || 0;
  return { du: con >= xin, thieu: Math.max(0, xin - con) };
}

// Làm tròn XUỐNG bội số 0.5 (vd 8.16 → 8.0; 8.7 → 8.5)
function roundTo05(x) {
  return Math.floor(Number(x) * 2) / 2;
}
