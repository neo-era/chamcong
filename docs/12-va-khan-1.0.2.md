# Bản vá khẩn 1.0.2 — bảo mật (20/11/2026)

Căn cứ: báo cáo rà soát tổng thể 20/11/2026 (3 chuyên gia độc lập, kết luận KHÔNG DUYỆT
cho việc tiếp tục chạy như bản 1.0.1). Bản này chỉ vá nhóm **Khẩn**; nhóm Cao/Trung bình
nằm ở lộ trình 1.1 (bảo mật), 1.2 (nghiệp vụ), 1.3 (giao diện/PWA).

## Đã sửa

| Mã | Lỗi | Sửa |
|---|---|---|
| K1 | `datLaiMatKhau` đặt lại mật khẩu bất kỳ ai chỉ bằng email, không cần đăng nhập | Gỡ route + hàm + form. Quên mật khẩu → Admin/HR `resetMatKhau` |
| K2 | File Excel nhân sự (CCCD, ngày sinh, lương…) + bảng công thật + danh sách 45 NV trong repo công khai | Xoá khỏi cây mã **và toàn bộ lịch sử git**; `.gitignore` chặn `*.xlsx/*.xls/*.csv`; `importNhanSu` đọc sheet `NhanSuImport` |
| K3 | Email + mật khẩu Admin, mật khẩu mặc định `123456` ghi trong mã; ép đổi mật khẩu chỉ ở trình duyệt | `bootstrapAdmin` đọc Script Properties rồi tự xoá mật khẩu; mật khẩu tạm ngẫu nhiên; máy chủ chặn mọi thao tác khi `phaiDoiMK=TRUE`; mật khẩu mới ≥ 8 ký tự, khác mật khẩu cũ |
| K4 | Khoá ký token có giá trị mặc định công khai → giả token vào mọi tài khoản | `SESSION_SECRET` bắt buộc ≥ 32 ký tự; hàm `taoSessionSecret` sinh khoá ngẫu nhiên |
| K5 | API trả nguyên mật khẩu (Tổ trưởng/HR đọc được mật khẩu người khác) | Lớp lọc chung `_locBiMat` trong `_jsonOk` — mọi phản hồi bỏ `matKhau/salt` |
| K6 | Lịch lễ 2026: thiếu 24/11 (Ngày Văn hoá VN, NQ 28/2026/QH16), ghi 26/4 thay vì nghỉ bù 27/4 | Sửa giá trị mặc định + `seedNgayLe2026` (12 ngày) |
| + | HR tự nâng quyền Admin / reset mật khẩu BGĐ; sửa hồ sơ ghi đè được mật khẩu và ghi mật khẩu vào AuditLog | Chỉ Admin thao tác tài khoản Admin/BGD; sửa hồ sơ bỏ qua `matKhau/salt/phaiDoiMK` |
| + | `getCauHinh` trả toàn bộ cấu hình cho mọi người | Vai trò khác Admin chỉ nhận khoá giao diện cần |

| + | Mật khẩu đã lỡ ghi vào AuditLog khi HR sửa hồ sơ (bản ≤ 1.0.1) | Hàm `lamSachMatKhauAuditLog` (chạy 1 lần) |
| + | Phiên hỏng chỉ báo "Token không hợp lệ" | Frontend tự đăng xuất về trang đăng nhập; bị ép đổi mật khẩu thì tự chuyển trang Đổi mật khẩu |

Kiểm thử: `node tests/node/run.js` — 41/41 đạt (bản 1.0.1 trượt toàn bộ các ca bảo mật).
Test nghiệp vụ có sẵn không hồi quy (GD3 16/16; DuyetRules 16/23 như trước — 7 ca lệch đã biết, xử lý ở 1.2).
Đã qua 2 chuyên gia độc lập (bảo mật, QA) duyệt; các thay đổi bắt buộc đã áp.

## Các bước triển khai (Admin làm, đúng thứ tự)

**Làm ngoài giờ chấm công** và báo trước trong nhóm: sau bước 3 mọi người phải đăng nhập lại;
người dùng tài khoản nhạy cảm sẽ nhận mật khẩu tạm mới.

Frontend (GitHub Pages) đã được cập nhật sẵn — tương thích với cả backend cũ lẫn mới.

1. Máy có bản clone cũ: `git fetch origin && git reset --hard origin/main` (lịch sử đã viết lại;
   `.clasp.json` và file Excel trên máy được giữ, `.gitignore` chặn đẩy Excel lên lại).
2. Từ thư mục `backend`: `clasp push --force`, rồi
   `clasp deploy --deploymentId <ID hiện tại> --description "1.0.2 vá khẩn bảo mật"`.
3. **Ngay sau đó**, trong Apps Script Editor chọn hàm **`taoSessionSecret` → Run** (bắt buộc,
   kể cả đã có SESSION_SECRET — khoá cũ có thể là giá trị mặc định đã lộ). Từ bước 2 đến bước 3
   màn đăng nhập có thể báo "Hệ thống đang bảo trì" — bình thường. Chạy `kiemTraAuth` để xác nhận.
4. Chạy hàm **`lamSachMatKhauAuditLog`** (xoá mật khẩu đã lỡ ghi trong AuditLog). Các bản sao lưu
   cũ (thư mục backup) cũng chứa nội dung đó → xoá các bản sao lưu trước ngày triển khai.
5. Sheet **CauHinh**: sửa `ngay_le_tet` — thêm `2026-11-24`; đổi `2026-04-26` → `2026-04-27`
   (nếu kỳ công tháng 4 chưa khoá thì bảng công tháng 4 sẽ thay đổi theo). Chỉ chạy `seedNgayLe2026`
   khi Công ty KHÔNG có ngày hoán đổi riêng (hàm ghi đè toàn bộ). Đặt `app_version` = `1.0.2`.
6. Sheet **AuditLog** (lọc trực tiếp trên Sheet — màn Nhật ký trong app đang lỗi, sửa ở 1.1):
   mọi tài khoản có dòng action = `DAT_LAI_MAT_KHAU` → coi như có thể đã bị chiếm: reset mật khẩu
   tạm, rà các thao tác của tài khoản đó sau thời điểm ấy.
7. Sheet **NhanVien** / trang Quản trị:
   - Do lỗi cũ cho Tổ trưởng/HR đọc được mật khẩu người khác: **reset mật khẩu tạm** cho mọi tài
     khoản vai trò **Admin, BGD, HR, TruongDonVi, ToTruong**.
   - Mọi tài khoản còn mật khẩu `123456` hoặc dưới 8 ký tự: đặt cột `phaiDoiMK` = `TRUE`
     (lần đăng nhập tới sẽ bị bắt đổi).
   - Tài khoản mẫu `GD01/TDV01/TT01/NV01` nếu có → `trangThai = Nghỉ việc`.
   - Email Admin cũ đã lộ trong repo: nên tạo Admin mới bằng `bootstrapAdmin` với email khác
     (xem SETUP.md mục 2f), sau đó đặt tài khoản Admin cũ `Nghỉ việc`.
8. Kiểm tra quyền chia sẻ của Spreadsheet hệ thống và thư mục sao lưu: chỉ người cần thiết
   (ID Spreadsheet có trong mã nguồn công khai — an toàn chỉ khi file không chia sẻ công khai).
