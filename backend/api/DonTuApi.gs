// ─── DonTuApi.gs ──────────────────────────────────────────────────────────────
// Orchestrate quy trình đơn từ + duyệt (GĐ2). Gọi rules (DuyetRules) + data
// (DonTuData, BuocDuyetData, NhanVienData) + phân quyền (QuyenRules).

// ── Helpers nội bộ ──────────────────────────────────────────────────────────

// Danh sách ngày lễ từ CauHinh (chuỗi 'yyyy-MM-dd' phân tách bởi , ; hoặc khoảng trắng)
function _danhSachNgayLe() {
  const raw = getConfig('ngay_le_tet') || '';
  return String(raw).split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
}

// Thông tin tiến trình duyệt của 1 đơn
function _thongTinDuyet(don) {
  const nv       = getNVByMa(don.maNV) || {};
  const yeuCau   = capDuyetYeuCau(nv.vaiTro || 'NV', nv.khoi || 'Gián tiếp');
  const buoc     = getBuocDuyetCuaDon(don.maDon);
  const soDuyet  = buoc.filter(b => b.ketQua === 'Duyệt').length;
  const capHienTai = soDuyet + 1;
  return {
    yeuCau,
    capToiDa:   yeuCau.length,
    capHienTai,
    quyenCanCo: quyenChoCap(yeuCau, capHienTai),
    buoc
  };
}

// User có phải người duyệt hợp lệ cho `quyen` đối với NV tạo đơn không.
function _canApprove(user, nv, quyen) {
  if (!quyen || !hasQuyen(user, quyen)) return false;
  if (['BGD', 'Admin'].includes(user.vaiTro)) return true; // BGĐ & Admin duyệt mọi cấp trong quyền
  if (quyen === 'DUYET_CAP1') {
    return user.maNV === nv.quanLyTrucTiep || user.donVi === nv.donVi;
  }
  return user.donVi === nv.donVi;                          // DUYET_CAP2
}

function _guiMail(to, subject, body) {
  try { if (to) MailApp.sendEmail(to, subject, body); } catch (_) { /* không chặn luồng nếu mail lỗi */ }
}

// Map maNV → hoTen (đọc NhanVien 1 lần cho mỗi request)
function _tenMap() {
  const m = {};
  listNV().forEach(n => { m[n.maNV] = n.hoTen; });
  return m;
}

// Gắn tên người duyệt vào từng bước (nguoiDuyetTen)
function _ganTenBuoc(buocList, tenMap) {
  return (buocList || []).map(b =>
    Object.assign({}, b, { nguoiDuyetTen: tenMap[b.nguoiDuyet] || b.nguoiDuyet }));
}

// NC-C: tổng giờ OT đã duyệt của NV trong tháng / năm (bỏ qua 1 đơn nếu cần)
function _tongOtThang(maNV, nam, thang, maDonBoQua) {
  const thangStr = nam + '-' + ('0' + thang).slice(-2);
  const ds = listDonCuaNV(maNV, { loaiDon: 'OT', trangThai: 'Đã duyệt' })
    .filter(d => d.maDon !== maDonBoQua && toDateStr(d.tuNgay).substring(0, 7) === thangStr);
  return tongOtGio(ds);
}
function _tongOtNam(maNV, nam, maDonBoQua) {
  const ds = listDonCuaNV(maNV, { loaiDon: 'OT', trangThai: 'Đã duyệt' })
    .filter(d => d.maDon !== maDonBoQua && toDateStr(d.tuNgay).substring(0, 4) === String(nam));
  return tongOtGio(ds);
}

// NC-D: định mức nghỉ việc riêng (JSON từ CauHinh)
function _dinhMucViecRieng() {
  try { return JSON.parse(getConfig('dinh_muc_viec_rieng') || '{}'); } catch (_) { return {}; }
}

// Tìm email người duyệt kế tiếp (theo cấp) để thông báo
function _emailNguoiDuyetKeTiep(don) {
  const tt = _thongTinDuyet(don);
  if (tt.capHienTai > tt.capToiDa) return null;
  const nv = getNVByMa(don.maNV);
  if (!nv) return null;
  // Cấp 1 → quản lý trực tiếp; cấp ≥2 → tìm trưởng đơn vị cùng đơn vị
  if (tt.quyenCanCo === 'DUYET_CAP1' && nv.quanLyTrucTiep) {
    const ql = getNVByMa(nv.quanLyTrucTiep);
    return ql ? ql.email : null;
  }
  const truong = listNV({ donVi: nv.donVi }).find(n =>
    n.vaiTro === 'TruongDonVi' || (tt.quyenCanCo === 'DUYET_CAP3' && n.vaiTro === 'BGD'));
  return truong ? truong.email : null;
}

// ── API: tạo / thu hồi / bổ sung ─────────────────────────────────────────────

// POST action=taoDon
function apiTaoDon(user, body) {
  requireQuyen(user, 'TAO_DON');
  const loaiDon = body.loaiDon;
  if (LOAI_DON.indexOf(loaiDon) === -1) throw new Error('Loại đơn không hợp lệ: ' + loaiDon);

  const donViTinh = body.donViTinh === 'Nửa ngày' ? 'Nửa ngày' : 'Ngày';
  const tuNgay  = body.tuNgay;
  const denNgay = body.denNgay || body.tuNgay;
  if (!tuNgay) throw new Error('Thiếu từ ngày');
  if (toDateStr(denNgay) < toDateStr(tuNgay)) throw new Error('Đến ngày phải ≥ từ ngày');
  if (!body.lyDo || !String(body.lyDo).trim()) throw new Error('Phải nhập lý do');

  const soNgay = tinhSoNgay(tuNgay, denNgay, donViTinh, _danhSachNgayLe());
  const nguonChiTra = body.nguonChiTra || nguonChiTraMacDinh(loaiDon);
  let canhBao = '';

  // Cảnh báo số dư phép (không chặn ở GĐ2; trừ phép thực hiện ở GĐ3)
  if (loaiDon === 'Phép năm' && typeof getSoDu === 'function') {
    try {
      const nam = Number(toDateStr(tuNgay).substring(0, 4));
      const sd = getSoDu(user.maNV, nam);
      if (sd && Number(sd.conLai) < soNgay) {
        canhBao = 'Số dư phép còn ' + sd.conLai + ' ngày, không đủ cho ' + soNgay + ' ngày xin nghỉ';
      }
    } catch (_) { /* SoDuPhep chưa có ở GĐ2 */ }
  }

  // NC-C: OT — số giờ + cảnh báo trần (chặn khi duyệt cuối)
  const soGio = (loaiDon === 'OT') ? (Number(body.soGio) || 0) : '';
  if (loaiDon === 'OT') {
    if (soGio <= 0) throw new Error('Đơn OT phải nhập số giờ làm thêm');
    const nam = Number(toDateStr(tuNgay).substring(0, 4));
    const thang = Number(toDateStr(tuNgay).substring(5, 7));
    const kt = kiemTraTranOT(_tongOtThang(user.maNV, nam, thang, null) + soGio,
                             _tongOtNam(user.maNV, nam, null) + soGio,
                             { thang: getConfigNumber('ot_max_thang', 40), nam: getConfigNumber('ot_max_nam', 200) });
    if (kt.thongBao) canhBao = (canhBao ? canhBao + ' ' : '') + '⚠ ' + kt.thongBao;
  }

  // NC-D: Việc riêng — kiểm tra định mức theo lý do
  const lyDoDinhMuc = (loaiDon === 'Việc riêng') ? (body.lyDoDinhMuc || '') : '';
  if (loaiDon === 'Việc riêng' && lyDoDinhMuc) {
    const dm = _dinhMucViecRieng();
    if (dm[lyDoDinhMuc] != null && soNgay > dm[lyDoDinhMuc]) {
      throw new Error('Việc riêng "' + lyDoDinhMuc + '" tối đa ' + dm[lyDoDinhMuc] +
        ' ngày (xin ' + soNgay + '). Vui lòng giảm ngày hoặc chuyển sang Nghỉ không lương.');
    }
  }

  const maDon = genMaDon(user.maNV);
  const don = {
    maDon, maNV: user.maNV, loaiDon, donViTinh, nguonChiTra,
    tuNgay: toDateStr(tuNgay), denNgay: toDateStr(denNgay), soNgay,
    lyDo: String(body.lyDo).trim(), dinhKem: body.dinhKem || '',
    trangThai: 'Chờ duyệt', ngayTao: new Date().toISOString(),
    soGio: soGio, lyDoDinhMuc: lyDoDinhMuc
  };
  createDon(don);
  appendLog(user.maNV, user.email, 'TAO_DON', 'DonTu', { maDon, loaiDon, soNgay, soGio });

  _guiMail(_emailNguoiDuyetKeTiep(don),
    '[Chấm công CSCC] Đơn mới cần duyệt: ' + loaiDon,
    user.hoTen + ' (' + user.maNV + ') vừa gửi đơn ' + loaiDon + ' từ ' +
    don.tuNgay + ' đến ' + don.denNgay + ' (' + soNgay + ' ngày). Vui lòng đăng nhập để duyệt.');

  // NC-E: thông báo trong app cho người duyệt cấp 1 (quản lý trực tiếp)
  if (typeof themThongBao === 'function') {
    const nvTao = getNVByMa(user.maNV);
    if (nvTao && nvTao.quanLyTrucTiep) {
      themThongBao(nvTao.quanLyTrucTiep, user.hoTen + ' gửi đơn ' + loaiDon + ' cần bạn duyệt', 'duyet-don.html');
    }
  }

  return { ok: true, data: { maDon, soNgay, canhBao } };
}

// POST action=thuHoiDon — chỉ người tạo, chỉ khi chưa duyệt cuối
function apiThuHoiDon(user, body) {
  const maDon = body.maDon;
  const don = getDonByMa(maDon);
  if (!don) throw new Error('Không tìm thấy đơn: ' + maDon);
  if (don.maNV !== user.maNV) throw new Error('Chỉ người tạo đơn được thu hồi');
  if (['Đã duyệt', 'Từ chối', 'Thu hồi'].indexOf(don.trangThai) !== -1) {
    throw new Error('Đơn đã ' + don.trangThai + ' — không thể thu hồi');
  }
  updateDon(maDon, { trangThai: 'Thu hồi' });
  appendLog(user.maNV, user.email, 'THU_HOI_DON', 'DonTu', { maDon });

  // Nếu là phép năm đã trừ (GĐ3) thì hoàn lại — guard vì GĐ2 chưa có
  if (don.loaiDon === 'Phép năm' && don.trangThai === 'Đã duyệt' && typeof hoanPhep === 'function') {
    const nam = Number(String(don.tuNgay).substring(0, 4));
    try { hoanPhep(don.maNV, nam, Number(don.soNgay)); } catch (_) {}
  }
  return { ok: true, data: { maDon, trangThai: 'Thu hồi' } };
}

// POST action=suaDonBoSung — người tạo nộp lại đơn đang 'Bổ sung'
function apiSuaDonBoSung(user, body) {
  const maDon = body.maDon;
  const don = getDonByMa(maDon);
  if (!don) throw new Error('Không tìm thấy đơn: ' + maDon);
  if (don.maNV !== user.maNV) throw new Error('Chỉ người tạo đơn được sửa');
  if (don.trangThai !== 'Bổ sung') throw new Error('Chỉ sửa được đơn đang ở trạng thái Bổ sung');

  const updates = { trangThai: 'Chờ duyệt' };
  // Cho phép cập nhật một số trường khi nộp lại
  if (body.tuNgay)  updates.tuNgay  = toDateStr(body.tuNgay);
  if (body.denNgay) updates.denNgay = toDateStr(body.denNgay);
  if (body.donViTinh) updates.donViTinh = body.donViTinh === 'Nửa ngày' ? 'Nửa ngày' : 'Ngày';
  if (body.lyDo)    updates.lyDo    = String(body.lyDo).trim();
  if (body.dinhKem !== undefined) updates.dinhKem = body.dinhKem;
  // Tính lại số ngày nếu có đổi ngày/đơn vị tính
  const tu = updates.tuNgay || don.tuNgay;
  const den = updates.denNgay || don.denNgay;
  const dvt = updates.donViTinh || don.donViTinh;
  updates.soNgay = tinhSoNgay(tu, den, dvt, _danhSachNgayLe());

  const moi = updateDon(maDon, updates);
  appendLog(user.maNV, user.email, 'BO_SUNG_DON', 'DonTu', { maDon, soNgay: moi.soNgay });
  _guiMail(_emailNguoiDuyetKeTiep(moi),
    '[Chấm công CSCC] Đơn đã bổ sung: ' + moi.loaiDon,
    user.hoTen + ' đã bổ sung đơn ' + maDon + '. Vui lòng duyệt lại.');
  return { ok: true, data: { maDon, trangThai: 'Chờ duyệt', soNgay: moi.soNgay } };
}

// ── API: danh sách ───────────────────────────────────────────────────────────

// GET action=danhSachDonCuaToi
function apiDanhSachDonCuaToi(user, params) {
  const filters = {};
  if (params.loaiDon)   filters.loaiDon   = params.loaiDon;
  if (params.trangThai) filters.trangThai = params.trangThai;
  const ds = listDonCuaNV(user.maNV, filters)
    .sort((a, b) => String(b.ngayTao).localeCompare(String(a.ngayTao)));
  const tenMap = _tenMap();
  return { ok: true, data: ds.map(d => Object.assign({}, d, { buoc: _ganTenBuoc(getBuocDuyetCuaDon(d.maDon), tenMap) })) };
}

// GET action=getDonChiTiet&maDon=... — chi tiết 1 đơn để IN (người tạo hoặc người có quyền xem)
function apiGetDonChiTiet(user, params) {
  const don = getDonByMa(params.maDon);
  if (!don) throw new Error('Không tìm thấy đơn: ' + params.maDon);
  if (don.maNV !== user.maNV && !canViewNV(user, don.maNV)) {
    throw new Error('Không có quyền xem đơn này');
  }
  const nv = getNVByMa(don.maNV) || {};
  const tenMap = _tenMap();
  return { ok: true, data: Object.assign({}, don, {
    hoTenNV:   nv.hoTen,
    donViNV:   nv.donVi,
    chucDanhNV: nv.chucDanh,
    buoc:      _ganTenBuoc(getBuocDuyetCuaDon(don.maDon), tenMap),
    donVi1:    getConfig('don_vi_cap1') || 'CÔNG TY CỔ PHẦN CHIẾU SÁNG CÔNG CỘNG TP.HCM',
    donVi2:    getConfig('don_vi_cap2') || 'CHIẾU SÁNG KHU VỰC TRUNG TÂM'
  }) };
}

// POST action=uploadDinhKem  body {tenFile, mime, base64} — NC-I: upload minh chứng lên Drive
function apiUploadDinhKem(user, body) {
  requireQuyen(user, 'TAO_DON');
  if (!body || !body.base64) throw new Error('Thiếu dữ liệu file');
  const bytes = Utilities.base64Decode(body.base64);
  if (bytes.length > 8 * 1024 * 1024) throw new Error('File quá lớn (tối đa 8MB)');
  const blob = Utilities.newBlob(bytes, body.mime || 'application/octet-stream',
    body.tenFile || ('dinhkem_' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd_HHmmss')));
  let folder;
  const fid = getConfig('drive_folder_dinhkem');
  try { folder = fid ? DriveApp.getFolderById(fid) : DriveApp.getRootFolder(); }
  catch (_) { folder = DriveApp.getRootFolder(); }
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
  appendLog(user.maNV, user.email, 'UPLOAD_DINHKEM', 'DonTu', { ten: file.getName() });
  return { ok: true, data: { url: file.getUrl(), ten: file.getName() } };
}

// GET action=donChoDuyet — các đơn mà `user` là người duyệt cấp kế tiếp
function apiDonChoDuyet(user, params) {
  if (!['ToTruong', 'TruongDonVi', 'BGD', 'Admin'].includes(user.vaiTro)) {
    throw new Error('Vai trò không có quyền duyệt đơn');
  }
  const ketQua = [];
  const tenMap = _tenMap();
  listDonChoDuyet().forEach(don => {
    const nv = getNVByMa(don.maNV);
    if (!nv) return;
    const tt = _thongTinDuyet(don);
    if (tt.capHienTai > tt.capToiDa) return;
    if (!_canApprove(user, nv, tt.quyenCanCo)) return;
    if (params && params.loaiDon && don.loaiDon !== params.loaiDon) return;
    ketQua.push(Object.assign({}, don, {
      hoTenNV: nv.hoTen, donViNV: nv.donVi,
      capHienTai: tt.capHienTai, capToiDa: tt.capToiDa,
      buoc: _ganTenBuoc(tt.buoc, tenMap)
    }));
  });
  ketQua.sort((a, b) => String(a.ngayTao).localeCompare(String(b.ngayTao)));
  return { ok: true, data: ketQua };
}

// ── API: duyệt ───────────────────────────────────────────────────────────────

// POST action=duyetDon  body {maDon, ketQua, yKien}
function apiDuyetDon(user, body) {
  const { maDon, ketQua, yKien } = body;
  if (KET_QUA_DUYET.indexOf(ketQua) === -1) throw new Error('Kết quả duyệt không hợp lệ');
  if (ketQua !== 'Duyệt' && (!yKien || !String(yKien).trim())) {
    throw new Error('Phải nhập ý kiến khi từ chối hoặc yêu cầu bổ sung');
  }
  const don = getDonByMa(maDon);
  if (!don) throw new Error('Không tìm thấy đơn: ' + maDon);
  if (['Chờ duyệt', 'Bổ sung'].indexOf(don.trangThai) === -1) {
    throw new Error('Đơn không ở trạng thái chờ duyệt (hiện: ' + don.trangThai + ')');
  }

  const nv = getNVByMa(don.maNV);
  if (!nv) throw new Error('Không tìm thấy NV tạo đơn');
  const tt = _thongTinDuyet(don);
  if (tt.capHienTai > tt.capToiDa) throw new Error('Đơn đã được duyệt xong');
  requireQuyen(user, tt.quyenCanCo);
  if (!_canApprove(user, nv, tt.quyenCanCo)) {
    throw new Error('Bạn không phải người duyệt cấp ' + tt.capHienTai + ' của đơn này');
  }

  // NC-C: chặn duyệt CUỐI nếu đơn OT vượt trần tháng/năm
  if (ketQua === 'Duyệt' && tt.capHienTai >= tt.capToiDa && don.loaiDon === 'OT') {
    const namOT = Number(String(don.tuNgay).substring(0, 4));
    const thangOT = Number(String(don.tuNgay).substring(5, 7));
    const gioOT = Number(don.soGio) || 0;
    const kt = kiemTraTranOT(_tongOtThang(don.maNV, namOT, thangOT, don.maDon) + gioOT,
                             _tongOtNam(don.maNV, namOT, don.maDon) + gioOT,
                             { thang: getConfigNumber('ot_max_thang', 40), nam: getConfigNumber('ot_max_nam', 200) });
    if (kt.vuotThang || kt.vuotNam) {
      throw new Error('Không thể duyệt cuối — ' + kt.thongBao + ' Vui lòng điều chỉnh đơn OT.');
    }
  }

  themBuocDuyet({ maDon, capDuyet: tt.capHienTai, nguoiDuyet: user.maNV, ketQua, yKien: yKien || '' });
  const trangThaiMoi = tinhTrangThaiSauBuoc(tt.capHienTai, tt.capToiDa, ketQua);
  updateDon(maDon, { trangThai: trangThaiMoi });

  appendLog(user.maNV, user.email, 'DUYET_DON', 'DonTu', {
    maDon, cap: tt.capHienTai, ketQua, yKien: yKien || '', trangThaiMoi
  });

  // Trừ phép khi đơn phép năm được duyệt cuối (GĐ3 — guard nếu module chưa có)
  if (trangThaiMoi === 'Đã duyệt' && don.loaiDon === 'Phép năm' && typeof truPhep === 'function') {
    const nam = Number(String(don.tuNgay).substring(0, 4));
    try {
      truPhep(don.maNV, nam, Number(don.soNgay));
      appendLog(user.maNV, user.email, 'TRU_PHEP', 'SoDuPhep', { maDon, maNV: don.maNV, soNgay: don.soNgay });
    } catch (e) { /* không chặn duyệt nếu trừ phép lỗi */ }
  }

  // Thông báo
  const nvEmail = nv.email;
  if (trangThaiMoi === 'Đã duyệt') {
    _guiMail(nvEmail, '[Chấm công CSCC] Đơn đã được duyệt', 'Đơn ' + don.loaiDon + ' (' + maDon + ') của bạn đã được duyệt.');
  } else if (trangThaiMoi === 'Từ chối') {
    _guiMail(nvEmail, '[Chấm công CSCC] Đơn bị từ chối', 'Đơn ' + maDon + ' bị từ chối. Ý kiến: ' + (yKien || ''));
  } else if (trangThaiMoi === 'Bổ sung') {
    _guiMail(nvEmail, '[Chấm công CSCC] Đơn cần bổ sung', 'Đơn ' + maDon + ' cần bổ sung. Ý kiến: ' + (yKien || ''));
  } else {
    // Còn cấp kế tiếp
    _guiMail(_emailNguoiDuyetKeTiep(getDonByMa(maDon)),
      '[Chấm công CSCC] Đơn cần duyệt cấp tiếp theo',
      'Đơn ' + maDon + ' đã qua cấp ' + tt.capHienTai + ', chờ bạn duyệt.');
  }

  // NC-E: thông báo trong app cho người tạo đơn
  if (typeof themThongBao === 'function' && ['Đã duyệt', 'Từ chối', 'Bổ sung'].indexOf(trangThaiMoi) !== -1) {
    const msg = trangThaiMoi === 'Đã duyệt' ? 'Đơn ' + don.loaiDon + ' của bạn đã được DUYỆT'
              : trangThaiMoi === 'Từ chối'  ? 'Đơn ' + don.loaiDon + ' bị TỪ CHỐI' + (yKien ? ': ' + yKien : '')
              :                               'Đơn ' + don.loaiDon + ' cần BỔ SUNG' + (yKien ? ': ' + yKien : '');
    themThongBao(don.maNV, msg, 'don-tu.html');
  }

  return { ok: true, data: { maDon, trangThai: trangThaiMoi, cap: tt.capHienTai } };
}
