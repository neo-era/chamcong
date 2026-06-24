// ─── GeoApi.gs ────────────────────────────────────────────────────────────────
// Xác minh vị trí (hiển thị địa chỉ + kiểm tra địa bàn) cho frontend gọi khi bật GPS.

// GET action=kiemTraViTri&toaDo=lat,lng
function apiKiemTraViTri(user, params) {
  requireQuyen(user, 'CHAM_CONG');
  if (!params.toaDo) throw new Error('Thiếu toạ độ');
  return { ok: true, data: xacMinhViTri(params.toaDo) };
}
