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
```

Kiểm tra file `.clasp.json` tại thư mục gốc dự án — đã có sẵn `scriptId`.
Nếu deploy trên máy mới, thay `scriptId` bằng Script ID vừa tạo.

### 2c. Upload code

```bash
clasp push --force
```

### 2d. Đặt khóa bí mật SESSION_SECRET

Trong Apps Script Editor → **Project Settings → Script Properties → Add property**:

| Property | Value |
|----------|-------|
| `SESSION_SECRET` | *(chuỗi ngẫu nhiên dài ≥ 32 ký tự, ví dụ: `CSCC2026_#k9mXpQ7!vLzN3wRt`)* |

> Đây là khóa ký session token. Giữ bí mật. Đổi key → tất cả user phải đăng nhập lại.

### 2e. Khởi tạo dữ liệu ban đầu

Trong Apps Script Editor:
1. Mở file `data/SheetHelper.gs`
2. Chọn function `setupGD1` trong dropdown → chạy (▶)
3. Cấp quyền khi được hỏi
4. Kiểm tra Spreadsheet — các sheet tự động tạo

### 2f. Tạo tài khoản Admin đầu tiên

Trong Apps Script Editor, mở **Console** (View → Logs) hoặc chạy function tạm:

```javascript
// Chạy 1 lần trong Editor để tạo NV Admin
function taoAdminDauTien() {
  createNV({
    maNV:    'NV001',
    hoTen:   'Nguyễn Văn Admin',
    donVi:   'Ban Giám đốc',
    khoi:    'Gián tiếp',
    chucDanh:'Quản trị viên',
    dieuKienCV: 'Bình thường',
    ngayVaoLam: '2020-01-01',
    trangThai:  'Đang làm',
    email:   'admin@cscc.vn',
    vaiTro:  'Admin'
  });
  setPassword('NV001', 'DoiNgayMatKhau@2026');
}
```

Sau khi chạy xong, đăng nhập bằng `admin@cscc.vn` / `DoiNgayMatKhau@2026` rồi đổi mật khẩu ngay.

### 2g. Deploy Web App

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

Mở `web/js/config.js`, điền Web App URL:
```javascript
const CONFIG = {
  BACKEND_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
};
```

---

## Bước 4 — Bật GitHub Pages

1. Vào repository Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/web`
4. Save → đợi ~1 phút → truy cập URL được cấp

---

## Bước 5 — Kiểm tra

1. Truy cập GitHub Pages URL
2. Đăng nhập bằng email + mật khẩu Admin vừa tạo
3. Trang chấm công hiển thị → thử chấm vào/ra
4. Kiểm tra sheet **ChamCong** trong Spreadsheet → dữ liệu xuất hiện
5. Kiểm tra sheet **AuditLog** → log ghi đúng

---

## Quản lý tài khoản nhân viên

### Thêm nhân viên mới (Admin/HR)

Trong Apps Script Editor, gọi `createNV({...})` rồi `setPassword('maNV', 'matkhau')`.

Hoặc sau khi có giao diện quản lý (GĐ2): dùng trang `nhanvien.html`.

### Reset mật khẩu

```javascript
// Chạy trong Editor
setPassword('NV002', 'MatKhauMoi@2026');
```

### Đổi mật khẩu (NV tự đổi)

Frontend gọi POST `{ action: 'doiMatKhau', token, matKhauCu, matKhauMoi }`.

---

## Cập nhật sau khi sửa code backend

```bash
clasp push --force
# Sau đó tạo deployment mới trong Apps Script Editor:
# Deploy → Manage deployments → tạo version mới
```

---

## Các sheet tự động tạo (setupGD1)

| Sheet | Mô tả |
|-------|-------|
| NhanVien | Hồ sơ nhân viên (kể cả hash mật khẩu) |
| Ca | Danh mục ca làm việc |
| LichTruc | Phân ca theo ngày |
| ChamCong | Bản ghi chấm công vào/ra |
| CauHinh | Tham số hệ thống (không hardcode) |
| AuditLog | Nhật ký mọi thao tác quan trọng |

---

## Gỡ lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|------------|----------|
| `Token không hợp lệ` | SESSION_SECRET chưa đặt hoặc sai | Kiểm tra Script Properties |
| `Phiên đăng nhập hết hạn` | Token > 8h | Đăng nhập lại |
| `Email không tồn tại trong hệ thống` | Chưa thêm NV vào sheet | Gọi `createNV()` trong Editor |
| `Tài khoản chưa được cấp mật khẩu` | Chưa gọi `setPassword()` | Gọi `setPassword('maNV', 'mk')` |
| `CORS error` | Content-Type sai | POST phải dùng `text/plain;charset=utf-8` |
| Sheet không tạo được | Script chưa cấp quyền Sheets | Chạy lại `setupGD1()` và cấp quyền |
