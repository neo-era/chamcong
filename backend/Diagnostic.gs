// ─── Diagnostic.gs ────────────────────────────────────────────────────────────
// Hàm kiểm tra dữ liệu sheet NhanVien. Chạy trong Editor: chọn kiemTraNhanVien → Run
// → xem Execution log (Ctrl+Enter). Chỉ ĐỌC, không sửa gì.

// Trả về JSON tóm tắt (dùng cho clasp run để đọc dữ liệu từ xa).
function dumpNhanVien() {
  const ds = sheetToObjects(getSheet('NhanVien'));
  const dem = (arr, f) => arr.reduce((m, n) => { const k = f(n) || '(trống)'; m[k] = (m[k] || 0) + 1; return m; }, {});
  return {
    tong: ds.length,
    theoVaiTro: dem(ds, n => n.vaiTro),
    theoDonVi:  dem(ds, n => n.donVi),
    theoDieuKienCV: dem(ds, n => n.dieuKienCV),
    thieuNgayVaoLam: ds.filter(n => !n.ngayVaoLam).length,
    thieuQuanLy:     ds.filter(n => !n.quanLyTrucTiep).length,
    coSalt:          ds.filter(n => n.salt).length,
    danhSach: ds.map(n => ({ maNV: n.maNV, hoTen: n.hoTen, donVi: n.donVi, vaiTro: n.vaiTro, chucDanh: n.chucDanh }))
  };
}

function kiemTraNhanVien() {
  const ds = sheetToObjects(getSheet('NhanVien'));
  const L = msg => Logger.log(msg);

  L('================ KIỂM TRA SHEET NhanVien ================');
  L('Tổng số NV: ' + ds.length);

  // Đếm theo vai trò
  const theoVaiTro = {};
  ds.forEach(n => { theoVaiTro[n.vaiTro || '(trống)'] = (theoVaiTro[n.vaiTro || '(trống)'] || 0) + 1; });
  L('\n— Theo vai trò —');
  Object.keys(theoVaiTro).forEach(k => L('  ' + k + ': ' + theoVaiTro[k]));

  // Đếm theo đơn vị
  const theoDonVi = {};
  ds.forEach(n => { theoDonVi[n.donVi || '(trống)'] = (theoDonVi[n.donVi || '(trống)'] || 0) + 1; });
  L('\n— Theo đơn vị —');
  Object.keys(theoDonVi).forEach(k => L('  ' + k + ': ' + theoDonVi[k]));

  // Đếm theo điều kiện CV (ảnh hưởng quota phép 12/14/16)
  const theoDK = {};
  ds.forEach(n => { theoDK[n.dieuKienCV || '(trống)'] = (theoDK[n.dieuKienCV || '(trống)'] || 0) + 1; });
  L('\n— Theo điều kiện công việc —');
  Object.keys(theoDK).forEach(k => L('  ' + k + ': ' + theoDK[k]));

  // Các trường còn thiếu
  const thieuNgayVao = ds.filter(n => !n.ngayVaoLam).length;
  const thieuQL      = ds.filter(n => !n.quanLyTrucTiep).length;
  const thieuEmail   = ds.filter(n => !n.email).length;
  const thieuMK      = ds.filter(n => !n.matKhau).length;
  const coSalt       = ds.filter(n => n.salt).length;
  L('\n— Trường còn THIẾU —');
  L('  Thiếu ngayVaoLam (cần để tính phép): ' + thieuNgayVao);
  L('  Thiếu quanLyTrucTiep (cần để duyệt đơn): ' + thieuQL);
  L('  Thiếu email: ' + thieuEmail);
  L('  Chưa có mật khẩu: ' + thieuMK);
  L('  Đã nâng cấp salted: ' + coSalt + '/' + ds.length);

  // Email trùng
  const emailCount = {};
  ds.forEach(n => { if (n.email) emailCount[n.email] = (emailCount[n.email] || 0) + 1; });
  const dupEmail = Object.keys(emailCount).filter(e => emailCount[e] > 1);
  L('\n— Email trùng: ' + (dupEmail.length ? dupEmail.join(', ') : 'không có'));

  // quanLyTrucTiep trỏ tới mã không tồn tại
  const maSet = {}; ds.forEach(n => maSet[n.maNV] = true);
  const qlSai = ds.filter(n => n.quanLyTrucTiep && !maSet[n.quanLyTrucTiep])
                  .map(n => n.maNV + '→' + n.quanLyTrucTiep);
  L('— quanLyTrucTiep trỏ sai (mã không có): ' + (qlSai.length ? qlSai.join(', ') : 'không có'));

  // Liệt kê để rà vai trò
  L('\n— DANH SÁCH (mã | tên | đơn vị | vai trò | chức danh) —');
  ds.forEach(n => L('  ' + n.maNV + ' | ' + n.hoTen + ' | ' + (n.donVi || '-') +
                    ' | ' + (n.vaiTro || '-') + ' | ' + (n.chucDanh || '-')));

  L('========================================================');
}

// Kiểm tra SESSION_SECRET và thử tạo/xác minh token
function kiemTraAuth() {
  const L = msg => Logger.log(msg);
  L('================ KIỂM TRA AUTH ================');

  const secret = PropertiesService.getScriptProperties().getProperty('SESSION_SECRET');
  if (!secret) {
    L('❌ SESSION_SECRET CHƯA ĐƯỢC ĐẶT!');
    L('   → Vào Project Settings → Script Properties → thêm SESSION_SECRET');
    return;
  }
  if (secret === 'CSCC_CHAMCONG_DEFAULT_2026') {
    L('⚠️  SESSION_SECRET đang dùng giá trị mặc định — nên đổi thành chuỗi bí mật riêng!');
  } else {
    L('✅ SESSION_SECRET đã đặt (' + secret.length + ' ký tự)');
  }

  // Thử tạo token giả và xác minh
  try {
    const tokenTest = _createToken('test@cscc.vn');
    const user = _verifyToken(tokenTest);
    L('✅ Tạo token OK — email giải mã được: ' + (user ? user.email || 'test@cscc.vn' : 'lỗi'));
  } catch (e) {
    if (e.message.includes('không tồn tại')) {
      L('✅ Token hợp lệ, chữ ký HMAC đúng (lỗi dự kiến: email test không có trong sheet)');
    } else {
      L('❌ Lỗi token: ' + e.message);
    }
  }

  L('================================================');
}
