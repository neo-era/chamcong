# /gd1 — Triển khai Giai đoạn 1

Bạn đang làm việc trên dự án **Chấm công CSCC** (Chiếu sáng khu vực Trung tâm).

## Phạm vi GĐ1

**Backend đã có** (thư mục `backend/`):
- `data/`: SheetHelper, CauHinhData, AuditLogData, NhanVienData, CaData, LichTrucData, ChamCongData
- `rules/`: QuyenRules, ChamCongRules (Điều 7.3), CaRules (Điều 22, 23)
- `api/`: AuthApi, NhanVienApi, CaApi, LichTrucApi, ChamCongApi
- `Code.gs`: doGet/doPost dispatcher

**Frontend đã có** (thư mục `web/`):
- `index.html`: đăng nhập GIS
- `chamcong.html` + `js/chamcong.js`: chấm vào/ra + GPS + lịch sử 7 ngày
- `nhanvien.html` + `js/nhanvien.js`: CRUD nhân viên (HR/Admin)
- `phanca.html` + `js/phanca.js`: grid tuần, phân ca, cảnh báo ca
- `css/main.css`, `js/auth.js`, `js/api.js`

## Nhiệm vụ hiện tại

$ARGUMENTS

## Ràng buộc bắt buộc

1. **Mọi hằng số pháp lý** (giờ ca, lương tối thiểu, ngưỡng kỷ luật) đọc từ `CauHinhData.getConfig()` — KHÔNG hardcode.
2. **Quy tắc Điều 7.3**: trễ/về sớm = `TRE`/`SOM` = mất công cả ngày, không chỉ trừ giờ.
3. **Timestamp chấm công**: chỉ dùng `new Date()` phía backend, không tin giá trị từ client.
4. **Mọi sửa chấm công** phải gọi `appendLog()` với `lyDo` rõ ràng.
5. **POST cross-origin**: `Content-Type: text/plain;charset=utf-8` + body là JSON string có `idToken`.

## Kiến trúc tầng (không vi phạm)

```
Code.gs → api/ → rules/ + data/
```

`api/` không gọi thẳng Sheet. `rules/` không import/gọi gì từ `data/`.

## Nghiệm thu GĐ1

Chạy `/nghiem-thu gd1` để xem checklist đầy đủ.
