// ─── SheetHelper.gs ───────────────────────────────────────────────────────────
// Hàm tiện ích truy cập Google Sheets. Các file data/ khác gọi qua đây.
// KHÔNG chứa logic nghiệp vụ.

const SPREADSHEET_ID = '1BM8BBQB6Eo3UTztpyvp5SOadSRvgM2PIYp0mVGKwqjA';

// Memo handle trong 1 lần thực thi — tránh openById lặp lại khi 1 request đọc nhiều sheet.
// An toàn khi instance được tái dùng giữa các request: getValues() luôn lấy dữ liệu sống.
let _ssMemo = null;
function getSpreadsheet() {
  if (!_ssMemo) _ssMemo = SpreadsheetApp.openById(SPREADSHEET_ID);
  return _ssMemo;
}

function getSheet(name) {
  const ss = getSpreadsheet();
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet không tồn tại: ' + name);
  return sh;
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

// Đọc toàn bộ sheet, trả về mảng object { header: value }
function sheetToObjects(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] instanceof Date ? _fmtDateCell(row[i]) : row[i];
    });
    return obj;
  });
}

// Tìm hàng theo giá trị của cột colName. Trả về { row, obj, headers } hoặc null.
function findRow(sh, colName, val) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return null;
  const headers = data[0];
  const colIdx = headers.indexOf(colName);
  if (colIdx === -1) return null;
  for (let i = 1; i < data.length; i++) {
    const cellVal = data[i][colIdx] instanceof Date ? _fmtDateCell(data[i][colIdx]) : data[i][colIdx];
    if (String(cellVal) === String(val)) {
      const obj = {};
      headers.forEach((h, j) => {
        obj[h] = data[i][j] instanceof Date ? _fmtDateCell(data[i][j]) : data[i][j];
      });
      return { row: i + 1, obj, headers };
    }
  }
  return null;
}

// Chuyển Date cell từ Google Sheets sang chuỗi đúng múi giờ VN.
// - Time-only cell (gioBatDau/gioKetThuc): Sheets lưu với base date 1899-12-30 → "HH:mm"
// - Date cell (ngay, ngayVaoLam…): lấy theo giờ VN để tránh lệch ngày UTC vs +7
function _fmtDateCell(d) {
  if (d.getFullYear() <= 1900) {
    return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'HH:mm');
  }
  return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
}

// Thêm dòng mới theo thứ tự headers
function appendRow(sh, obj, headers) {
  const row = headers.map(h => (obj[h] !== undefined && obj[h] !== null) ? obj[h] : '');
  sh.appendRow(row);
}

// Cập nhật dòng rowNum theo thứ tự headers
function updateRow(sh, rowNum, obj, headers) {
  const row = headers.map(h => (obj[h] !== undefined && obj[h] !== null) ? obj[h] : '');
  sh.getRange(rowNum, 1, 1, row.length).setValues([row]);
}

// Format ngày thành chuỗi 'yyyy-MM-dd' (múi giờ VN)
function toDateStr(d) {
  if (!d) return '';
  if (d instanceof Date) return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  return String(d).substring(0, 10);
}

// Ngày hôm nay dạng 'yyyy-MM-dd' (giờ máy chủ VN)
function todayStr() {
  return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
}

// Khởi tạo tất cả sheet GĐ1 (chạy 1 lần từ Apps Script Editor)
function setupGD1() {
  getOrCreateSheet('NhanVien',  ['maNV','hoTen','donVi','khoi','chucDanh','dieuKienCV','ngayVaoLam','quanLyTrucTiep','trangThai','email','vaiTro']);
  getOrCreateSheet('Ca',        ['maCa','tenCa','gioBatDau','gioKetThuc','banDem']);
  getOrCreateSheet('LichTruc',  ['maLT','maNV','ngay','maCa']);
  getOrCreateSheet('ChamCong',  ['maCC','maNV','ngay','maCa','gioVao','gioRa','nguon','toaDo','trangThai','isLocked','soGioCong']);
  getOrCreateSheet('CauHinh',   ['key','value','moTa']);
  getOrCreateSheet('AuditLog',  ['maLog','thoiDiem','maNV','email','action','doiTuong','chiTiet']);

  _initCauHinhDefaults();
  _initMauCa();
  Logger.log('setupGD1 hoàn thành. Kiểm tra Spreadsheet để xác nhận.');
}

function _initCauHinhDefaults() {
  const sh = getSheet('CauHinh');
  const existing = sheetToObjects(sh).map(o => o.key);
  const defaults = [
    ['ma_ca_mac_dinh',           'CA_HC',            'Mã ca mặc định cho khối gián tiếp'],
    ['grace_minutes',            '0',                'Số phút ân hạn trễ/sớm (0 = không có)'],
    ['luong_toi_thieu_vung',     '5310000',          'Lương tối thiểu Vùng I 2026 (NĐ 293/2025)'],
    ['ty_le_bhxh_nld',           '10.5',             '% NLĐ đóng BHXH/BHYT/BHTN'],
    ['ty_le_bhxh_dn',            '21.5',             '% Doanh nghiệp đóng BHXH/BHYT/BHTN'],
    ['dinh_muc_con_om_duoi3',    '20',               'Ngày chăm con ốm <3 tuổi/năm/con'],
    ['dinh_muc_con_om_3den7',    '15',               'Ngày chăm con ốm 3–<7 tuổi/năm/con'],
    ['nguong_ky_luat_30_khien',  '3',                'Ngày bỏ việc/30 ngày → khiển trách'],
    ['nguong_ky_luat_30_keo',    '4',                'Ngày bỏ việc/30 ngày → kéo dài nâng lương'],
    ['nguong_ky_luat_30_sa',     '5',                'Ngày bỏ việc/30 ngày → sa thải'],
    ['nguong_ky_luat_365_sa',    '20',               'Ngày bỏ việc/365 ngày → sa thải'],
    ['nguong_duyet_cap_cao',     '2',                'Phép > N ngày cần duyệt cấp 3'],
    ['phep_co_ban_binh_thuong',  '12',               'Phép năm cơ bản — điều kiện bình thường'],
    ['phep_co_ban_nang_nhoc',    '14',               'Phép năm cơ bản — nặng nhọc/độc hại'],
    ['phep_co_ban_dac_biet',     '16',               'Phép năm cơ bản — đặc biệt nặng nhọc'],
    ['ngay_cat_ky_cong',         '21',               'Ngày cắt kỳ công (kỳ = 21 tháng trước → 20 tháng này)'],
    ['dang_nhap_toi_da',         '5',                'Số lần đăng nhập sai tối đa trước khi khoá tạm'],
    ['dang_nhap_khoa_phut',      '15',               'Số phút khoá đăng nhập sau khi sai quá ngưỡng'],
    ['ot_max_thang',             '40',               'Trần OT theo tháng (giờ)'],
    ['ot_max_nam',               '200',              'Trần OT theo năm (giờ)'],
    ['gio_toi_da_ngay',          '12',               'Trần tổng giờ làm/ngày — cảnh báo khi vượt'],
    ['nghi_tuan_toi_thieu_gio',  '24',               'Nghỉ tuần tối thiểu (giờ liên tục) — cảnh báo khi thiếu'],
    ['dinh_muc_viec_rieng',      '{"Kết hôn bản thân":3,"Con kết hôn":1,"Tang cha/mẹ/vợ/chồng/con":3,"Ông bà/anh chị em ruột mất":1}', 'Định mức nghỉ việc riêng (JSON: lý do→số ngày)'],
    ['ngay_le_tet',              '2026-01-01,2026-02-16,2026-02-17,2026-02-18,2026-02-19,2026-02-20,2026-04-26,2026-04-30,2026-05-01,2026-09-02,2026-09-03', 'Ngày nghỉ lễ/tết 2026 (yyyy-MM-dd, cách nhau dấu phẩy) — xác nhận theo thông báo chính thức'],
    ['timezone',                  'Asia/Ho_Chi_Minh', 'Múi giờ hệ thống'],
  ];
  defaults.forEach(([key, value, moTa]) => {
    if (!existing.includes(key)) appendRow(sh, { key, value, moTa }, ['key','value','moTa']);
  });
}

function _initMauCa() {
  const sh = getSheet('Ca');
  const existing = sheetToObjects(sh).map(o => o.maCa);
  const mauCa = [
    { maCa: 'CA_HC',   tenCa: 'Hành chính',  gioBatDau: '07:30', gioKetThuc: '17:00', banDem: false },
    { maCa: 'CA_DEM',  tenCa: 'Trực đêm',    gioBatDau: '17:00', gioKetThuc: '07:00', banDem: true  },
    { maCa: 'CA_SANG', tenCa: 'Ca sáng',     gioBatDau: '06:00', gioKetThuc: '14:00', banDem: false },
    { maCa: 'CA_CHIEU',tenCa: 'Ca chiều',    gioBatDau: '14:00', gioKetThuc: '22:00', banDem: false },
  ];
  const headers = ['maCa','tenCa','gioBatDau','gioKetThuc','banDem'];
  mauCa.forEach(ca => {
    if (!existing.includes(ca.maCa)) appendRow(sh, ca, headers);
  });
}
