// ─── CaRules.gs ───────────────────────────────────────────────────────────────
// Kiểm tra nghỉ chuyển ca và nghỉ tuần.
// Điều 22 NQLĐ: ≥12h giữa hai ca. Điều 23: ≥24h nghỉ liên tục/tuần.
// KHÔNG truy cập Sheets.

/**
 * Kiểm tra thời gian nghỉ giữa ca trước và ca sau của cùng 1 NV.
 * Điều 22 NQLĐ: phải ≥ 12 giờ.
 *
 * @param {string} gioRaCaTruocISO - ISO string giờ kết thúc ca trước
 * @param {string} gioVaoCaSauISO  - ISO string giờ bắt đầu ca sau
 * @returns {{ ok: boolean, gioNghi: number, thieu: number }}
 */
function kiemTraNghiChuyenCa(gioRaCaTruocISO, gioVaoCaSauISO) {
  const gioRa  = new Date(gioRaCaTruocISO);
  const gioVao = new Date(gioVaoCaSauISO);
  const gioNghi = (gioVao - gioRa) / 3600000;
  const thieu   = Math.max(0, 12 - gioNghi);
  return {
    ok:       gioNghi >= 12,
    gioNghi:  Math.round(gioNghi * 10) / 10,
    thieu:    Math.round(thieu * 10) / 10,
    caiBao:   gioNghi < 12 ? `Nghỉ chuyển ca chỉ ${Math.round(gioNghi * 10) / 10}h (tối thiểu 12h — Điều 22 NQLĐ)` : null
  };
}

/**
 * Kiểm tra nghỉ hằng tuần tối thiểu 24h liên tục (Điều 23 NQLĐ).
 *
 * @param {Array} lichTrucTuan - [{ ngay: 'yyyy-MM-dd', gioBatDau: 'HH:MM', gioKetThuc: 'HH:MM' }]
 *                               Phải được sắp xếp theo thứ tự thời gian.
 * @returns {{ ok: boolean, maxNghiLienTucGio: number, caiBao: string|null }}
 */
function kiemTraNghiTuan(lichTrucTuan) {
  if (!lichTrucTuan || lichTrucTuan.length === 0) {
    return { ok: true, maxNghiLienTucGio: 168, caiBao: null };
  }

  // Chuyển lịch trực thành mảng khoảng [batDau, ketThuc] dạng Date
  const khoangs = lichTrucTuan.map(lt => {
    const [hBD, mBD] = lt.gioBatDau.split(':').map(Number);
    const [hKT, mKT] = lt.gioKetThuc.split(':').map(Number);
    const ngay = new Date(lt.ngay + 'T00:00:00');
    const batDau = new Date(ngay); batDau.setHours(hBD, mBD, 0, 0);
    const ketThuc = new Date(ngay); ketThuc.setHours(hKT, mKT, 0, 0);
    // Ca đêm vượt qua nửa đêm
    if (hKT < hBD) ketThuc.setDate(ketThuc.getDate() + 1);
    return { batDau, ketThuc };
  }).sort((a, b) => a.batDau - b.batDau);

  // Tính khoảng nghỉ giữa các ca
  let maxNghi = 0;
  for (let i = 1; i < khoangs.length; i++) {
    const nghi = (khoangs[i].batDau - khoangs[i - 1].ketThuc) / 3600000;
    if (nghi > maxNghi) maxNghi = nghi;
  }

  const ok = maxNghi >= 24;
  return {
    ok,
    maxNghiLienTucGio: Math.round(maxNghi * 10) / 10,
    caiBao: ok ? null : `Nghỉ liên tục tối đa trong tuần chỉ ${Math.round(maxNghi * 10) / 10}h (tối thiểu 24h — Điều 23 NQLĐ)`
  };
}

/**
 * Kiểm tra toàn bộ lịch tuần và trả về danh sách cảnh báo
 * Dùng khi phân ca cho 1 NV (gọi từ LichTrucApi)
 *
 * @param {Array} lichTrucTuan - như trên, đã bao gồm ca vừa gán
 * @returns {Array<string>} danh sách chuỗi cảnh báo (rỗng = OK)
 */
function kiemTraLichTuan(lichTrucTuan) {
  const canhBaos = [];

  // Kiểm tra từng cặp ca liền kề
  const sorted = [...lichTrucTuan].sort((a, b) =>
    (a.ngay + a.gioBatDau).localeCompare(b.ngay + b.gioBatDau)
  );
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const [phKT, pmKT] = prev.gioKetThuc.split(':').map(Number);
    const [chBD, cmBD] = curr.gioBatDau.split(':').map(Number);

    const prevEnd = new Date(prev.ngay + 'T00:00:00');
    prevEnd.setHours(phKT, pmKT, 0, 0);
    if (phKT < parseInt(prev.gioBatDau.split(':')[0])) prevEnd.setDate(prevEnd.getDate() + 1);

    const currStart = new Date(curr.ngay + 'T00:00:00');
    currStart.setHours(chBD, cmBD, 0, 0);

    const ket = kiemTraNghiChuyenCa(prevEnd.toISOString(), currStart.toISOString());
    if (!ket.ok) canhBaos.push(ket.caiBao);
  }

  // Kiểm tra nghỉ tuần
  const ketTuan = kiemTraNghiTuan(lichTrucTuan);
  if (!ketTuan.ok) canhBaos.push(ketTuan.caiBao);

  return canhBaos;
}
