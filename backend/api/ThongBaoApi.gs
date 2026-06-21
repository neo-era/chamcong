// ─── ThongBaoApi.gs ───────────────────────────────────────────────────────────
// Thông báo trong app (NC-E).

// GET action=getThongBao
function apiGetThongBao(user, params) {
  return { ok: true, data: {
    items: listThongBao(user.maNV, 30),
    soChuaDoc: demChuaDoc(user.maNV)
  } };
}

// POST action=danhDauThongBao  body {maTB?}  (rỗng = đánh dấu tất cả đã đọc)
function apiDanhDauThongBao(user, body) {
  danhDauDaDoc(user.maNV, (body && body.maTB) || null);
  return { ok: true, data: { soChuaDoc: demChuaDoc(user.maNV) } };
}
