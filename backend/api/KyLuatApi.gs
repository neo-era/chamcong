// ─── KyLuatApi.gs ─────────────────────────────────────────────────────────────
// Quét & xem cảnh báo kỷ luật (GĐ4). Hệ thống CHỈ cảnh báo.

function _nguongKyLuat() {
  return {
    khien: getConfigNumber('nguong_ky_luat_30_khien', 3),
    keo:   getConfigNumber('nguong_ky_luat_30_keo', 4),
    sa30:  getConfigNumber('nguong_ky_luat_30_sa', 5),
    sa365: getConfigNumber('nguong_ky_luat_365_sa', 20)
  };
}

function _truNgay(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - n);
  const y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + dd;
}

// Quét 1 NV: đếm bỏ việc cửa sổ 30 & 365 ngày, sinh cảnh báo nếu chạm ngưỡng (không trùng/ngày).
function quetCanhBaoMotNV(maNV) {
  const den   = todayStr();
  const tu30  = _truNgay(den, 30);
  const tu365 = _truNgay(den, 365);
  const s30  = demBoViecTrongKhoang(getChamCongKhoang(maNV, tu30, den));
  const s365 = demBoViecTrongKhoang(getChamCongKhoang(maNV, tu365, den));
  const muc  = xacDinhMucCanhBao(s30, s365, _nguongKyLuat());
  if (!muc) return null;
  if (daCoCanhBaoTrongNgay(maNV, muc, den)) return null;

  const cb = themCanhBao({ maNV, soNgayBoViec30: s30, soNgayBoViec365: s365, mucCanhBao: muc });
  appendLog('SYSTEM', '', 'SINH_CANH_BAO', 'CanhBaoKyLuat', { maNV, mucCanhBao: muc, s30, s365 });

  // NC-E: thông báo cho HR/Admin
  if (typeof themThongBao === 'function') {
    listNV({ trangThai: 'Đang làm' }).filter(n => ['HR', 'Admin'].includes(n.vaiTro))
      .forEach(n => themThongBao(n.maNV, 'Cảnh báo kỷ luật: ' + maNV + ' — ' + muc, 'ky-luat.html'));
  }
  return cb;
}

// Quét toàn bộ NV đang làm — dùng cho Time-driven trigger hằng ngày.
function quetCanhBaoTatCa() {
  const ds = listNV({ trangThai: 'Đang làm' });
  let soMoi = 0;
  ds.forEach(function (nv) { if (quetCanhBaoMotNV(nv.maNV)) soMoi++; });
  Logger.log('Quét cảnh báo kỷ luật: ' + soMoi + ' cảnh báo mới / ' + ds.length + ' NV');
  return soMoi;
}

// POST action=quetCanhBao — chạy quét thủ công.
function apiQuetCanhBao(user, body) {
  requireQuyen(user, 'XEM_CANH_BAO');
  const soMoi = quetCanhBaoTatCa();
  appendLog(user.maNV, user.email, 'QUET_CANH_BAO', 'CanhBaoKyLuat', { soMoi });
  return { ok: true, data: { soMoi } };
}

// GET action=getChiTietViPham&maNV=&tuNgay=&denNgay= — NC-J: dữ liệu lập biên bản kỷ luật
function apiGetChiTietViPham(user, params) {
  requireQuyen(user, 'XEM_CANH_BAO');
  const maNV = params.maNV;
  if (!maNV) throw new Error('Thiếu maNV');
  const den = params.denNgay || todayStr();
  const tu  = params.tuNgay  || _truNgay(den, 365);
  const nv  = getNVByMa(maNV) || {};

  const viPham = getChamCongKhoang(maNV, tu, den)
    .filter(c => laBoViec(c.trangThai))
    .map(c => ({ ngay: toDateStr(c.ngay), trangThai: c.trangThai, label: labelTrangThai(c.trangThai) }))
    .sort((a, b) => a.ngay.localeCompare(b.ngay));

  const nguong = _nguongKyLuat();
  const homNay = todayStr();
  const s30  = demBoViecTrongKhoang(getChamCongKhoang(maNV, _truNgay(homNay, 30), homNay));
  const s365 = demBoViecTrongKhoang(getChamCongKhoang(maNV, _truNgay(homNay, 365), homNay));
  const muc  = xacDinhMucCanhBao(s30, s365, nguong);

  return { ok: true, data: {
    maNV: maNV, hoTen: nv.hoTen, donVi: nv.donVi, chucDanh: nv.chucDanh,
    tuNgay: tu, denNgay: den, viPham: viPham,
    soNgayBoViec30: s30, soNgayBoViec365: s365, mucCanhBao: muc || '(chưa chạm ngưỡng)',
    donVi1: getConfig('don_vi_cap1') || 'CÔNG TY CỔ PHẦN CHIẾU SÁNG CÔNG CỘNG TP.HCM',
    donVi2: getConfig('don_vi_cap2') || 'CHIẾU SÁNG KHU VỰC TRUNG TÂM'
  } };
}

// GET action=getCanhBao&donVi=&mucCanhBao=
function apiGetCanhBao(user, params) {
  requireQuyen(user, 'XEM_CANH_BAO');
  let out = listCanhBao().map(function (cb) {
    const nv = getNVByMa(cb.maNV);
    return Object.assign({}, cb, { hoTen: nv ? nv.hoTen : '', donVi: nv ? nv.donVi : '' });
  });
  // Tổ trưởng/Trưởng đơn vị chỉ thấy đơn vị mình
  if (['ToTruong', 'TruongDonVi'].includes(user.vaiTro)) {
    out = out.filter(x => x.donVi === user.donVi);
  }
  if (params.donVi)      out = out.filter(x => x.donVi === params.donVi);
  if (params.mucCanhBao) out = out.filter(x => x.mucCanhBao === params.mucCanhBao);
  out.sort((a, b) => tsMs(b.thoiDiem) - tsMs(a.thoiDiem));
  return { ok: true, data: out };
}

// Tiện ích chạy trong Editor: tạo trigger quét hằng ngày lúc 6h.
function taoTriggerKyLuat() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'quetCanhBaoTatCa') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('quetCanhBaoTatCa').timeBased().everyDays(1).atHour(6).create();
  Logger.log('✓ Đã tạo trigger quetCanhBaoTatCa chạy hằng ngày ~6h');
}
