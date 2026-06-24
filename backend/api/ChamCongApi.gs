// ─── ChamCongApi.gs ───────────────────────────────────────────────────────────

// GET action=getChamCongHomNay
// Hỗ trợ ĐA CA/ngày: trả về danh sách ca được phân hôm nay, các bản ghi đã chấm trong ngày,
// và bản ghi đang mở (đã vào chưa ra — có thể là ca đêm vắt từ hôm qua).
function apiGetChamCongHomNay(user) {
  const ngay = todayStr();

  // Ca được phân hôm nay (đa ca). Không có lịch → ca mặc định (khối gián tiếp).
  const lichCa = getLichTrucNgayList(user.maNV, ngay);
  let caList = lichCa.map(lt => getCaByMa(lt.maCa)).filter(Boolean);
  if (!caList.length) { const d = getCaMacDinh(); if (d) caList = [d]; }

  // Các bản ghi chấm công trong ngày (kèm thông tin ca)
  const records = getChamCongNgayList(user.maNV, ngay)
    .map(cc => Object.assign({}, cc, { ca: getCaByMa(cc.maCa) || null }));

  // Bản ghi đang mở (gồm ca đêm vắt qua nửa đêm từ hôm trước)
  const moDangRaw = getChamCongMoDang(user.maNV);
  const moDang = moDangRaw ? Object.assign({}, moDangRaw, { ca: getCaByMa(moDangRaw.maCa) || null }) : null;

  return {
    ok: true,
    data: {
      ngay,
      caList,                 // ca phân cho hôm nay
      records,                // đã chấm trong ngày (đa ca)
      moDang,                 // ca đang mở cần chấm ra (nếu có)
      tatCaCa: listCa()       // toàn bộ ca — cho phép chọn khi không có lịch (vd tăng cường)
    }
  };
}

// GET action=getChamCongKhoang&maNV=xxx&tuNgay=yyyy-MM-dd&denNgay=yyyy-MM-dd
function apiGetChamCongKhoang(user, params) {
  const maNV   = params.maNV   || user.maNV;
  const tuNgay = params.tuNgay;
  const denNgay = params.denNgay;
  if (!tuNgay || !denNgay) throw new Error('Thiếu tuNgay hoặc denNgay');
  if (!canViewNV(user, maNV)) throw new Error('Không có quyền xem chấm công của NV này');
  return { ok: true, data: getChamCongKhoang(maNV, tuNgay, denNgay) };
}

// POST action=chamVao  body {maCa?, toaDo?}
// Đa ca: mỗi ca là 1 bản ghi (maNV, ngày, maCa). Phải chấm RA ca đang mở trước khi vào ca mới.
function apiChamVao(user, body) {
  requireQuyen(user, 'CHAM_CONG');
  const ngay   = todayStr();          // Giờ MÁY CHỦ — không tin client
  const gioVao = new Date();

  // Còn ca chưa chấm ra (kể cả ca đêm hôm qua) → bắt chấm ra trước
  const moDang = getChamCongMoDang(user.maNV);
  if (moDang) {
    const caMo = getCaByMa(moDang.maCa);
    throw new Error('Bạn còn ca chưa chấm ra (' + (caMo ? caMo.tenCa : moDang.maCa) +
      ' — ngày ' + toDateStr(moDang.ngay) + ', vào lúc ' + _formatGio(moDang.gioVao) +
      '). Hãy CHẤM RA ca đó trước khi vào ca mới.');
  }

  // Xác định ca: ưu tiên client chọn; nếu không, suy từ lịch trực hôm nay.
  let maCa = body.maCa;
  if (!maCa) {
    const lich = getLichTrucNgayList(user.maNV, ngay);
    if (lich.length === 1) maCa = lich[0].maCa;
    else if (lich.length === 0) { const d = getCaMacDinh(); maCa = d ? d.maCa : null; }
    else throw new Error('Hôm nay có nhiều ca — vui lòng chọn ca trước khi chấm vào');
  }
  const ca = maCa ? getCaByMa(maCa) : null;
  if (!ca) throw new Error('Không xác định được ca làm việc');

  // Đã chấm vào ca này trong ngày chưa (không cho chấm lại cùng ca/ngày)
  const trung = getChamCongNgayCa(user.maNV, ngay, ca.maCa);
  if (trung && trung.gioVao) {
    throw new Error('Đã chấm vào ca ' + ca.tenCa + ' hôm nay lúc ' + _formatGio(trung.gioVao));
  }

  const grace     = getConfigNumber('grace_minutes', 0);
  const theoGio   = (user.khoi === 'Trực tiếp');   // khối trực tiếp tính theo giờ
  const gioVaoIso = toIsoVN(gioVao);               // lưu giờ VN (+07:00)
  const trangThai = tinhTrangThaiCong(gioVaoIso, null, ca, grace, theoGio);
  const nguon     = body.toaDo ? 'GPS hiện trường' : 'Trụ sở';
  const maCC      = genMaCC(user.maNV, ngay, ca.maCa);

  saveChamCong({
    maCC, maNV: user.maNV, ngay, maCa: ca.maCa,
    gioVao: gioVaoIso, gioRa: '',
    nguon, toaDo: body.toaDo || '', trangThai, soGioCong: 0
  });

  appendLog(user.maNV, user.email, 'CHAM_VAO', 'ChamCong', { maCC, ngay, maCa: ca.maCa, trangThai, nguon });

  return {
    ok: true,
    data: {
      maCC, maCa: ca.maCa, tenCa: ca.tenCa,
      gioVao:      gioVaoIso,
      trangThai,
      trangThaiLabel: labelTrangThai(trangThai),
      laCanhBao:   trangThai === 'TRE'
    }
  };
}

// POST action=chamRa  body {toaDo?}
// Chấm ra bản ghi ĐANG MỞ gần nhất (không phụ thuộc ngày lịch → ca đêm vắt qua nửa đêm OK).
function apiChamRa(user, body) {
  requireQuyen(user, 'CHAM_CONG');
  const gioRa = new Date(); // Giờ MÁY CHỦ

  const open = getChamCongMoDang(user.maNV);
  if (!open) throw new Error('Không có ca nào đang mở để chấm ra');

  const ca    = getCaByMa(open.maCa) || getCaMacDinh();
  const grace = getConfigNumber('grace_minutes', 0);
  const theoGio   = (user.khoi === 'Trực tiếp');
  const gioRaIso  = toIsoVN(gioRa);                // lưu giờ VN (+07:00)
  const trangThai = tinhTrangThaiCong(open.gioVao, gioRaIso, ca, grace, theoGio);
  const soGioCong = tinhSoGioLam(trangThai, open.gioVao, gioRaIso, ca, theoGio);

  updateChamCong(open.maCC, {
    gioRa:    gioRaIso,
    trangThai,
    soGioCong,
    toaDo:    body.toaDo ? (open.toaDo || '') + '|Ra:' + body.toaDo : open.toaDo
  });

  appendLog(user.maNV, user.email, 'CHAM_RA', 'ChamCong', {
    maCC: open.maCC, ngay: toDateStr(open.ngay), trangThai, soGioCong
  });

  // ── Cảnh báo trần giờ (chỉ cảnh báo — không chặn) ──────────────────────────
  const canhBao = [];
  const ngayBG  = toDateStr(open.ngay);

  // (1) Tổng giờ trong ngày vượt trần (đọc lại sheet → đã gồm bản ghi vừa cập nhật)
  const tongNgay = getChamCongNgayList(user.maNV, ngayBG)
    .reduce((s, r) => s + (Number(r.soGioCong) || 0), 0);
  const tg = kiemTraTranGioNgay(tongNgay, getConfigNumber('gio_toi_da_ngay', 12));
  if (tg.vuot) {
    canhBao.push('Tổng giờ làm ngày ' + _fmtNgayVN(ngayBG) + ' là ' + tg.tong + 'h, vượt trần ' + tg.tran + 'h/ngày.');
  }

  // (2) Nghỉ tuần: khoảng nghỉ liên tục dài nhất trong 7 ngày gần nhất
  const denMs  = gioRa.getTime();
  const tuMs   = denMs - 7 * 24 * 3600 * 1000;
  const tuDate = Utilities.formatDate(new Date(tuMs), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const khoangLam = getChamCongKhoang(user.maNV, tuDate, ngayBG)
    .filter(r => r.gioVao && r.gioRa)
    .map(r => ({ batDau: r.gioVao, ketThuc: r.gioRa }));
  const nghiMax  = khoangNghiLienTucMax(khoangLam, new Date(tuMs).toISOString(), gioRa.toISOString());
  const nguongNghi = getConfigNumber('nghi_tuan_toi_thieu_gio', 24);
  if (nghiMax < nguongNghi) {
    canhBao.push('7 ngày gần nhất chưa có kỳ nghỉ liên tục ≥' + nguongNghi + 'h (dài nhất ' + nghiMax + 'h). Cần bố trí nghỉ tuần.');
  }

  return {
    ok: true,
    data: {
      maCC:          open.maCC,
      gioRa:         gioRaIso,
      soGioCong,
      trangThai,
      trangThaiLabel: labelTrangThai(trangThai),
      laCanhBao:     trangThai === 'SOM',
      canhBao                      // mảng chuỗi cảnh báo trần giờ (có thể rỗng)
    }
  };
}

// Định dạng ngày VN dd/MM/yyyy từ chuỗi yyyy-MM-dd
function _fmtNgayVN(ngayStr) {
  const p = String(ngayStr).substring(0, 10).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ngayStr;
}

// POST action=suaChamCong — HR/Admin only; BẮT BUỘC có lyDo; ghi AuditLog
// Cho phép sửa cả trangThai thủ công (vd đánh dấu VANG_PHEP/VANG_KHONG_PHEP); nếu không
// truyền trangThai thì tính lại từ giờ vào/ra theo Điều 7.3.
function apiSuaChamCong(user, body) {
  requireQuyen(user, 'SUA_CHAM_CONG');
  const { maCC, gioVao, gioRa, trangThai: trangThaiMoi, lyDo } = body;
  if (!maCC) throw new Error('Thiếu maCC');
  if (!lyDo) throw new Error('Phải nhập lý do khi sửa chấm công (yêu cầu bởi quy trình)');

  const existing = getChamCongByMaCC(maCC);
  if (!existing) throw new Error('Không tìm thấy bản ghi: ' + maCC);
  if (ccDaKhoa(existing)) throw new Error('Bản ghi đã khoá — phải mở khoá trước khi sửa');

  const ca        = getCaByMa(existing.maCa) || getCaMacDinh();
  const grace     = getConfigNumber('grace_minutes', 0);
  const nvBanGhi  = getNVByMa(existing.maNV);
  const theoGio   = (nvBanGhi && nvBanGhi.khoi === 'Trực tiếp');   // theo khối của NV trong bản ghi
  const newGioVao = gioVao || existing.gioVao;
  const newGioRa  = gioRa  || existing.gioRa  || null;
  // Ưu tiên trangThai do HR chỉ định; nếu rỗng → tính lại từ giờ (trực tiếp/gián tiếp tuỳ khối).
  const trangThai = (trangThaiMoi && TRANG_THAI_CC[trangThaiMoi])
    ? trangThaiMoi
    : tinhTrangThaiCong(newGioVao, newGioRa, ca, grace, theoGio);
  const soGioCong = tinhSoGioLam(trangThai, newGioVao, newGioRa, ca, theoGio);

  updateChamCong(maCC, { gioVao: newGioVao, gioRa: newGioRa || '', trangThai, soGioCong });

  appendLog(user.maNV, user.email, 'SUA_CHAM_CONG', 'ChamCong', {
    maCC, lyDo,
    cuGioVao: existing.gioVao, cuGioRa: existing.gioRa, cuTrangThai: existing.trangThai,
    moiGioVao: newGioVao, moiGioRa: newGioRa, moiTrangThai: trangThai
  });

  return {
    ok: true,
    data: { maCC, trangThai, trangThaiLabel: labelTrangThai(trangThai) }
  };
}

// Tìm bản ghi từ body: ưu tiên maCC, nếu không có thì theo maNV + ngay.
function _resolveChamCong(body) {
  if (body.maCC) {
    const cc = getChamCongByMaCC(body.maCC);
    if (!cc) throw new Error('Không tìm thấy bản ghi: ' + body.maCC);
    return cc;
  }
  if (body.maNV && body.ngay) {
    const cc = getChamCongNgay(body.maNV, body.ngay);
    if (!cc) throw new Error('Không có bản ghi chấm công cho ' + body.maNV + ' ngày ' + body.ngay);
    return cc;
  }
  throw new Error('Thiếu maCC hoặc (maNV + ngay)');
}

// POST action=khoaChamCong — HR/Admin khoá bản ghi để chốt công; ghi AuditLog.
function apiKhoaChamCong(user, body) {
  requireQuyen(user, 'KHOA_BANG_CONG');
  const existing = _resolveChamCong(body);
  setChamCongLock(existing.maCC, true);
  appendLog(user.maNV, user.email, 'KHOA_CHAM_CONG', 'ChamCong', { maCC: existing.maCC, ngay: toDateStr(existing.ngay) });
  return { ok: true, data: { maCC: existing.maCC, isLocked: true } };
}

// POST action=moKhoaChamCong — HR/Admin mở khoá; BẮT BUỘC có lyDo; ghi AuditLog.
function apiMoKhoaChamCong(user, body) {
  requireQuyen(user, 'KHOA_BANG_CONG');
  if (!body.lyDo) throw new Error('Phải nhập lý do khi mở khoá bản ghi chấm công');
  const existing = _resolveChamCong(body);
  setChamCongLock(existing.maCC, false);
  appendLog(user.maNV, user.email, 'MO_KHOA_CHAM_CONG', 'ChamCong', { maCC: existing.maCC, ngay: toDateStr(existing.ngay), lyDo: body.lyDo });
  return { ok: true, data: { maCC: existing.maCC, isLocked: false } };
}

function _formatGio(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'HH:mm');
  } catch (_) { return String(isoOrDate); }
}
