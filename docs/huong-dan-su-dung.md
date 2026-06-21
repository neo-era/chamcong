# Hướng dẫn sử dụng — Hệ thống Chấm công CSCC

Tài liệu dành cho người dùng cuối. Giao diện tiếng Việt, dùng trên máy tính và điện thoại.

---

## 1. Đăng nhập

1. Mở trang web hệ thống.
2. Nhập **Email** và **Mật khẩu** do quản trị/HR cấp → bấm **Đăng nhập**.
3. Mật khẩu mặc định ban đầu là `123456` (nên đổi sau lần đăng nhập đầu).

> Phiên đăng nhập tự hết hạn sau **8 giờ** — khi đó cần đăng nhập lại.
> Mỗi vai trò thấy các menu khác nhau (xem mục 3).

**Quên/đổi mật khẩu:** liên hệ HR hoặc Quản trị để đặt lại.

---

## 2. Giao diện chung

- Thanh trên cùng: logo, các menu (theo quyền), tên bạn, nút **Đăng xuất**.
- Thông báo màu: xanh = thành công, đỏ = lỗi, vàng = cảnh báo.
- Trên điện thoại, menu rút gọn — vuốt/ấn để xem.

---

## 3. Chức năng theo vai trò

| Vai trò | Menu sử dụng |
|---|---|
| **Nhân viên (NV)** | Chấm công · Đơn từ · Bảng công · Số dư phép |
| **Tổ trưởng** | (như NV) + Duyệt đơn (cấp 1) · Phân ca · Cảnh báo KL |
| **Trưởng đơn vị** | (như Tổ trưởng) + Duyệt đơn (cấp 2) |
| **Ban Giám đốc (BGĐ)** | Duyệt đơn (cấp 3) · xem báo cáo toàn đơn vị |
| **Nhân sự (HR)** | Nhân viên · Sửa chấm công · Bảng công (khoá kỳ) · Số dư phép (tính quota) · Cảnh báo KL |
| **Quản trị (Admin)** | Nhân viên · Phân ca · Sửa chấm công · Quản trị (cấu hình, nhật ký) |

---

## 4. Chấm công hằng ngày (mọi NV)

Menu **Chấm công**:

1. Đầu giờ làm: bấm **CHẤM CÔNG VÀO**.
2. Cuối giờ làm: bấm **CHẤM CÔNG RA**.
3. Nếu làm hiện trường: bật **GPS** trước khi chấm để gửi kèm toạ độ.

**Quy tắc quan trọng (Điều 7.3 Nội quy lao động):**
- Đi **trễ** hoặc về **sớm** → bị tính **mất công cả ngày hôm đó** (không phải chỉ trừ vài phút).
- Hệ thống hiện cảnh báo đỏ khi bạn trễ/sớm.

Bảng **lịch sử 7 ngày** hiển thị ngay dưới, kèm trạng thái: Đủ công / Đi trễ / Về sớm / Mất công / Vắng có phép / Vắng không phép.

> Giờ chấm công lấy từ **máy chủ**, không sửa được từ máy người dùng.

---

## 5. Tạo và theo dõi đơn từ (mọi NV, trừ Admin)

Menu **Đơn từ** → **Tạo đơn mới**:

1. Chọn **Loại đơn**: Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài / Ốm đau / Chăm con ốm / Thai sản nữ / Thai sản nam / TNLĐ-BNN / Khám thai.
2. Chọn **Từ ngày – Đến ngày**, **Đơn vị tính** (Ngày / Nửa ngày).
3. Nhập **Lý do** (bắt buộc) và **Đính kèm** (link minh chứng, nếu có).
4. Hệ thống hiện **số ngày ước tính** (đã loại T7/CN). Bấm **Gửi đơn**.

**Theo dõi:** bảng "Đơn của tôi" hiển thị trạng thái và **tiến độ duyệt** từng cấp (ai duyệt, kết quả, ý kiến, thời điểm).

- **Thu hồi**: được phép khi đơn còn *Chờ duyệt* hoặc *Bổ sung*.
- **Sửa & nộp lại**: khi đơn bị *Yêu cầu bổ sung* — sửa thông tin rồi nộp lại.
- Khi đơn *Đã duyệt* cuối → **không thu hồi được**.

> Đơn **Phép năm** được duyệt cuối sẽ **tự trừ vào số dư phép** của bạn.

---

## 6. Duyệt đơn (Tổ trưởng / Trưởng đơn vị / BGĐ)

Menu **Duyệt đơn**:

1. Bảng liệt kê các đơn **đang chờ chính bạn duyệt** (đúng cấp của bạn).
2. Bấm **Xem & duyệt** → xem chi tiết đơn + lịch sử các bước đã duyệt.
3. Chọn kết quả: **Duyệt** / **Từ chối** / **Yêu cầu bổ sung** + nhập **ý kiến** (bắt buộc khi từ chối hoặc yêu cầu bổ sung).

**Luồng duyệt theo loại đơn:**

| Loại đơn | Cấp duyệt |
|---|---|
| Phép năm / Việc riêng ≤ 2 ngày | Cấp 1 → Cấp 2 |
| Phép năm / Việc riêng > 2 ngày | Cấp 1 → Cấp 2 → Cấp 3 |
| Nghỉ không lương | Cấp 1 → Cấp 2 → Cấp 3 (bắt buộc) |
| Làm thêm giờ (OT) | Trưởng/Phó đơn vị (cấp 2) |
| Công tác / Ra ngoài, Ốm/Thai sản… | Cấp 1 (ghi nhận) |

> Ngưỡng "2 ngày" cấu hình được (Admin chỉnh trong Quản trị).
> Mọi bước duyệt được **lưu vết đầy đủ** phục vụ lập biên bản (Điều 28 NQLĐ).

---

## 7. Phân ca (Tổ trưởng / Trưởng đơn vị / HR / Admin)

Menu **Phân ca**:

1. Lưới tuần × nhân viên. Bấm vào ô (NV × ngày) → chọn ca.
2. Chuyển tuần bằng nút **Tuần trước / Tuần sau**.
3. Hệ thống **cảnh báo** nếu vi phạm: nghỉ chuyển ca **< 12 giờ** (Điều 22) hoặc không đủ **24 giờ** nghỉ tuần liên tục (Điều 23).

---

## 8. Bảng công tháng (mọi NV xem của mình; quản lý/HR xem theo đơn vị)

Menu **Bảng công**:

1. Chọn **Kỳ công** (theo tháng). **Lưu ý:** kỳ chạy từ **ngày 21 tháng trước đến ngày 20 tháng này**.
2. Chọn chế độ xem: **Chi tiết** (lưới từng ngày) hoặc **Tổng hợp** (mỗi NV một dòng).
3. Bấm **Xuất Excel** để tải file.

**Bảng mã ký hiệu (chế độ Chi tiết):**

| Mã | Ý nghĩa |
|---|---|
| **N** | Công ngày (làm ca ngày) |
| **D** | Công đêm (làm ca đêm) |
| **P** | Nghỉ phép năm |
| **R** | Nghỉ việc riêng có lương |
| **Ô** | Nghỉ bệnh (ốm đau / chăm con ốm) |
| **TS** | Nghỉ thai sản / khám thai |
| **KL** | Nghỉ không lương |
| **L** | Ngày lễ / nghỉ theo lịch |
| **0** | Bỏ việc (trễ/sớm/vắng không phép) — không tính công |

**Khoá kỳ (chỉ HR/Admin):** sau khi chốt công, bấm **Khoá kỳ** → các bản ghi không sửa được. Khi cần sửa lại phải **Mở khoá** (bắt buộc nhập lý do, có ghi nhật ký).

---

## 9. Số dư phép (mọi NV xem của mình; HR/Admin quản lý)

Menu **Số dư phép**:

- Xem **Quota / Đã dùng / Còn lại** theo năm + lịch sử các đơn phép đã duyệt.
- Công thức quota: **12/14/16 ngày** (tuỳ điều kiện công việc) **+ 1 ngày mỗi đủ 5 năm thâm niên**. NV chưa đủ 12 tháng → tính theo tỷ lệ.

**HR/Admin — đầu năm:** bấm **Tính quota đầu năm** để hệ thống tính quota cho toàn bộ NV đang làm (giữ nguyên số đã dùng).

---

## 10. Sửa chấm công (HR / Admin)

Menu **Sửa chấm công**:

1. Chọn nhân viên + khoảng ngày → **Tìm**.
2. Bấm **Sửa** một dòng: chỉnh giờ vào/ra và/hoặc trạng thái, **bắt buộc nhập lý do**.
3. **Khoá / Mở khoá** từng bản ghi. Dòng đã khoá phải mở khoá mới sửa được.

> Mọi sửa đổi được ghi **nhật ký** (người, thời điểm, giá trị cũ → mới).
> Đi trễ/về sớm vẫn tính mất công cả ngày kể cả khi sửa giờ.

---

## 11. Cảnh báo kỷ luật (Tổ trưởng / Trưởng đơn vị / BGĐ / HR / Admin)

Menu **Cảnh báo KL**:

- Bảng liệt kê NV chạm ngưỡng **bỏ việc không lý do** (cửa sổ trượt 30 / 365 ngày).
- Mức cảnh báo: **Khiển trách** (3 ngày/30) · **Kéo dài nâng lương** (4 ngày/30) · **Sa thải** (5 ngày/30 **hoặc** 20 ngày/365).
- Bấm **Quét lại cảnh báo** để cập nhật.

> ⚠️ Hệ thống **chỉ cảnh báo sớm**, **không tự ra quyết định kỷ luật** (Điều 33–35 NQLĐ). Quyết định do người có thẩm quyền lập theo quy trình.

---

## 12. Quản trị hệ thống (Admin)

Menu **Quản trị**:

- **Tab Cấu hình:** sửa các tham số (giờ ca, ngưỡng kỷ luật, ngày lễ, mức phép, mốc cắt kỳ công…) ngay trên web → bấm **Lưu**. Không cần vào Apps Script.
- **Tab Nhật ký (AuditLog):** tra cứu mọi thao tác quan trọng, lọc theo ngày / action / mã NV, có phân trang.

---

## 13. Quản lý nhân viên (HR / Admin)

Menu **Nhân viên**:

- Thêm/sửa hồ sơ: mã NV, họ tên, đơn vị, khối, chức danh, điều kiện công việc, **ngày vào làm**, **người quản lý trực tiếp**, vai trò, trạng thái, email.
- **Lưu ý điền đủ:** *ngày vào làm* (để tính phép) và *người quản lý trực tiếp* (để định tuyến duyệt đơn).

---

## 14. Câu hỏi thường gặp

**Không đăng nhập được?**
- Kiểm tra đúng email + mật khẩu (mặc định `123456`). Báo HR đặt lại nếu cần.
- "Phiên đăng nhập hết hạn" → đăng nhập lại (phiên 8 giờ).

**Tạo đơn nhưng không thấy ai duyệt?**
- Hồ sơ của bạn chưa có **người quản lý trực tiếp** → báo HR cập nhật.

**Số dư phép bằng 0?**
- HR chưa **Tính quota đầu năm**, hoặc hồ sơ thiếu **ngày vào làm**.

**Bảng công không đúng ngày trong tháng?**
- Kỳ công theo chu kỳ **21 → 20**, không theo lịch dương. Đây là thiết kế đúng.

**File Excel mở bị lỗi font tiếng Việt?**
- File xuất dạng CSV chuẩn UTF-8. Mở bằng Excel: nếu sai dấu, dùng *Data → From Text/CSV → chọn UTF-8*.

---

*Mọi quy tắc nghiệp vụ trong hệ thống bắt nguồn từ Nội quy lao động (QĐ 44/QĐ-CTCSCC), Bộ luật Lao động 2019 và Luật BHXH 2024.*
