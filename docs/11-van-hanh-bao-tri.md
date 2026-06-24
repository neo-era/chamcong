# 11 — Vận hành & bảo trì

> Hướng dẫn vận hành dài hạn cho Admin/IT. Hệ thống chạy trên **Google Apps Script + Google Sheets** (backend) và **GitHub Pages** (giao diện tĩnh). (ĐÃ code 2026-06-24)

## Tuổi thọ & giới hạn

| Quy mô | Tuổi thọ thực tế | Giới hạn chính |
|---|---|---|
| ~45 NV (hiện tại) | 3–5 năm | Tốc độ đọc sheet ChamCong khi dữ liệu lớn dần |
| ~80 NV | 2–3 năm rồi phải tối ưu | Quota Apps Script |
| >100 NV | Phải đổi nền tảng | Trần kiến trúc Sheets-as-DB |

- ChamCong tăng ~**16–20k dòng/năm** (đa ca còn hơn). Mỗi lần chấm công đọc toàn bộ sheet rồi lọc → chậm dần. **Archive cuối năm** để giữ tốc độ.
- Tài khoản **Gmail thường**: tổng thời gian chạy ~**90 phút/ngày**, tối đa 30 phiên đồng thời. Dùng lâu dài/đông người nên chuyển **Google Workspace** (hạn mức ~4×).

## Lịch bảo trì định kỳ

| Tần suất | Việc |
|---|---|
| Hằng tháng | Xem `Quản trị → Nhật ký` tìm lỗi/bất thường; để ý số dòng ChamCong/AuditLog |
| Hằng quý | Kiểm tra bản sao lưu trong Drive; rà quyền chia sẻ Spreadsheet |
| Đầu mỗi năm | Cập nhật **lương tối thiểu, tỷ lệ BHXH, ngày lễ Tết, định mức phép**; rà **địa bàn GPS**; **archive** dữ liệu năm cũ |
| Theo sự kiện | Có NĐ/TT mới, đổi tổ chức, đổi tên hành chính → cập nhật `Quản trị → Cấu hình` |

## Sao lưu (`backend/data/BaoTriData.gs`)

- **Tự động hằng tuần:** chạy 1 lần `installBackupTrigger()` trong trình soạn Apps Script → trigger sao lưu Chủ nhật ~02:00.
- **Thủ công trên web:** `Quản trị → Bảo trì → 💾 Sao lưu ngay` (API `saoLuuNgay`, Admin only).
- **Thủ công editor:** chạy `backupSpreadsheet()`.
- Bản sao nằm trong thư mục Drive **`CSCC_ChamCong_Backup`**, giữ **12 bản** gần nhất (tự dọn).
- Gỡ lịch: `removeBackupTrigger()`.

## Lưu trữ (archive) ChamCong cũ

- Cuối năm chạy tay: `archiveChamCongTruoc('2027-01-01')` → chuyển mọi bản ghi **trước 2027** sang spreadsheet **`CSCC_ChamCong_LuuTru`** (lưu Script Property `ARCHIVE_SS_ID`).
- Hàm tự **sao lưu trước** khi ghi đè + ghi **AuditLog** (`ARCHIVE_CHAMCONG`). Dữ liệu lưu trữ vẫn tra cứu được.

## Phụ thuộc bên ngoài

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Alpine.js, flatpickr | **Self-host** trong `web/vendor` (ghim bản) | Không phụ thuộc CDN trôi bản |
| Nominatim (geocode GPS) | Có cache 6h | Tắt được qua `kiem_tra_dia_ban`; cân nhắc Google Geocoding nếu cần |
| Google Apps Script / Sheets | Ổn định | — |
| GitHub Pages | Ổn định | — |

## Khi nào nâng cấp nền tảng

Chuyển sang DB thật (PostgreSQL/Supabase + API) khi gặp **bất kỳ**: số NV > ~80–100; ChamCong > ~50k dòng; thao tác chấm công thường > 3–4s; lỗi vượt quota.

Logic nghiệp vụ ở tầng `rules/` đã tách sạch khỏi tầng dữ liệu → di trú chỉ thay `data/` + auth, **không viết lại từ đầu**.

## Bảo mật định kỳ

- Đổi mật khẩu admin mặc định; cân nhắc xoay `SESSION_SECRET` (Script Property) định kỳ (buộc đăng nhập lại).
- Rà danh sách người được share Spreadsheet.
- Mật khẩu lưu hash SHA-256 + salt (1000 vòng), KHÔNG lưu thô.
