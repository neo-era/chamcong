// ─── ChamCongRules.gs ─────────────────────────────────────────────────────────
// Lõi quy tắc chấm công — hiện thực Điều 7.3 Nội quy lao động (QĐ 44/QĐ-CTCSCC).
// KHÔNG truy cập Sheets. Nhận tham số, trả kết quả thuần.

const TRANG_THAI_CC = {
  DU_CONG:       'Đủ công',
  TRE:           'Đi trễ',
  SOM:           'Về sớm',
  MAT_CONG:      'Mất công',
  VANG_PHEP:     'Vắng có phép',
  VANG_KHONG_PHEP: 'Vắng không phép'
};

/**
 * Xác định trạng thái công dựa trên giờ vào/ra so với ca.
 *
 * Điều 7.3 NQLĐ: đi trễ / về sớm = "tự ý bỏ việc ngày đó"
 * → trạng thái TRE hoặc SOM đều tính là mất công cho mục đích kỷ luật.
 *
 * @param {string|null} gioVaoISO  - ISO string giờ vào (từ máy chủ), null nếu chưa chấm
 * @param {string|null} gioRaISO   - ISO string giờ ra, null nếu chưa chấm ra
 * @param {object} ca              - { gioBatDau: 'HH:MM', gioKetThuc: 'HH:MM' }
 * @param {number} graceMinutes    - Số phút ân hạn (từ CauHinh grace_minutes)
 * @returns {string} key của TRANG_THAI_CC
 */
function tinhTrangThaiCong(gioVaoISO, gioRaISO, ca, graceMinutes, theoGio) {
  if (!gioVaoISO) return 'MAT_CONG';

  // Khối Trực tiếp (theoGio=true): có chấm vào → DU_CONG, công tính theo giờ.
  // Đi trễ/về sớm KHÔNG đổi trạng thái (chỉ trừ giờ ở tinhSoGioLam). Xem docs/07.
  if (theoGio) return 'DU_CONG';

  const gioVao = new Date(gioVaoISO);
  const grace  = parseInt(graceMinutes) || 0;

  // Xây dựng đối tượng Date cho giờ bắt đầu ca (cùng ngày với gioVao)
  const [hBD, mBD] = ca.gioBatDau.split(':').map(Number);
  const gioBD = new Date(gioVao);
  gioBD.setHours(hBD, mBD, 0, 0);

  // Đi trễ: gioVao > gioBD + grace → mất công ngày đó (Điều 7.3)
  if ((gioVao - gioBD) / 60000 > grace) return 'TRE';

  if (!gioRaISO) {
    // Chưa chấm ra: ca chưa kết thúc → tạm ghi DU_CONG (sẽ tính lại khi chamRa)
    return 'DU_CONG';
  }

  const gioRa = new Date(gioRaISO);

  // Xây dựng đối tượng Date cho giờ kết thúc ca
  const [hKT, mKT] = ca.gioKetThuc.split(':').map(Number);
  const gioKT = new Date(gioVao);
  gioKT.setHours(hKT, mKT, 0, 0);
  // Ca đêm vượt qua nửa đêm
  if (hKT < hBD) gioKT.setDate(gioKT.getDate() + 1);

  // Về sớm: gioRa < gioKT - grace → mất công ngày đó (Điều 7.3)
  if ((gioKT - gioRa) / 60000 > grace) return 'SOM';

  return 'DU_CONG';
}

/**
 * Kiểm tra trạng thái có tính là "bỏ việc không lý do" để đếm kỷ luật (GĐ4).
 * TRE, SOM, MAT_CONG, VANG_KHONG_PHEP đều tính.
 */
function laBoViec(trangThai) {
  return ['TRE','SOM','MAT_CONG','VANG_KHONG_PHEP'].includes(trangThai);
}

/**
 * Lấy nhãn hiển thị tiếng Việt của trạng thái
 */
function labelTrangThai(key) {
  return TRANG_THAI_CC[key] || key;
}

/**
 * Tính số giờ làm thực tế trong ngày (dùng cho bảng công GĐ3)
 * Trả về 0 nếu TRE/SOM/MAT_CONG (mất công cả ngày theo Điều 7.3)
 */
function tinhSoGioLam(trangThai, gioVaoISO, gioRaISO, ca, theoGio) {
  if (!gioVaoISO || !gioRaISO) return 0;

  // Khối Trực tiếp (theoGio=true): giờ thực = (ra − vào), nghỉ giữa ca TÍNH VÀO giờ làm
  // (không trừ), làm tròn XUỐNG bội số 0.5. Trễ/sớm vẫn tính giờ thực (không bị 0). Xem docs/07.
  if (theoGio) {
    const phut = (new Date(gioRaISO) - new Date(gioVaoISO)) / 60000;
    return Math.floor(Math.max(0, phut) / 60 * 2) / 2;
  }

  // Khối Gián tiếp: trễ/sớm/mất công → 0 giờ (Điều 7.3)
  if (['TRE','SOM','MAT_CONG','VANG_KHONG_PHEP'].includes(trangThai)) return 0;

  const gioVao = new Date(gioVaoISO);
  const gioRa  = new Date(gioRaISO);
  let tongPhut = (gioRa - gioVao) / 60000;

  // Ca HC (07:30–17:00): trừ 90 phút nghỉ trưa (11:30–13:00)
  if (ca.gioBatDau === '07:30' && ca.gioKetThuc === '17:00') {
    tongPhut = Math.max(0, tongPhut - 90);
  }

  return Math.round(tongPhut / 60 * 10) / 10;
}

/**
 * Cảnh báo trần giờ làm trong ngày (chỉ cảnh báo — không chặn).
 * @param {number} tongGioNgay - tổng số giờ công đã làm trong ngày (cộng các ca)
 * @param {number} tranGio     - trần giờ/ngày (CauHinh gio_toi_da_ngay)
 * @returns {{vuot:boolean, tong:number, tran:number}}
 */
function kiemTraTranGioNgay(tongGioNgay, tranGio) {
  const tran = parseFloat(tranGio) || 12;
  const tong = Math.round((parseFloat(tongGioNgay) || 0) * 10) / 10;
  return { vuot: tong > tran, tong: tong, tran: tran };
}

/**
 * Tính khoảng nghỉ liên tục DÀI NHẤT (giờ) trong cửa sổ [tuISO, denISO],
 * dựa trên các khoảng làm việc. Dùng để cảnh báo nghỉ tuần ≥24h (Điều 6.x NQLĐ).
 * @param {Array<{batDau:string, ketThuc:string}>} cacKhoangLam - ISO string vào/ra
 * @param {string} tuISO  - đầu cửa sổ (ISO)
 * @param {string} denISO - cuối cửa sổ (ISO)
 * @returns {number} số giờ nghỉ liên tục dài nhất
 */
function khoangNghiLienTucMax(cacKhoangLam, tuISO, denISO) {
  const tu  = new Date(tuISO).getTime();
  const den = new Date(denISO).getTime();
  if (!(den > tu)) return 0;

  const iv = (cacKhoangLam || [])
    .map(k => ({ s: new Date(k.batDau).getTime(), e: new Date(k.ketThuc).getTime() }))
    .filter(k => !isNaN(k.s) && !isNaN(k.e) && k.e > tu && k.s < den)
    .sort((a, b) => a.s - b.s);

  let prev = tu;
  let maxGap = 0;
  iv.forEach(k => {
    const s = Math.max(k.s, tu);
    if (s - prev > maxGap) maxGap = s - prev;
    prev = Math.max(prev, Math.min(k.e, den));
  });
  if (den - prev > maxGap) maxGap = den - prev;
  return Math.round(maxGap / 3600000 * 10) / 10;   // giờ, 1 chữ số thập phân
}
