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
- `docs/05-legal-insurance.md` — BHXH/BHYT/BHTN & lương tối thiểu (cập nhật 2026).
- `docs/06-bang-cong-template.md` — đặc tả biểu mẫu bảng công tháng (đầu ra GĐ3), trích từ file mẫu `docs/Copy of Chấm công tháng 6.xlsx`.
- `docs/07-cham-cong-truc-tiep-theo-gio.md` — quy tắc chấm công khối Trực tiếp tính theo giờ (ĐÃ code).
- `docs/08-duyet-don-3-cap.md` — mọi đơn duyệt đủ 3 cấp 1→2→3 (ĐÃ code).
- `docs/09-backlog-tinh-nang.md` — backlog tính năng mở rộng + ưu tiên (CHƯA code; prompt ở PHASE NC).

## Hằng số pháp lý hiện hành (đưa vào CauHinh, KHÔNG hardcode)

- Lương tối thiểu Vùng I (TP.HCM) 2026: **5.310.000 đ/tháng** (NĐ 293/2025).
- Tỷ lệ đóng BHXH/BHYT/BHTN: tổng **32%** (NLĐ 10,5% + DN 21,5%).
- Áp dụng **Luật BHXH 2024** (hiệu lực 01/7/2025): hỗ trợ nghỉ ốm nửa ngày; thai sản nữ 6 tháng; thai sản nam 5/7/10/14 ngày (trong 60 ngày đầu); con ốm 20/15 ngày.

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

**GĐ1 đã có code đầy đủ.** Cần điền `SPREADSHEET_ID` vào `backend/data/SheetHelper.gs` rồi deploy theo `SETUP.md`.

---

## Quy ước code (BẮT BUỘC — không vi phạm)

### Backend (Google Apps Script)

- **Kiến trúc tầng**: `Code.gs` → `api/` → `rules/` + `data/`. `api/` không gọi Sheets trực tiếp. `rules/` không import gì từ `data/`.
- **CauHinh**: Mọi hằng số pháp lý đọc qua `getConfig(key)` / `getConfigNumber(key, fallback)` — KHÔNG hardcode số nào cả.
- **Timestamp chấm công**: chỉ dùng `new Date()` phía Apps Script. Không nhận giá trị timestamp từ client.
- **AuditLog**: gọi `appendLog(maNV, email, action, doiTuong, chiTiet)` sau MỌI thao tác ghi/sửa chấm công, mở khoá bảng công, duyệt đơn.
- **Tên hàm**: camelCase tiếng Anh (`chamVao`, `getNhanVien`, `kiemTraNghiChuyenCa`).
- **Tên sheet**: đúng tên trong `docs/02-data-model.md` (`NhanVien`, `Ca`, `LichTruc`, `ChamCong`, `CauHinh`, `AuditLog`).
- **Validate input** ở tầng `api/`; ném `throw new Error(message)` để `Code.gs` bắt và trả JSON lỗi.

### Frontend (HTML + Alpine.js)

- **POST cross-origin**: `Content-Type: text/plain;charset=utf-8`; body = `JSON.stringify({action, idToken, ...data})`. KHÔNG dùng `application/json`.
- **GET**: đặt `idToken` trong query string (URL param).
- **Token**: lưu trong `sessionStorage` (không dùng `localStorage`). Kiểm tra hết hạn trước mỗi request.
- **Vai trò**: kiểm tra `user.vaiTro` trước khi render trang quản lý; redirect về `chamcong.html` nếu không đủ quyền.
- **Tên hàm Alpine**: camelCase tiếng Anh; tên biến Vue-like (`danhSach`, `loading`, `errorMsg`).
- **Giao diện**: tiếng Việt hoàn toàn, không mix tiếng Anh.

### Phân quyền

Xem `backend/rules/QuyenRules.gs` — `QUYEN_MAP` là nguồn chân lý duy nhất. Không kiểm tra vai trò theo cách khác.

### Trạng thái chấm công

`DU_CONG` / `TRE` / `SOM` / `MAT_CONG` / `VANG_PHEP` / `VANG_KHONG_PHEP`

`TRE` và `SOM` → đều tính là "bỏ việc ngày đó" (Điều 7.3). Dùng `laBoViec(trangThai)` để kiểm tra.

---

## Công cụ hỗ trợ

- `/setup` — hướng dẫn deploy từ đầu
- `/gd1` — làm việc trên GĐ1
- `/gd2` `/gd3` `/gd4` — các giai đoạn tiếp theo
- `/test-rules` — viết/chạy test cho business rules
- `/nghiem-thu gd1` — checklist nghiệm thu GĐ1
- `docs/prompts.md` — bộ prompt đầy đủ cho từng phase
