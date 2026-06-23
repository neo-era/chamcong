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

// GET action=getHeaderInfo — gộp chuông thông báo + badge đơn chờ duyệt thành 1 request.
// Giảm 2 round-trip Apps Script xuống 1 trên MỖI lần tải trang.
function apiGetHeaderInfo(user) {
  const all = listThongBao(user.maNV, 30);   // đọc sheet ThongBao 1 lần (trước đây list + đếm = 2 lần)
  const data = {
    thongBao: { items: all, soChuaDoc: all.filter(o => !o.daDoc).length },
    soDonChoDuyet: 0
  };
  if (['ToTruong', 'TruongDonVi', 'BGD', 'Admin'].includes(user.vaiTro)) {
    data.soDonChoDuyet = apiDonChoDuyet(user, {}).data.length;
  }
  return { ok: true, data: data };
}
