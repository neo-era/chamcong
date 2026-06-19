// ─── CaApi.gs ─────────────────────────────────────────────────────────────────

// GET action=getCaList
function apiGetCaList(user) {
  // Tất cả vai trò có thể xem danh sách ca (cần khi chấm công / phân ca)
  return { ok: true, data: listCa() };
}

// GET action=getCa&maCa=xxx
function apiGetCa(user, params) {
  if (!params.maCa) throw new Error('Thiếu maCa');
  const ca = getCaByMa(params.maCa);
  if (!ca) throw new Error('Không tìm thấy ca: ' + params.maCa);
  return { ok: true, data: ca };
}

// POST action=createCa
function apiCreateCa(user, body) {
  requireQuyen(user, 'QUAN_LY_CA');
  const { maCa, tenCa, gioBatDau, gioKetThuc, banDem } = body;
  if (!maCa || !gioBatDau || !gioKetThuc) throw new Error('maCa, gioBatDau, gioKetThuc là bắt buộc');
  // Validate định dạng HH:MM
  if (!/^\d{2}:\d{2}$/.test(gioBatDau) || !/^\d{2}:\d{2}$/.test(gioKetThuc)) {
    throw new Error('Giờ phải có định dạng HH:MM (ví dụ: 07:30)');
  }
  createCa({ maCa, tenCa, gioBatDau, gioKetThuc, banDem });
  appendLog(user.maNV, user.email, 'TAO_CA', 'Ca', { maCa, tenCa });
  return { ok: true, message: 'Đã tạo ca ' + maCa };
}

// POST action=updateCa
function apiUpdateCa(user, body) {
  requireQuyen(user, 'QUAN_LY_CA');
  const { maCa, ...updates } = body;
  if (!maCa) throw new Error('Thiếu maCa');
  if (updates.gioBatDau && !/^\d{2}:\d{2}$/.test(updates.gioBatDau)) {
    throw new Error('gioBatDau phải có định dạng HH:MM');
  }
  if (updates.gioKetThuc && !/^\d{2}:\d{2}$/.test(updates.gioKetThuc)) {
    throw new Error('gioKetThuc phải có định dạng HH:MM');
  }
  updateCa(maCa, updates);
  appendLog(user.maNV, user.email, 'SUA_CA', 'Ca', { maCa, updates });
  return { ok: true, message: 'Đã cập nhật ca ' + maCa };
}
