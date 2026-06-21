// ─── Bootstrap.gs ─────────────────────────────────────────────────────────────
// CHẠY 1 LẦN trong Apps Script Editor để khởi tạo dữ liệu + tài khoản Admin đầu tiên.
//
// Cách dùng:
//   1. Sửa 3 hằng số bên dưới (email + mật khẩu đăng nhập đầu tiên).
//   2. Chọn hàm `bootstrapAdmin` trên thanh công cụ → bấm Run.
//   3. Lần đầu sẽ hiện popup xin quyền → Authorize.
//   4. Xem Log (Ctrl+Enter) để xác nhận. Sau đó đăng nhập bằng email/mật khẩu đã đặt.
//
// An toàn khi chạy lại nhiều lần (không tạo trùng).

function bootstrapAdmin() {
  const EMAIL    = 'mvula@gmail.com';      // email đăng nhập (sẽ lưu ở dạng chữ thường)
  const MAT_KHAU = 'cscc@2026';            // ĐỔI mật khẩu này
  const MA_NV    = 'AD001';

  // 1) Tạo toàn bộ sheet GĐ1 + cấu hình mặc định + ca mẫu
  setupGD1();

  // 2) Bảo đảm cột matKhau tồn tại (setupGD1 tạo NhanVien chưa có cột này)
  addMatKhauColumn();

  // 3) Tạo NV Admin nếu chưa có
  const email = String(EMAIL).trim().toLowerCase();
  if (!getNVByEmail(email)) {
    createNV({
      maNV: MA_NV, hoTen: 'Quản trị hệ thống', donVi: 'Văn phòng',
      khoi: 'Gián tiếp', chucDanh: 'Quản trị', dieuKienCV: 'Bình thường',
      ngayVaoLam: '2020-01-01', quanLyTrucTiep: '', trangThai: 'Đang làm',
      email: email, vaiTro: 'Admin'
    });
    Logger.log('✓ Đã tạo NV Admin: ' + MA_NV + ' / ' + email);
  } else {
    Logger.log('• NV với email ' + email + ' đã tồn tại — bỏ qua tạo mới');
  }

  // 4) Đặt mật khẩu (hash SHA-256)
  const nv = getNVByEmail(email);
  setPassword(nv.maNV, MAT_KHAU);

  Logger.log('✓ HOÀN TẤT. Đăng nhập bằng: ' + email + ' / ' + MAT_KHAU);
}

// ─── Seed lịch nghỉ lễ/tết 2026 vào CauHinh ───────────────────────────────────
// Chạy 1 lần trong Editor (chọn seedNgayLe2026 → Run). Ghi đè key ngay_le_tet.
// 11 ngày nghỉ luật định 2026. Tết/Giỗ Tổ/Quốc khánh: xác nhận lại theo thông báo
// chính thức của Chính phủ (có thể hoán đổi ngày liền kề) — sửa chuỗi dưới nếu cần.
function seedNgayLe2026() {
  const ngayLe = [
    '2026-01-01',                                                   // Tết Dương lịch
    '2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20',// Tết Âm lịch (29 Chạp → mùng 4)
    '2026-04-26',                                                   // Giỗ Tổ Hùng Vương (10/3 ÂL — xác nhận)
    '2026-04-30',                                                   // Giải phóng miền Nam
    '2026-05-01',                                                   // Quốc tế Lao động
    '2026-09-02','2026-09-03'                                       // Quốc khánh (2 ngày)
  ].join(',');
  setConfig('ngay_le_tet', ngayLe, 'Ngày nghỉ lễ/tết 2026 (yyyy-MM-dd)');
  Logger.log('✓ Đã seed ngay_le_tet (11 ngày): ' + ngayLe);
}

// ─── Tạo 4 tài khoản MẪU để test luồng đơn từ + duyệt ─────────────────────────
// Chạy 1 lần (chọn taoNVMau → Run). Mật khẩu tất cả: 123456. Chuỗi quản lý:
//   NV01 → TT01 (Tổ trưởng) → TDV01 (Trưởng đơn vị) → GD01 (BGĐ).
// An toàn khi chạy lại (bỏ qua nếu maNV đã có).
function taoNVMau() {
  addMatKhauColumn();
  const DV = 'Đội Vận hành';
  const ds = [
    { maNV: 'GD01',  hoTen: 'Giám Đốc D',      donVi: 'Ban Giám đốc', vaiTro: 'BGD',         quanLyTrucTiep: '' },
    { maNV: 'TDV01', hoTen: 'Trưởng Đơn Vị C', donVi: DV,             vaiTro: 'TruongDonVi', quanLyTrucTiep: 'GD01' },
    { maNV: 'TT01',  hoTen: 'Tổ Trưởng B',     donVi: DV,             vaiTro: 'ToTruong',    quanLyTrucTiep: 'TDV01' },
    { maNV: 'NV01',  hoTen: 'Nhân Viên A',     donVi: DV,             vaiTro: 'NV',          quanLyTrucTiep: 'TT01' }
  ];
  ds.forEach(function (n) {
    if (!getNVByMa(n.maNV)) {
      createNV({
        maNV: n.maNV, hoTen: n.hoTen, donVi: n.donVi, khoi: 'Gián tiếp',
        chucDanh: n.hoTen, dieuKienCV: 'Bình thường', ngayVaoLam: '2022-01-01',
        quanLyTrucTiep: n.quanLyTrucTiep, trangThai: 'Đang làm',
        email: n.maNV.toLowerCase() + '@cscc.vn', vaiTro: n.vaiTro
      });
    }
    setPassword(n.maNV, '123456');
  });
  Logger.log('✓ Đã tạo 4 NV mẫu (mật khẩu 123456):');
  Logger.log('  NV01@cscc.vn (Nhân viên) → TT01@cscc.vn (Tổ trưởng) → TDV01@cscc.vn (Trưởng ĐV) → GD01@cscc.vn (BGĐ)');
}
