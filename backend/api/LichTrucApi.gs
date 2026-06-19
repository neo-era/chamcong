// ─── LichTrucApi.gs ───────────────────────────────────────────────────────────

// GET action=getLichTrucNgay&maNV=xxx&ngay=yyyy-MM-dd
function apiGetLichTrucNgay(user, params) {
  const maNV  = params.maNV  || user.maNV;
  const ngay  = params.ngay  || todayStr();
  if (!canViewNV(user, maNV)) throw new Error('Không có quyền xem lịch trực của NV này');
  const lt = getLichTrucNgay(maNV, ngay);
  const ca = lt ? getCaByMa(lt.maCa) : getCaMacDinh();
  return { ok: true, data: { lichTruc: lt, ca } };
}

// GET action=getLichTrucTuan&maNV=xxx&tuanBatDau=yyyy-MM-dd&tuanKetThuc=yyyy-MM-dd
function apiGetLichTrucTuan(user, params) {
  const maNV         = params.maNV         || user.maNV;
  const tuanBatDau   = params.tuanBatDau;
  const tuanKetThuc  = params.tuanKetThuc;
  if (!tuanBatDau || !tuanKetThuc) throw new Error('Thiếu tuanBatDau hoặc tuanKetThuc');
  if (!canViewNV(user, maNV)) throw new Error('Không có quyền xem lịch trực của NV này');

  const lts = getLichTrucTuan(maNV, tuanBatDau, tuanKetThuc);
  // Gắn thông tin ca vào từng bản ghi lịch trực
  const caCache = {};
  const result = lts.map(lt => {
    if (!caCache[lt.maCa]) caCache[lt.maCa] = getCaByMa(lt.maCa);
    return { ...lt, ca: caCache[lt.maCa] };
  });
  return { ok: true, data: result };
}

// POST action=setLichTruc — phân ca cho 1 NV trong 1 ngày
function apiSetLichTruc(user, body) {
  requireQuyen(user, 'PHAN_CA');
  const { maNV, ngay, maCa } = body;
  if (!maNV || !ngay || !maCa) throw new Error('maNV, ngay, maCa là bắt buộc');

  const ca = getCaByMa(maCa);
  if (!ca) throw new Error('Không tìm thấy ca: ' + maCa);

  // Lấy lịch tuần hiện tại để kiểm tra cảnh báo
  const [y, m, d] = ngay.split('-').map(Number);
  const ngayDt    = new Date(y, m - 1, d);
  const thu       = ngayDt.getDay(); // 0=CN
  const batDauTuan = new Date(ngayDt);
  batDauTuan.setDate(d - (thu === 0 ? 6 : thu - 1)); // về T2
  const ketThucTuan = new Date(batDauTuan);
  ketThucTuan.setDate(batDauTuan.getDate() + 6);

  const tuanBatDau  = toDateStr(batDauTuan);
  const tuanKetThuc = toDateStr(ketThucTuan);

  // Gán ca trước khi kiểm tra (để kiemTraLichTuan thấy ca mới)
  setLichTruc(maNV, ngay, maCa);

  const lichMoi = getLichTrucTuan(maNV, tuanBatDau, tuanKetThuc);
  const lichInfo = lichMoi.map(lt => {
    const c = getCaByMa(lt.maCa);
    return { ngay: lt.ngay, gioBatDau: c.gioBatDau, gioKetThuc: c.gioKetThuc };
  });
  const canhBaos = kiemTraLichTuan(lichInfo);

  appendLog(user.maNV, user.email, 'PHAN_CA', 'LichTruc', { maNV, ngay, maCa });
  return { ok: true, canhBaos, message: 'Đã phân ca thành công' };
}

// POST action=deleteLichTruc
function apiDeleteLichTruc(user, body) {
  requireQuyen(user, 'PHAN_CA');
  const { maNV, ngay } = body;
  if (!maNV || !ngay) throw new Error('maNV và ngay là bắt buộc');
  deleteLichTruc(maNV, ngay);
  appendLog(user.maNV, user.email, 'XOA_LICH_TRUC', 'LichTruc', { maNV, ngay });
  return { ok: true, message: 'Đã xoá lịch trực' };
}
