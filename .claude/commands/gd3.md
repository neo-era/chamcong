# /gd3 — Giai đoạn 3: Quản lý phép & Bảng công

Dự án **Chấm công CSCC**. GĐ1 + GĐ2 đã hoàn thành.

## Công thức quota phép (Điều 25, 26 NQLĐ)

```
dieuKienBase = { 'Bình thường': 12, 'Nặng nhọc': 14, 'Đặc biệt nặng nhọc': 16 }
thamNienBonus = Math.floor(soNamLamViec / 5)
quota = dieuKienBase + thamNienBonus

Chưa đủ 12 tháng:
  quota = dieuKienBase * soThangLamViec / 12   (làm tròn xuống 0.5)
```

## SoDuPhep

Bảng `SoDuPhep` (docs/02): `maNV, nam, quota, daDung, conLai`.

- `hàm tinhQuotaDauNam()`: chạy đầu năm (Apps Script Time-trigger) → cập nhật quota tất cả NV đang làm.
- Khi đơn phép được duyệt cuối: `daDung += soNgay`, `conLai = quota - daDung`.
- Khi đơn bị thu hồi/huỷ sau duyệt: hoàn lại `daDung`.

## Bảng công tháng

- Một hàng = 1 NV × 1 ngày trong tháng.
- Cột: `ngay`, `maNV`, `maCa`, `gioVao`, `gioRa`, `trangThai`, `soGioLam`, `isLocked`.
- `isLocked = true` → không sửa được (chỉ HR/Admin mở khoá + AuditLog).
- Kết xuất Excel: Google Sheets API spreadsheets.values hoặc CSV download qua `Utilities.newBlob`.

## Files cần tạo

```
backend/data/SoDuPhepData.gs
backend/rules/PhepRules.gs        ← tinhQuota, kiemTraDuPhep
backend/api/BangCongApi.gs        ← getBangCong, khoaBangCong, moKhoaBangCong, xuatCSV
web/bang-cong.html + web/js/bangcong.js
web/so-du-phep.html + web/js/soduphep.js
```

## Nhiệm vụ

$ARGUMENTS
