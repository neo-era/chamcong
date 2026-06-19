# CLAUDE.md

Ngữ cảnh dự án cho Claude Code. Đọc file này trước khi sửa code.

## Dự án là gì

Phần mềm chấm công – nghỉ phép – duyệt đơn cho đơn vị **Chiếu sáng khu vực Trung tâm**. Mọi quy tắc nghiệp vụ bắt nguồn từ **Nội quy lao động (QĐ 44/QĐ-CTCSCC)** và Bộ luật Lao động 2019. Nguồn chân lý duy nhất về yêu cầu là thư mục `docs/`.

## Tài liệu nền (đọc khi cần)

- `docs/00-srs.md` — đặc tả đầy đủ.
- `docs/01-business-rules.md` — quy tắc bắt buộc (mã hóa vào logic).
- `docs/02-data-model.md` — các bảng dữ liệu.
- `docs/03-approval-workflow.md` — luồng duyệt + phân quyền.
- `docs/04-compliance-matrix.md` — đối chiếu Nội quy ↔ chức năng.

## Quy tắc nghiệp vụ TUYỆT ĐỐI không được vi phạm

1. **Giờ HC:** Sáng 07:30–11:30, Chiều 13:00–17:00. Gián tiếp 40h/tuần, nghỉ CN. Trực tiếp theo ca xoay vòng.
2. **Chấm công (Điều 7.3 NQLĐ):** đi trễ / về sớm / vắng họp đúng giờ → đánh dấu **"tự ý bỏ việc của ngày hôm đó"** (mất công cả ngày, không chỉ trừ giờ).
3. **Nghỉ chuyển ca:** ≥12h giữa hai ca. **Nghỉ tuần:** ≥24h liên tục.
4. **Trần OT:** ≤50%/ngày; theo tuần ≤12h/ngày; ≤40h/tháng; ≤200h/năm. OT cần duyệt Trưởng/Phó đơn vị.
5. **Phép năm:** 12/14/16 ngày + ⌊thâm niên÷5⌋. Chưa đủ 12 tháng → theo tỷ lệ.
6. **Ngưỡng kỷ luật (bỏ việc không lý do, cộng dồn):** 3 ngày/30 → khiển trách; 4 ngày/30 → kéo dài nâng lương; 5 ngày/30 HOẶC 20 ngày/365 → sa thải. Hệ thống chỉ **cảnh báo**, không tự ra quyết định.
7. **Lưu vết duyệt đầy đủ** (người, thời điểm, ý kiến) — phục vụ lập biên bản theo Điều 28.

## Vai trò người dùng

NV → Tổ/Đội trưởng (duyệt cấp 1) → Trưởng/Phó đơn vị (cấp 2) → Tổng GĐ/ủy quyền (cấp 3, trường hợp đặc biệt) → HR (ghi nhận, trừ phép, khóa bảng công). Admin quản trị hệ thống.

## Quy ước code

- Ngôn ngữ giao diện: tiếng Việt.
- Tham số (giờ ca, ngày lễ, định mức nghỉ, ngưỡng kỷ luật) phải **cấu hình được**, không hardcode.
- Mốc thời gian chấm công lấy từ **máy chủ**, không tin client.
- Mọi thao tác sửa chấm công/mở khóa kỳ công phải ghi audit log.

## Trạng thái hiện tại

Mới có tài liệu đặc tả. Chưa có code. Bắt đầu từ Giai đoạn 1 (Nhân sự + Ca + Chấm công).
