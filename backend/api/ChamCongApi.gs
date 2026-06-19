// ─── ChamCongApi.gs ───────────────────────────────────────────────────────────

// GET action=getChamCongHomNay
function apiGetChamCongHomNay(user) {
  const ngay = todayStr();
  const cc   = getChamCongNgay(user.maNV, ngay);
  const lt   = getLichTrucNgay(user.maNV, ngay);
  const ca   = lt ? getCaByMa(lt.maCa) : getCaMacDinh();
  return { ok: true, data: { chamCong: cc, ca, ngay } };
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

// POST action=chamVao
function apiChamVao(user, body) {
  requireQuyen(user, 'CHAM_CONG');
  const ngay  = todayStr(); // Giờ MÁY CHỦ — không tin client
  const gioVao = new Date();

  const existing = getChamCongNgay(user.maNV, ngay);
  if (existing && existing.gioVao) {
    throw new Error('Đã chấm công vào hôm nay lúc ' + _formatGio(existing.gioVao));
  }

  const lt  = getLichTrucNgay(user.maNV, ngay);
  const ca  = lt ? getCaByMa(lt.maCa) : getCaMacDinh();
  if (!ca)  throw new Error('Không có ca làm việc cho hôm nay');

  const grace     = getConfigNumber('grace_minutes', 0);
  const trangThai = tinhTrangThaiCong(gioVao.toISOString(), null, ca, grace);
  const nguon     = body.toaDo ? 'GPS hiện trường' : 'Trụ sở';
  const maCC      = genMaCC(user.maNV, ngay);

  if (existing) {
    updateChamCong(maCC, { gioVao: gioVao.toISOString(), nguon, toaDo: body.toaDo || '', trangThai });
  } else {
    saveChamCong({
      maCC,
      maNV:     user.maNV,
      ngay,
      maCa:     ca.maCa,
      gioVao:   gioVao.toISOString(),
      gioRa:    '',
      nguon,
      toaDo:    body.toaDo || '',
      trangThai
    });
  }

  appendLog(user.maNV, user.email, 'CHAM_VAO', 'ChamCong', { maCC, ngay, trangThai, nguon });

  return {
    ok: true,
    data: {
      maCC,
      gioVao:      gioVao.toISOString(),
      trangThai,
      trangThaiLabel: labelTrangThai(trangThai),
      laCanhBao:   trangThai === 'TRE'
    }
  };
}

// POST action=chamRa
function apiChamRa(user, body) {
  requireQuyen(user, 'CHAM_CONG');
  const ngay  = todayStr();
  const gioRa = new Date(); // Giờ MÁY CHỦ

  const existing = getChamCongNgay(user.maNV, ngay);
  if (!existing || !existing.gioVao) throw new Error('Chưa chấm công vào hôm nay');
  if (existing.gioRa) {
    throw new Error('Đã chấm công ra hôm nay lúc ' + _formatGio(existing.gioRa));
  }

  const ca    = getCaByMa(existing.maCa) || getCaMacDinh();
  const grace = getConfigNumber('grace_minutes', 0);
  const trangThai = tinhTrangThaiCong(existing.gioVao, gioRa.toISOString(), ca, grace);

  updateChamCong(existing.maCC, {
    gioRa:    gioRa.toISOString(),
    trangThai,
    toaDo:    body.toaDo ? (existing.toaDo || '') + '|Ra:' + body.toaDo : existing.toaDo
  });

  appendLog(user.maNV, user.email, 'CHAM_RA', 'ChamCong', {
    maCC: existing.maCC, ngay, trangThai
  });

  return {
    ok: true,
    data: {
      maCC:          existing.maCC,
      gioRa:         gioRa.toISOString(),
      trangThai,
      trangThaiLabel: labelTrangThai(trangThai),
      laCanhBao:     trangThai === 'SOM'
    }
  };
}

// POST action=suaChamCong — HR/Admin only; BẮT BUỘC có lyDo; ghi AuditLog
function apiSuaChamCong(user, body) {
  requireQuyen(user, 'SUA_CHAM_CONG');
  const { maCC, gioVao, gioRa, lyDo } = body;
  if (!maCC) throw new Error('Thiếu maCC');
  if (!lyDo) throw new Error('Phải nhập lý do khi sửa chấm công (yêu cầu bởi quy trình)');

  const existing = getChamCongByMaCC(maCC);
  if (!existing) throw new Error('Không tìm thấy bản ghi: ' + maCC);

  const ca        = getCaByMa(existing.maCa) || getCaMacDinh();
  const grace     = getConfigNumber('grace_minutes', 0);
  const newGioVao = gioVao || existing.gioVao;
  const newGioRa  = gioRa  || existing.gioRa  || null;
  const trangThai = tinhTrangThaiCong(newGioVao, newGioRa, ca, grace);

  updateChamCong(maCC, { gioVao: newGioVao, gioRa: newGioRa || '', trangThai });

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

function _formatGio(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'HH:mm');
  } catch (_) { return String(isoOrDate); }
}
