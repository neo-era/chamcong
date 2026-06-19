# /test-rules — Kiểm thử Business Rules

Viết và chạy test case cho các hàm trong `backend/rules/` mà **không cần** kết nối Google Sheets.

## Cách chạy

Tạo file `backend/TestRules.gs` với các hàm `testXxx()`.
Chạy từ Apps Script Editor: chọn hàm → nhấn ▶ → xem Logger.

## Test cases bắt buộc cho GĐ1

### ChamCongRules.tinhTrangThaiCong()

```javascript
function testChamCongRules() {
  const caHC = { gioBatDau: '07:30', gioKetThuc: '17:00' };
  const assert = (label, actual, expected) => {
    Logger.log((actual === expected ? '✓' : '✗') + ' ' + label + ': ' + actual + ' (expected: ' + expected + ')');
  };

  // Đủ công
  assert('Vào đúng giờ, ra đúng giờ', tinhTrangThaiCong('2026-06-19T07:29:00+07:00', '2026-06-19T17:01:00+07:00', caHC, 0), 'DU_CONG');
  // Điều 7.3: đi trễ 1 phút = mất công cả ngày
  assert('Trễ 1 phút → TRE', tinhTrangThaiCong('2026-06-19T07:31:00+07:00', '2026-06-19T17:01:00+07:00', caHC, 0), 'TRE');
  // Điều 7.3: về sớm 1 phút = mất công cả ngày
  assert('Về sớm 1 phút → SOM', tinhTrangThaiCong('2026-06-19T07:29:00+07:00', '2026-06-19T16:59:00+07:00', caHC, 0), 'SOM');
  // Không chấm vào
  assert('Không chấm vào → MAT_CONG', tinhTrangThaiCong(null, null, caHC, 0), 'MAT_CONG');
  // Grace period 5 phút
  assert('Trễ 3 phút, grace=5 → DU_CONG', tinhTrangThaiCong('2026-06-19T07:33:00+07:00', '2026-06-19T17:01:00+07:00', caHC, 5), 'DU_CONG');
  // Biên: đúng giờ
  assert('Vào đúng 07:30 → DU_CONG', tinhTrangThaiCong('2026-06-19T07:30:00+07:00', '2026-06-19T17:00:00+07:00', caHC, 0), 'DU_CONG');
}
```

### CaRules.kiemTraNghiChuyenCa()

```javascript
function testCaRules() {
  const assert = (label, cond, note) =>
    Logger.log((cond ? '✓' : '✗') + ' ' + label + (note ? ' — ' + note : ''));

  let r = kiemTraNghiChuyenCa('2026-06-19T17:00:00+07:00', '2026-06-20T07:00:00+07:00');
  assert('14h nghỉ → OK', r.ok === true, r.gioNghi + 'h');

  r = kiemTraNghiChuyenCa('2026-06-19T22:00:00+07:00', '2026-06-20T06:00:00+07:00');
  assert('8h nghỉ → FAIL (thiếu 4h)', r.ok === false && r.thieu === 4, r.gioNghi + 'h');

  r = kiemTraNghiChuyenCa('2026-06-19T17:00:00+07:00', '2026-06-20T05:00:00+07:00');
  assert('Đúng 12h → OK (biên)', r.ok === true, r.gioNghi + 'h');
}
```

### QuyenRules.hasQuyen()

```javascript
function testQuyenRules() {
  const assert = (label, actual, expected) =>
    Logger.log((actual === expected ? '✓' : '✗') + ' ' + label);

  assert('NV có CHAM_CONG', hasQuyen({vaiTro:'NV'}, 'CHAM_CONG'), true);
  assert('NV không có QUAN_LY_NV', hasQuyen({vaiTro:'NV'}, 'QUAN_LY_NV'), false);
  assert('HR có SUA_CHAM_CONG', hasQuyen({vaiTro:'HR'}, 'SUA_CHAM_CONG'), true);
  assert('Admin có QUAN_TRI', hasQuyen({vaiTro:'Admin'}, 'QUAN_TRI'), true);
  assert('ToTruong có DUYET_CAP1', hasQuyen({vaiTro:'ToTruong'}, 'DUYET_CAP1'), true);
  assert('NV không có DUYET_CAP1', hasQuyen({vaiTro:'NV'}, 'DUYET_CAP1'), false);
}
```

## Nhiệm vụ

$ARGUMENTS

Nếu không có argument, chạy tất cả test cases trên và báo cáo kết quả.
