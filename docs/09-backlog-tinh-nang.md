# 09 — Backlog tính năng mở rộng (chưa code)

> Danh sách tính năng đề xuất sau khi GĐ1–4 + BS/BS2 + in đơn + mobile đã xong.
> Prompt thực thi tương ứng ở `docs/prompts.md` mục **PHASE NC**.
> Trạng thái rà soát 2026-06-21: SESSION_SECRET đã đặt ✅; khoi đã phân loại (25 Trực tiếp/20 Gián tiếp) ✅.

## 🔴 Bảo mật (ưu tiên cao)
| Mã | Tính năng | Ghi chú |
|----|-----------|---------|
| NC-A | Bắt đổi mật khẩu lần đầu | 45 NV đang dùng chung `123456`. Cột `phaiDoiMK`; ép đổi trước khi dùng app. |
| NC-B | Khoá đăng nhập sau N lần sai | Chống dò mật khẩu (login công khai trên Pages). CacheService đếm theo email. |

## 🟡 Tuân thủ nghiệp vụ (giá trị cao — đúng mục tiêu phần mềm)
| Mã | Tính năng | Ghi chú |
|----|-----------|---------|
| NC-C | Kiểm tra trần OT (Điều 5.3) | ≤50%/ngày, ≤40h/tháng, ≤200h/năm. Cần thêm số GIỜ cho đơn OT. |
| NC-D | Định mức nghỉ việc riêng (Mục 4.4) | Kết hôn 3 ngày, tang 3 ngày… Chọn lý do từ danh mục có định mức; vượt → chặn/chuyển không lương. |
| NC-quota | Hoàn thiện phép | `tinhQuotaDauNam` + `tinhQuota` (tỷ lệ <12 tháng) ĐÃ có code — chỉ cần CHẠY đầu năm. Bổ sung: báo cáo phép tồn cuối năm, cấu hình chuyển phép. |
| NC-dk | dieuKienCV nặng nhọc | Dữ liệu, không phải code: đánh dấu công nhân nặng nhọc/độc hại → phép 14/16. |

## 🟢 Nâng cao — tiện ích
| Mã | Tính năng | Ghi chú |
|----|-----------|---------|
| NC-E | Thông báo trong app (chuông) | Sheet ThongBao; chuông + số chưa đọc trên header. Bù cho email hay lỗi scope. |
| NC-F | Dashboard / báo cáo | Thống kê đi trễ/vắng/OT/phép theo kỳ; lịch "ai đang nghỉ". |
| NC-G | Tối ưu tốc độ (6s→~2-3s) | CacheService cho CauHinh/NhanVien; gộp đọc sheet 1 lần trong donChoDuyet/bảng công. |
| NC-H | PWA | Cài như app trên điện thoại; chấm công nhanh ngoài hiện trường (manifest + service worker). |
| NC-I | Đính kèm file thật | Upload file lên Drive (thay vì chỉ URL). Dùng scope drive đã có. |
| NC-J | Biên bản kỷ luật (Điều 28) | Sinh biên bản in từ CanhBaoKyLuat (liệt kê ngày bỏ việc). |

## 🔵 Chấm công nâng cao
| Mã | Tính năng | Ghi chú |
|----|-----------|---------|
| NC-K | Chấm vào/ra nhiều lần trong ca (tối đa 3 lần) | Dành cho khối Trực tiếp đi hiện trường nhiều chuyến. Schema: thêm cột `lan` vào ChamCong → nhiều dòng/ca thay vì 1 dòng. Tổng giờ = Σ(gioRa − gioVao). Gián tiếp vẫn 1 dòng/ngày (dùng đơn Ra ngoài). Scope thay đổi: schema + 5-6 API + bảng công + frontend. |

## Thứ tự đề nghị
NC-A → NC-C → NC-D → NC-E → NC-G → (còn lại tuỳ nhu cầu).
