# Bộ Prompt Thực Thi — Hệ thống Chấm công CSCC

> Paste prompt tương ứng vào Claude Code khi bắt đầu mỗi giai đoạn.
> Mỗi prompt đã đủ ngữ cảnh để hoạt động độc lập — không cần đọc thêm docs.

---

## PROMPT-SETUP — Cài đặt lần đầu

```
Tôi cần hướng dẫn deploy hệ thống Chấm công CSCC lên Google Apps Script + GitHub Pages.

Stack:
- Backend: Google Apps Script (thư mục backend/), đã có Code.gs + appsscript.json
- Frontend: HTML thuần + Alpine.js (thư mục web/), host GitHub Pages
- DB: Google Sheets (Spreadsheet riêng)

Cần làm:
1. Tạo Google Spreadsheet và điền SPREADSHEET_ID vào backend/data/SheetHelper.gs
2. Tạo Apps Script project, upload bằng clasp (backend/.clasp.json.example → .clasp.json)
3. Chạy hàm setupGD1() để tạo các sheet
4. Deploy Web App (Execute as Me, Access: Anyone) → lấy URL
5. Sao chép web/js/config.example.js → config.js, điền BACKEND_URL + GIS_CLIENT_ID
6. Tạo GIS Client ID trên Google Cloud Console
7. Bật GitHub Pages (branch main, thư mục /web)

Kiểm tra SETUP.md và hướng dẫn tôi từng bước, xác nhận các giá trị cần điền.
```

---

## PROMPT-GĐ1-BACKEND — Backend Giai đoạn 1

```
Tôi đang xây dựng hệ thống Chấm công CSCC — Giai đoạn 1 (Nhân sự + Ca + Chấm công).

Stack: Google Apps Script Web App, Google Sheets làm DB.

Quy tắc nghiệp vụ CỐT LÕI (từ QĐ 44/QĐ-CTCSCC):
1. Giờ HC: Sáng 07:30–11:30, Chiều 13:00–17:00
2. Điều 7.3: Đi trễ / về sớm / vắng họp đúng giờ = "tự ý bỏ việc ngày hôm đó"
   → trạng thái TRE hoặc SOM (mất công cả ngày, không chỉ trừ giờ)
3. Nghỉ chuyển ca ≥ 12h (Điều 22), nghỉ tuần ≥ 24h liên tục (Điều 23)
4. Mọi tham số (giờ ca, ngưỡng kỷ luật…) đọc từ sheet CauHinh — KHÔNG hardcode
5. Mọi thao tác sửa chấm công phải ghi AuditLog (người, thời điểm, lý do, giá trị cũ/mới)
6. Giờ chấm công lấy từ new Date() trên máy chủ — không tin client

Kiến trúc tầng (đã có code):
- data/  → truy cập Sheets (SheetHelper, NhanVienData, CaData, LichTrucData, ChamCongData, CauHinhData, AuditLogData)
- rules/ → logic thuần (QuyenRules, ChamCongRules, CaRules) — KHÔNG truy cập Sheets
- api/   → gọi rules + data (AuthApi, NhanVienApi, CaApi, LichTrucApi, ChamCongApi)
- Code.gs → doGet/doPost dispatcher

POST sử dụng Content-Type: text/plain;charset=utf-8; body = JSON.stringify({action, idToken, ...data})
GET  đặt idToken trong query string

Nhiệm vụ: [mô tả thứ cần làm cụ thể]
```

---

## PROMPT-GĐ1-FRONTEND — Frontend Giai đoạn 1

```
Tôi đang build frontend cho hệ thống Chấm công CSCC (Giai đoạn 1).

Stack: HTML thuần + Alpine.js (CDN) + CSS tự viết, host GitHub Pages.
Auth: Google Identity Services (GIS) — ID token trong sessionStorage.
API: gọi Apps Script Web App qua fetch, POST dùng Content-Type: text/plain;charset=utf-8.

File cấu hình: web/js/config.js có:
  CONFIG.BACKEND_URL — URL Apps Script Web App
  CONFIG.GIS_CLIENT_ID — Google OAuth Client ID

Các trang đã có:
- index.html: login GIS → redirect chamcong.html
- chamcong.html: chấm vào/ra (PC + GPS), lịch sử 7 ngày
- nhanvien.html: CRUD nhân viên (HR/Admin only)
- phanca.html: grid tuần × NV, click ô phân ca, cảnh báo <12h/<24h

Alpine.js data functions trong js/chamcong.js, nhanvien.js, phanca.js
Shared: js/auth.js (GIS login, logout, requireLogin) + js/api.js (apiGet, apiPost, Api object)

Lưu ý UI:
- Trang chấm công: 2 nút lớn "CHẤM CÔNG VÀO" / "CHẤM CÔNG RA"
- Khi trễ/về sớm: hiện cảnh báo đỏ "mất công ngày — Điều 7.3 NQLĐ"
- Responsive, mobile-first; GPS dùng navigator.geolocation

Nhiệm vụ: [mô tả thứ cần làm cụ thể]
```

---

## PROMPT-GĐ1-TEST — Kiểm thử nghiệm thu GĐ1

```
Kiểm thử hệ thống Chấm công CSCC Giai đoạn 1. Mọi rule nghiệp vụ trong rules/ phải test được không cần Sheets.

Kịch bản cần kiểm thử:

A. ChamCongRules.tinhTrangThaiCong():
   1. Vào 07:29 / Ra 17:01 → DU_CONG
   2. Vào 07:31 (trễ 1 phút) → TRE (dù ra đúng giờ, vẫn mất công — Điều 7.3)
   3. Vào 07:29 / Ra 16:59 (về sớm 1 phút) → SOM (mất công — Điều 7.3)
   4. Không chấm vào → MAT_CONG
   5. Vào 07:31, grace=5 → DU_CONG (trong ngưỡng ân hạn)
   6. Ca đêm 17:00–07:00 (qua ngày): vào 17:05 → TRE

B. CaRules.kiemTraNghiChuyenCa():
   1. Ca trước ra 17:00, ca sau vào 07:00 hôm sau = 14h → ok: true
   2. Ca trước ra 22:00, ca sau vào 06:00 hôm sau = 8h  → ok: false, thiếu 4h
   3. Đúng 12h → ok: true (biên)

C. CaRules.kiemTraNghiTuan():
   1. Lịch T2–T7 liên tục, nghỉ CN = 24h → ok: true
   2. Lịch T2–T7 ca đêm (17:00–07:00), khoảng giữa các ca <24h → ok: false

D. QuyenRules.hasQuyen():
   - NV có CHAM_CONG → true
   - NV có QUAN_LY_NV → false
   - HR có SUA_CHAM_CONG → true

E. End-to-end qua API (cần Apps Script đã deploy):
   - POST chamVao → ghi vào sheet ChamCong, gioVao = giờ máy chủ
   - POST chamVao lần 2 → lỗi "Đã chấm công vào"
   - POST chamRa → cập nhật gioRa, trang thái đúng
   - POST suaChamCong không có lyDo → lỗi "Phải nhập lý do"
   - POST suaChamCong có lyDo → ghi AuditLog

Viết hàm test đơn giản chạy trong Apps Script Editor (Logger.log để xem kết quả).
```

---

## PROMPT-GĐ2-BACKEND — Đơn từ & Quy trình duyệt

```
Xây dựng Giai đoạn 2: Đơn từ + Quy trình duyệt nhiều cấp.

Đọc docs/02-data-model.md (DonTu, BuocDuyet), docs/03-approval-workflow.md.

Loại đơn (DonTu.loaiDon):
  Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài /
  Ốm đau / Chăm con ốm / Thai sản nữ / Thai sản nam / TNLĐ-BNN / Khám thai

Luồng duyệt theo docs/03:
  - Phép ≤ nguong_duyet_cap_cao ngày → Cấp 1 → Cấp 2
  - Phép > nguong_duyet_cap_cao ngày → Cấp 1 → 2 → 3
  - Không lương → bắt buộc Cấp 3
  - OT → Trưởng/Phó đơn vị (Cấp 2 trực tiếp)
  - Công tác / Ra ngoài → Cấp 1

Quy tắc bắt buộc:
  - donViTinh: Ngày / Nửa ngày (ốm đau theo Luật BHXH 2024)
  - Mỗi bước duyệt ghi vào BuocDuyet (nguoiDuyet, ketQua, yKien, thoiDiem)
  - Khi đơn phép năm được duyệt cuối → trừ SoDuPhep (GĐ3 sẽ dùng lại)
  - Khi đơn bị thu hồi sau duyệt → hoàn lại SoDuPhep
  - Email thông báo (MailApp.sendEmail) cho từng bước duyệt

Tạo:
  - backend/data/DonTuData.gs
  - backend/data/BuocDuyetData.gs
  - backend/rules/DutyetRules.gs (định tuyến cấp duyệt)
  - backend/api/DonTuApi.gs
  Cập nhật Code.gs với routes mới.
```

---

## PROMPT-GĐ2-FRONTEND — Frontend Giai đoạn 2

```
Thêm trang đơn từ vào hệ thống Chấm công CSCC (Giai đoạn 2).

Cần thêm:
  web/don-tu.html     — tạo đơn + lịch sử đơn của NV
  web/duyet-don.html  — danh sách đơn cần duyệt (Tổ trưởng / Trưởng đơn vị / BGD)
  web/js/donton.js
  web/js/duyetdon.js

Trang don-tu.html:
  - Form tạo đơn: loại đơn (dropdown), từ ngày – đến ngày, đơn vị tính (Ngày/Nửa ngày), lý do, đính kèm
  - Số ngày tự tính từ fromDate/toDate (trừ T7-CN nếu HC)
  - Cảnh báo nếu số dư phép không đủ
  - Bảng lịch sử đơn của mình (trạng thái + tiến độ duyệt)

Trang duyet-don.html:
  - Bảng đơn chờ duyệt của mình (filter theo trạng thái)
  - Click mở modal: xem chi tiết đơn + lịch sử các bước đã duyệt
  - Nút: Duyệt / Từ chối / Yêu cầu bổ sung (kèm ý kiến)

Tuân thủ pattern đã có: Alpine.js x-data, apiGet/apiPost từ api.js, auth từ auth.js.
```

---

## PROMPT-GĐ3 — Quản lý phép & Bảng công

```
Giai đoạn 3: Quản lý phép + Bảng công.

Đọc docs/00-srs.md Mục 6.3 và docs/02-data-model.md (SoDuPhep).

Công thức quota phép (Điều 25, 26 NQLĐ):
  quota = dieuKienBase + floor(thamNien / 5)
  dieuKienBase: Bình thường = 12, Nặng nhọc = 14, Đặc biệt nặng nhọc = 16
  Chưa đủ 12 tháng: quota = dieuKienBase * soThangLamViec / 12

Backend:
  - backend/data/SoDuPhepData.gs
  - backend/rules/PhepRules.gs (tinhQuota, kiemTraDuPhep)
  - backend/api/BangCongApi.gs (bảng công tháng, khoá kỳ công)
  Hàm tinhQuotaDauNam() chạy cron đầu năm (trigger thủ công).
  Khoá bảng công: cột isLocked trong BangCong sheet; chỉ HR/Admin mở khoá + ghi AuditLog.

Frontend:
  web/bang-cong.html — bảng công tháng (NV xem của mình, HR/Admin xem theo đơn vị)
  Xuất Excel (dùng Google Sheets API hoặc CSV download).
  web/so-du-phep.html — số dư phép năm, lịch sử trừ phép.
```

---

## PROMPT-GĐ4 — Cảnh báo kỷ luật & Quản trị

```
Giai đoạn 4: Cảnh báo kỷ luật + Quản trị hệ thống.

Đọc docs/01-business-rules.md Mục 5 và docs/02-data-model.md (CanhBaoKyLuat).

Ngưỡng kỷ luật (tất cả đọc từ CauHinh, KHÔNG hardcode):
  3 ngày / 30 ngày  → Khiển trách
  4 ngày / 30 ngày  → Kéo dài nâng lương ≤6 tháng
  5 ngày / 30 ngày HOẶC 20 ngày / 365 ngày → Sa thải
  Hệ thống CHỈ CẢNH BÁO, không tự ra quyết định kỷ luật.

Thuật toán cửa sổ trượt:
  Với mỗi NV, duyệt toàn bộ ChamCong có trangThai = TRE/SOM/MAT_CONG/VANG_KHONG_PHEP.
  Đếm số ngày trong window 30 ngày từ ngày hiện tại trở về.
  Đếm số ngày trong window 365 ngày.
  So sánh với ngưỡng → sinh CanhBaoKyLuat nếu chạm ngưỡng.

Backend:
  - backend/rules/KyLuatRules.gs (demBoViec30, demBoViec365, kiemTraNguong)
  - backend/api/KyLuatApi.gs (quetCanhBao, getCanhBao)
  Trigger chạy hàng ngày: Time-driven trigger gọi quetCanhBaoTatCa().

Frontend:
  web/ky-luat.html — bảng cảnh báo (HR/Tổ trưởng/BGD), lọc theo đơn vị, mức cảnh báo.
  web/quan-tri.html — Admin: quản lý CauHinh (sửa tham số), quản lý AuditLog.
```

---

## PROMPT-DEBUG-TOKEN — Gỡ lỗi xác thực GIS

```
Hệ thống Chấm công CSCC — Gỡ lỗi lỗi xác thực.

Triệu chứng: [mô tả lỗi cụ thể]

Luồng xác thực:
1. Frontend: GIS trả về ID token (JWT) sau khi user đăng nhập Google
2. Frontend gửi idToken trong body (POST) hoặc query string (GET)
3. Backend (AuthApi.gs): UrlFetchApp.fetch(GOOGLE_TOKENINFO_URL + token) để verify
4. Nếu hợp lệ → getNVByEmail(info.email) → kiểm tra trangThai
5. Nếu email không có trong sheet NhanVien → lỗi "Email không được cấp quyền"

File liên quan:
- backend/api/AuthApi.gs — verifyAndGetUser()
- backend/data/NhanVienData.gs — getNVByEmail()
- web/js/auth.js — getIdToken(), initGISLogin()
- web/js/config.js — GIS_CLIENT_ID phải khớp với Google Cloud Console

Hãy kiểm tra và tìm nguyên nhân lỗi.
```
