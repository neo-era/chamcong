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
          quanLyTrucTiep, trangThai, email, vaiTro, diaBan } = body;
  if (!maNV || !hoTen || !email) throw new Error('maNV, hoTen và email là bắt buộc');
  kiemTraTacDongTaiKhoan(user, '', vaiTro);
  createNV({ maNV, hoTen, donVi, khoi, chucDanh, dieuKienCV, ngayVaoLam,
             quanLyTrucTiep, trangThai, email, vaiTro, diaBan });
  appendLog(user.maNV, user.email, 'TAO_NV', 'NhanVien', { maNV, hoTen, email });
  return { ok: true, message: 'Đã tạo nhân viên ' + maNV };
}

// POST action=updateNhanVien
function apiUpdateNhanVien(user, body) {
  requireQuyen(user, 'QUAN_LY_NV');
  const { maNV, ...updates } = body;
  if (!maNV) throw new Error('Thiếu maNV');
  delete updates.action; delete updates.token;
  // v1.0.2: mật khẩu chỉ đổi qua doiMatKhau/resetMatKhau — không nhận qua sửa hồ sơ
  delete updates.matKhau; delete updates.salt; delete updates.phaiDoiMK;
  Object.keys(updates).forEach(k => {
    const v = updates[k];
    if (v !== null && typeof v === 'object') throw new Error('Giá trị trường ' + k + ' không hợp lệ');
  });
  const hienTai = getNVByMa(maNV);
  if (!hienTai) throw new Error('Không tìm thấy NV: ' + maNV);
  kiemTraTacDongTaiKhoan(user, hienTai.vaiTro, updates.vaiTro);
  // Trường hợp nghỉ việc → ghi log riêng
  if (updates.trangThai === 'Nghỉ việc') {
    appendLog(user.maNV, user.email, 'NGHI_VIEC', 'NhanVien', { maNV });
  }
  updateNV(maNV, updates);
  appendLog(user.maNV, user.email, 'SUA_NV', 'NhanVien', { maNV, updates });
  return { ok: true, message: 'Đã cập nhật NV ' + maNV };
}
