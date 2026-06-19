// ─── NhanVienApi.gs ───────────────────────────────────────────────────────────

// GET action=getNhanVienList
function apiGetNhanVienList(user, params) {
  requireQuyen(user, 'QUAN_LY_NV');
  const filters = {};
  if (params.trangThai) filters.trangThai = params.trangThai;
  if (params.donVi)     filters.donVi     = params.donVi;
  if (params.khoi)      filters.khoi      = params.khoi;
  return { ok: true, data: listNV(filters) };
}

// GET action=getNhanVien&maNV=xxx
function apiGetNhanVien(user, params) {
  const maNV = params.maNV;
  if (!maNV) throw new Error('Thiếu maNV');
  if (!canViewNV(user, maNV)) throw new Error('Không có quyền xem NV này');
  const nv = getNVByMa(maNV);
  if (!nv) throw new Error('Không tìm thấy NV: ' + maNV);
  return { ok: true, data: nv };
}

// POST action=createNhanVien
function apiCreateNhanVien(user, body) {
  requireQuyen(user, 'QUAN_LY_NV');
  const { maNV, hoTen, donVi, khoi, chucDanh, dieuKienCV, ngayVaoLam,
          quanLyTrucTiep, trangThai, email, vaiTro } = body;
  if (!maNV || !hoTen || !email) throw new Error('maNV, hoTen và email là bắt buộc');
  createNV({ maNV, hoTen, donVi, khoi, chucDanh, dieuKienCV, ngayVaoLam,
             quanLyTrucTiep, trangThai, email, vaiTro });
  appendLog(user.maNV, user.email, 'TAO_NV', 'NhanVien', { maNV, hoTen, email });
  return { ok: true, message: 'Đã tạo nhân viên ' + maNV };
}

// POST action=updateNhanVien
function apiUpdateNhanVien(user, body) {
  requireQuyen(user, 'QUAN_LY_NV');
  const { maNV, ...updates } = body;
  if (!maNV) throw new Error('Thiếu maNV');
  // Trường hợp nghỉ việc → ghi log riêng
  if (updates.trangThai === 'Nghỉ việc') {
    appendLog(user.maNV, user.email, 'NGHI_VIEC', 'NhanVien', { maNV });
  }
  updateNV(maNV, updates);
  appendLog(user.maNV, user.email, 'SUA_NV', 'NhanVien', { maNV, updates });
  return { ok: true, message: 'Đã cập nhật NV ' + maNV };
}
