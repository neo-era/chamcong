# /gd2 — Triển khai Giai đoạn 2: Đơn từ & Duyệt đơn

Dự án **Chấm công CSCC**. GĐ1 đã hoàn thành. Bắt đầu GĐ2.

## Cần đọc trước

- `docs/02-data-model.md` — bảng DonTu, BuocDuyet
- `docs/03-approval-workflow.md` — luồng duyệt + ma trận phân quyền

## Loại đơn (DonTu.loaiDon)

`Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài / Ốm đau / Chăm con ốm / Thai sản nữ / Thai sản nam / TNLĐ-BNN / Khám thai`

Trường `donViTinh`: `Ngày` hoặc `Nửa ngày` (ốm đau — Luật BHXH 2024).
Trường `nguonChiTra`: `Công ty` / `BHXH` / `Không lương`.

## Luồng duyệt

| Loại đơn | Cấp duyệt |
|----------|-----------|
| Phép năm ≤ `nguong_duyet_cap_cao` ngày | Cấp 1 → Cấp 2 |
| Phép năm > `nguong_duyet_cap_cao` ngày | Cấp 1 → 2 → 3 |
| Việc riêng hưởng lương | Cấp 1 → Cấp 2 |
| Không lương | Cấp 1 → 2 → 3 (bắt buộc) |
| OT | Cấp 2 trực tiếp (Trưởng/Phó đơn vị) |
| Công tác / Ra ngoài | Cấp 1 |

## Quy tắc bắt buộc

1. Mỗi bước duyệt = 1 bản ghi BuocDuyet (nguoiDuyet, ketQua, yKien, thoiDiem).
2. Lưu vết ĐẦYĐỦ cho Điều 28 NQLĐ (biên bản kỷ luật).
3. Thu hồi đơn: chỉ được khi chưa duyệt cuối.
4. Email thông báo: MailApp.sendEmail() cho người duyệt kế tiếp + người tạo đơn.
5. OT: kiểm tra trần OT/ngày ≤50%, /tháng ≤40h, /năm ≤200h (đọc từ CauHinh).

## Files cần tạo

```
backend/data/DonTuData.gs
backend/data/BuocDuyetData.gs
backend/rules/DuyetRules.gs    ← định tuyến cấp duyệt, kiểm tra trần OT
backend/api/DonTuApi.gs
web/don-tu.html + web/js/donton.js
web/duyet-don.html + web/js/duyetdon.js
```

Cập nhật `backend/Code.gs` với action mới.

## Nhiệm vụ

$ARGUMENTS
