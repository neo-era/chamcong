// ─── Bootstrap.gs ─────────────────────────────────────────────────────────────
// CHẠY 1 LẦN trong Apps Script Editor để khởi tạo dữ liệu + tài khoản Admin đầu tiên.
//
// v1.0.2: KHÔNG ghi email/mật khẩu trong mã (repo công khai). Cách dùng:
//   1. Project Settings → Script Properties, thêm tạm:
//        BOOTSTRAP_EMAIL    = email đăng nhập của Admin
//        BOOTSTRAP_MATKHAU  = mật khẩu tạm (≥ 8 ký tự)
//   2. Chạy taoSessionSecret (nếu chưa có SESSION_SECRET).
//   3. Chọn hàm `bootstrapAdmin` → Run. Hàm tự XOÁ BOOTSTRAP_MATKHAU sau khi dùng.
//   4. Đăng nhập → hệ thống ép đổi mật khẩu ngay lần đầu.
//
// An toàn khi chạy lại nhiều lần (không tạo trùng).

function bootstrapAdmin() {
  const props = PropertiesService.getScriptProperties();
  const EMAIL    = props.getProperty('BOOTSTRAP_EMAIL');
  const MAT_KHAU = props.getProperty('BOOTSTRAP_MATKHAU');
  const MA_NV    = props.getProperty('BOOTSTRAP_MANV') || 'AD001';
  if (!EMAIL || !MAT_KHAU) {
    throw new Error('Thiếu Script Properties BOOTSTRAP_EMAIL / BOOTSTRAP_MATKHAU — xem hướng dẫn đầu file Bootstrap.gs');
  }
  _kiemTraMatKhauMoi(MAT_KHAU);

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

  // 4) Đặt mật khẩu tạm (bắt buộc đổi khi đăng nhập lần đầu), rồi xoá khỏi Script Properties
  const nv = getNVByEmail(email);
  datMatKhau(nv.maNV, MAT_KHAU, true);
  props.deleteProperty('BOOTSTRAP_MATKHAU');

  Logger.log('✓ HOÀN TẤT. Đăng nhập bằng ' + email + ' với mật khẩu tạm đã đặt (đã xoá khỏi Script Properties).');
}

// ─── Seed lịch nghỉ lễ/tết 2026 vào CauHinh ───────────────────────────────────
// Chạy 1 lần trong Editor (chọn seedNgayLe2026 → Run). Ghi đè key ngay_le_tet.
// 12 ngày nghỉ 2026: Điều 112 BLLĐ + Ngày Văn hoá Việt Nam 24/11 (NQ 28/2026/QH16,
// hiệu lực 01/7/2026). Giỗ Tổ 10/3 ÂL rơi Chủ nhật 26/4 → nghỉ bù Thứ Hai 27/4.
// Ngày hoán đổi (nếu Công ty áp dụng) — sửa chuỗi dưới theo thông báo của Công ty.
function seedNgayLe2026() {
  const ngayLe = [
    '2026-01-01',                                                   // Tết Dương lịch
    '2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20',// Tết Âm lịch (29 Chạp → mùng 4)
    '2026-04-27',                                                   // Giỗ Tổ Hùng Vương (26/4 là CN → nghỉ bù 27/4)
    '2026-04-30',                                                   // Giải phóng miền Nam
    '2026-05-01',                                                   // Quốc tế Lao động
    '2026-09-02','2026-09-03',                                      // Quốc khánh (2 ngày)
    '2026-11-24'                                                    // Ngày Văn hoá Việt Nam
  ].join(',');
  setConfig('ngay_le_tet', ngayLe, 'Ngày nghỉ lễ/tết 2026 (yyyy-MM-dd)');
  Logger.log('✓ Đã seed ngay_le_tet (12 ngày): ' + ngayLe);
}

// ─── Tạo 4 tài khoản MẪU để test luồng đơn từ + duyệt ─────────────────────────
// CHỈ dùng trên bản thử nghiệm, KHÔNG chạy trên dữ liệu thật. v1.0.2: mỗi tài khoản
// nhận mật khẩu tạm ngẫu nhiên (in ra Log), bắt buộc đổi khi đăng nhập. Chuỗi quản lý:
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
      const mk = taoMatKhauTam();
      datMatKhau(n.maNV, mk, true);
      Logger.log('  ' + n.maNV + ' — mật khẩu tạm: ' + mk);
    }
  });
  Logger.log('✓ Đã tạo NV mẫu (mật khẩu tạm ở trên, bắt buộc đổi khi đăng nhập):');
  Logger.log('  NV01@cscc.vn (Nhân viên) → TT01@cscc.vn (Tổ trưởng) → TDV01@cscc.vn (Trưởng ĐV) → GD01@cscc.vn (BGĐ)');
}
