# SETUP — Hướng dẫn triển khai hệ thống Chấm công CSCC

## Yêu cầu

- Tài khoản Google (sở hữu Google Workspace hoặc Gmail)
- Node.js ≥ 18 (để dùng clasp deploy)
- clasp: `npm install -g @google/clasp`

---

## Bước 1 — Tạo Google Spreadsheet

1. Truy cập [sheets.google.com](https://sheets.google.com) → tạo spreadsheet mới.
2. Đặt tên: **CSCC_ChamCong_DB**
3. Ghi lại **Spreadsheet ID** (chuỗi dài trong URL).

> Các sheet (tab) sẽ được tạo tự động khi chạy `setupGD1()` ở Bước 3.
> Không cần tạo tay.

---

## Bước 2 — Deploy Google Apps Script

### 2a. Tạo Apps Script project

1. Trong Spreadsheet vừa tạo: **Extensions → Apps Script**
2. Ghi lại **Script ID** (URL có dạng `...script.google.com/home/projects/SCRIPT_ID/...`)

### 2b. Cấu hình clasp

```bash
clasp login
cp backend/.clasp.json.example backend/.clasp.json
```

Mở `backend/.clasp.json`, điền `scriptId`:
```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./backend"
}
```

### 2c. Liên kết script với Spreadsheet

Trong file `backend/Code.gs`, sửa dòng đầu:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

### 2d. Upload code

```bash
clasp push
```

### 2e. Khởi tạo dữ liệu ban đầu

Trong Apps Script Editor (giao diện web):
1. Chọn function `setupGD1` → chạy (▶)
2. Cấp quyền khi được hỏi
3. Kiểm tra Spreadsheet — các sheet mới tạo tự động

### 2f. Deploy Web App

1. **Deploy → New deployment**
2. Loại: **Web app**
3. Execute as: **Me** (tài khoản của bạn)
4. Who has access: **Anyone** (để frontend gọi được)
5. Click **Deploy** → **sao chép Web App URL**

---

## Bước 3 — Cấu hình Frontend

```bash
cp web/js/config.example.js web/js/config.js
```

Mở `web/js/config.js`, điền:
```javascript
const CONFIG = {
  BACKEND_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  GIS_CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
};
```

---

## Bước 4 — Tạo Google Cloud Project & GIS Client ID

1. Truy cập [console.cloud.google.com](https://console.cloud.google.com)
2. Tạo project mới (hoặc dùng project gắn với Apps Script)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins: thêm domain GitHub Pages của bạn
   (ví dụ: `https://username.github.io`)
6. Authorized redirect URIs: để trống (GIS dùng popup, không cần redirect URI)
7. Sao chép **Client ID** → điền vào `web/js/config.js`

---

## Bước 5 — Bật GitHub Pages

1. Vào repository Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/web`
4. Save → đợi ~1 phút → truy cập URL được cấp

---

## Bước 6 — Thêm nhân viên đầu tiên (Admin)

Trong sheet **NhanVien**, thêm dòng đầu tiên:

| maNV | hoTen | donVi | khoi | chucDanh | dieuKienCV | ngayVaoLam | quanLyTrucTiep | trangThai | email | vaiTro |
|------|-------|-------|------|----------|------------|------------|----------------|-----------|-------|--------|
| NV001 | Nguyễn Văn A | Ban Giám đốc | Gián tiếp | Giám đốc | Bình thường | 2020-01-01 | | Đang làm | admin@example.com | Admin |

> `email` phải khớp với tài khoản Google sẽ đăng nhập.
> `vaiTro` phải là một trong: `NV`, `ToTruong`, `TruongDonVi`, `BGD`, `HR`, `Admin`

---

## Bước 7 — Kiểm tra

1. Truy cập GitHub Pages URL
2. Đăng nhập bằng Google
3. Trang chấm công hiển thị → thử chấm vào/ra
4. Kiểm tra sheet **ChamCong** trong Spreadsheet → dữ liệu xuất hiện
5. Kiểm tra sheet **AuditLog** → log ghi đúng

---

## Cập nhật sau khi sửa code backend

```bash
clasp push
# Sau đó tạo deployment mới trong Apps Script Editor:
# Deploy → Manage deployments → tạo version mới
```

---

## Các sheet tự động tạo (setupGD1)

| Sheet | Mô tả |
|-------|-------|
| NhanVien | Hồ sơ nhân viên |
| Ca | Danh mục ca làm việc |
| LichTruc | Phân ca theo ngày |
| ChamCong | Bản ghi chấm công vào/ra |
| CauHinh | Tham số hệ thống (không hardcode) |
| AuditLog | Nhật ký mọi thao tác quan trọng |

---

## Gỡ lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|------------|----------|
| `Token không hợp lệ` | Client ID sai hoặc token hết hạn | Kiểm tra GIS_CLIENT_ID trong config.js |
| `Email không có trong hệ thống` | Chưa thêm NV vào sheet | Thêm bản ghi vào sheet NhanVien |
| `CORS error` | Content-Type sai | Đảm bảo POST dùng `text/plain;charset=utf-8` |
| Sheet không tạo được | Script chưa cấp quyền Sheets | Chạy lại setupGD1() và cấp quyền |
