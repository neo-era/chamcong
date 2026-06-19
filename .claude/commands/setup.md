# /setup — Hướng dẫn cài đặt từng bước

Dự án **Chấm công CSCC** — hướng dẫn deploy từ đầu.

Đọc `SETUP.md` và hướng dẫn người dùng thực hiện các bước sau:

## Checklist

- [ ] **Bước 1**: Tạo Google Spreadsheet mới, ghi lại Spreadsheet ID
- [ ] **Bước 2**: Mở Apps Script từ Spreadsheet → ghi lại Script ID
- [ ] **Bước 3**: Sao chép `backend/.clasp.json.example` → `backend/.clasp.json`, điền Script ID
- [ ] **Bước 4**: Điền Spreadsheet ID vào dòng `const SPREADSHEET_ID` trong `backend/data/SheetHelper.gs`
- [ ] **Bước 5**: `clasp login && clasp push` từ thư mục gốc
- [ ] **Bước 6**: Chạy `setupGD1()` trong Apps Script Editor → xác nhận 6 sheet được tạo
- [ ] **Bước 7**: Deploy Web App (Execute as Me, Anyone) → sao chép URL
- [ ] **Bước 8**: Tạo GIS Client ID trên Google Cloud Console
- [ ] **Bước 9**: Sao chép `web/js/config.example.js` → `web/js/config.js`, điền URL + Client ID
- [ ] **Bước 10**: Bật GitHub Pages (Settings → Pages → branch main, /web)
- [ ] **Bước 11**: Thêm nhân viên Admin đầu tiên vào sheet NhanVien
- [ ] **Bước 12**: Kiểm thử: đăng nhập → chấm công → xem sheet ChamCong và AuditLog

## Nhiệm vụ

$ARGUMENTS

Nếu người dùng gặp lỗi, hỏi thông tin lỗi cụ thể và kiểm tra:
1. SPREADSHEET_ID trong SheetHelper.gs đúng chưa?
2. config.js có tồn tại và đúng format chưa?
3. Email đăng nhập có trong sheet NhanVien chưa?
4. Apps Script đã được deploy mới nhất chưa?
