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
function tinhTrangThaiCong(gioVaoISO, gioRaISO, ca, graceMinutes) {
  if (!gioVaoISO) return 'MAT_CONG';

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
function tinhSoGioLam(trangThai, gioVaoISO, gioRaISO, ca) {
  if (!gioVaoISO || !gioRaISO) return 0;
  if (['TRE','SOM','MAT_CONG','VANG_KHONG_PHEP'].includes(trangThai)) return 0;

  const gioVao = new Date(gioVaoISO);
  const gioRa  = new Date(gioRaISO);

  // Tổng giờ = (gioRa - gioVao) trừ nghỉ trưa (nếu ca HC)
  let tongPhut = (gioRa - gioVao) / 60000;

  // Nếu ca HC (07:30–17:00) và khoảng thời gian vượt qua khung nghỉ trưa → trừ 90 phút
  if (ca.gioBatDau === '07:30' && ca.gioKetThuc === '17:00') {
    const nghiTrua = 90; // 11:30–13:00
    tongPhut = Math.max(0, tongPhut - nghiTrua);
  }

  return Math.round(tongPhut / 60 * 10) / 10; // làm tròn 1 chữ số thập phân
}
