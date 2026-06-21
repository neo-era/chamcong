// ─── NhanSuImport.gs ─────────────────────────────────────────────────────────
// Nhập danh sách nhân sự vào sheet NhanVien.
//
// v1.0.2: KHÔNG nhúng dữ liệu nhân sự trong mã (repo công khai). Dữ liệu lấy từ sheet
// "NhanSuImport" nằm TRONG Spreadsheet của hệ thống (không công khai).
//
// Cách dùng:
//   1. Tạo sheet "NhanSuImport", dòng 1 là tiêu đề:
//        maNV | hoTen | donVi | khoi | chucDanh | vaiTro | email
//      (có thể thêm: dieuKienCV | ngayVaoLam | quanLyTrucTiep | diaBan)
//   2. Dán danh sách nhân sự từ dòng 2.
//   3. Trong Editor chọn importNhanSu → Run.
//   4. Người MỚI được tạo tài khoản + mật khẩu tạm ngẫu nhiên, ghi ở cột "matKhauTam"
//      của sheet NhanSuImport để HR phát cho từng người; đăng nhập lần đầu phải đổi.
//      Người ĐÃ CÓ (trùng maNV) được bỏ qua — KHÔNG đổi mật khẩu của họ.
//   5. Phát mật khẩu xong thì XOÁ cột matKhauTam (hoặc xoá cả sheet NhanSuImport).

const NS_IMPORT_SHEET = 'NhanSuImport';

function importNhanSu() {
  addMatKhauColumn();
  const sh = getSheet(NS_IMPORT_SHEET);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) throw new Error('Sheet ' + NS_IMPORT_SHEET + ' chưa có dữ liệu');
  const headers = data[0].map(h => String(h).trim());
  ['maNV', 'hoTen', 'email'].forEach(h => {
    if (headers.indexOf(h) === -1) throw new Error('Sheet ' + NS_IMPORT_SHEET + ' thiếu cột ' + h);
  });
  let colMK = headers.indexOf('matKhauTam');
  if (colMK === -1) {
    colMK = headers.length;
    sh.getRange(1, colMK + 1).setValue('matKhauTam');
  }

  let ok = 0, skip = 0, err = 0;
  for (let i = 1; i < data.length; i++) {
    const n = {};
    headers.forEach((h, j) => { n[h] = data[i][j] instanceof Date ? toDateStr(data[i][j]) : String(data[i][j] || '').trim(); });
    if (!n.maNV) continue;
    try {
      if (getNVByMa(n.maNV)) { skip++; continue; }
      createNV({
        maNV: n.maNV, hoTen: n.hoTen, donVi: n.donVi || '', khoi: n.khoi || '',
        chucDanh: n.chucDanh || '', dieuKienCV: n.dieuKienCV || 'Bình thường',
        ngayVaoLam: n.ngayVaoLam || '', quanLyTrucTiep: n.quanLyTrucTiep || '',
        trangThai: 'Đang làm', email: n.email.toLowerCase(), vaiTro: n.vaiTro || 'NV',
        diaBan: n.diaBan || ''
      });
      const mk = taoMatKhauTam();
      datMatKhau(n.maNV, mk, true);
      sh.getRange(i + 1, colMK + 1).setValue(mk);
      ok++;
    } catch (e) { err++; Logger.log('LỖI ' + n.maNV + ': ' + e.message); }
  }
  Logger.log('✓ Import nhân sự: tạo mới ' + ok + ', bỏ qua (đã có) ' + skip + ', lỗi ' + err +
             '. Mật khẩu tạm ở cột matKhauTam của sheet ' + NS_IMPORT_SHEET + ' — phát xong hãy xoá.');
}
