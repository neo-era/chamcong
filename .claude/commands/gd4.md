# /gd4 — Giai đoạn 4: Cảnh báo kỷ luật & Quản trị

Dự án **Chấm công CSCC**. GĐ1–3 đã hoàn thành.

## Ngưỡng kỷ luật (Điều 33, 34, 35 NQLĐ)

Tất cả đọc từ CauHinh — KHÔNG hardcode:

| Key CauHinh | Giá trị mặc định | Ý nghĩa |
|-------------|-----------------|---------|
| `nguong_ky_luat_30_khien` | 3 | Ngày bỏ việc / 30 ngày → khiển trách |
| `nguong_ky_luat_30_keo` | 4 | → kéo dài nâng lương |
| `nguong_ky_luat_30_sa` | 5 | → sa thải |
| `nguong_ky_luat_365_sa` | 20 | Ngày bỏ việc / 365 ngày → sa thải |

**Hệ thống CHỈ CẢNH BÁO** — không tự ra quyết định kỷ luật.

## "Bỏ việc" = trạng thái ChamCong là TRE / SOM / MAT_CONG / VANG_KHONG_PHEP

Hàm `laBoViec(trangThai)` đã có trong `backend/rules/ChamCongRules.gs`.

## Thuật toán cửa sổ trượt

```javascript
// Đếm ngày bỏ việc trong 30 ngày gần nhất
function demBoViec30(maNV) {
  const den = todayStr();
  const tu  = subtractDays(den, 30);
  return getChamCongKhoang(maNV, tu, den).filter(cc => laBoViec(cc.trangThai)).length;
}
// Tương tự cho 365 ngày
```

## Trigger hàng ngày

`ScriptApp.newTrigger('quetCanhBaoTatCa').timeBased().everyDays(1).atHour(6).create()`

Hàm `quetCanhBaoTatCa()` duyệt tất cả NV đang làm, tính số ngày bỏ việc, so ngưỡng, ghi CanhBaoKyLuat nếu chạm ngưỡng (tránh ghi trùng cùng ngày).

## Files cần tạo

```
backend/rules/KyLuatRules.gs
backend/api/KyLuatApi.gs
backend/api/QuanTriApi.gs   ← CRUD CauHinh, xem AuditLog (Admin only)
web/ky-luat.html + web/js/kyluat.js
web/quan-tri.html + web/js/quantri.js
```

## Nhiệm vụ

$ARGUMENTS
