# 06 — Biểu mẫu Bảng công tháng (đầu ra GĐ3)

> Đặc tả định dạng kết xuất bảng công, trích từ file mẫu thực tế `docs/Copy of Chấm công tháng 6.xlsx`.
> Hệ thống (GĐ3, `api/BangCongApi.gs`) phải xuất được biểu mẫu **tương đương** gồm 2 sheet: **CHI TIẾT** và **TỔNG HỢP**.

## Nguyên tắc chung

- **Kỳ công KHÔNG theo tháng dương lịch** mà theo chu kỳ lương: **từ ngày 21 tháng trước đến ngày 20 tháng này**. Mốc cắt kỳ (`ngay_cat_ky_cong = 21`) phải đưa vào **CauHinh**, không hardcode.
- Header pháp lý cố định (đưa vào CauHinh để sửa được):
  - `don_vi_cap1 = "CÔNG TY CỔ PHẦN CHIẾU SÁNG CÔNG CỘNG TP.HCM"`
  - `don_vi_cap2 = "CHIẾU SÁNG KHU VỰC TRUNG TÂM"`
- Chân ký: **Người chấm công** (trái) và **Phó Trưởng đơn vị** (phải) + dòng "Thành phố Hồ Chí Minh, ngày … tháng … năm …".
- Mã ngày trong ô lưới là **ký hiệu quy ước** (bảng dưới), đưa vào CauHinh `ma_cham_cong` để đổi mã mà không sửa code.

## Bảng mã chấm công (ký hiệu trong ô lưới — sheet CHI TIẾT)

| Mã | Ý nghĩa | Suy ra từ |
|----|---------|-----------|
| `N` | Công ngày (làm ca ngày) | ChamCong DU_CONG, ca không `banDem` |
| `D` | Công đêm (làm ca đêm) | ChamCong DU_CONG, ca `banDem=true` |
| `P` | Nghỉ phép năm | DonTu loaiDon='Phép năm', Đã duyệt |
| `R` | Nghỉ việc riêng có hưởng lương | DonTu loaiDon='Việc riêng', Đã duyệt |
| `Ô` | Nghỉ bệnh (ốm đau) | DonTu loaiDon='Ốm đau'/'Chăm con ốm', Đã duyệt |
| `TS` | Nghỉ thai sản | DonTu loaiDon='Thai sản nữ'/'Thai sản nam'/'Khám thai' |
| `KL` | Nghỉ không lương | DonTu loaiDon='Không lương', Đã duyệt |
| `L` | Ngày nghỉ/lễ theo lịch | Lịch lễ (`ngay_le_tet`) hoặc ngày nghỉ tuần |
| (trống) | Ngày nghỉ tuần không công | Không phân ca / Chủ nhật |

> Các mã bỏ việc (TRE/SOM/MAT_CONG/VANG_KHONG_PHEP) → cần một mã riêng (đề xuất `0` hoặc `KP`) và **không** tính vào công ngày. Quy ước cuối cùng chốt trong CauHinh.

## Sheet 1 — CHI TIẾT (tham chiếu `CT5`)

Tiêu đề: `BẢNG CHI TIẾT CHẤM CÔNG THÁNG MM NĂM YYYY`.

Cột cố định: `STT | Mã NV | Mã đơn vị | Họ và tên`, rồi **một cột cho mỗi ngày** của kỳ (21→20), header 2 dòng: số ngày + thứ trong tuần.

Cột tổng kết bên phải (mỗi NV):

| Nhóm | Cột |
|------|-----|
| Công | Công ngày · Công đêm |
| Ngày nghỉ | Nghỉ phép (P) · Việc riêng (R) · Nghỉ bệnh (Ô) · Thai sản (TS) · Không lương (KL) |
| Làm thêm giờ (OT) | Ngày thường (Ngày/Đêm) · Ngày nghỉ tuần (Ngày/Đêm) · Ngày Lễ-Tết (Ngày/Đêm) |
| OT | Cộng làm thêm giờ · Trạng thái giờ làm thêm |

Mỗi NV có thể chiếm **2 dòng**: dòng chính (mã ngày + tổng), dòng phụ (chi tiết OT từng ngày, vd `2hnt` = 2 giờ ngày thường). Bản hệ thống có thể gộp 1 dòng nếu không cần ghi chú OT theo ngày — nhưng giữ đủ cột tổng.

## Sheet 2 — TỔNG HỢP (tham chiếu `CC5`)

Tiêu đề: `BẢNG TỔNG HỢP CHẤM CÔNG THÁNG MM NĂM YYYY`. Mỗi NV **1 dòng**.

| Cột | Nguồn dữ liệu |
|-----|---------------|
| Stt, Mã NV, Mã đơn vị, Họ và tên | NhanVien |
| Hệ số vị trí, Điểm đánh giá, Mức M | NhanVien (trường mở rộng — xem dưới) |
| Công chế độ | Số ngày công chuẩn của kỳ (CauHinh hoặc đếm ngày làm việc trong kỳ) |
| Công ngày / Công đêm | Tổng từ CHI TIẾT |
| Giờ làm thêm: Ngày thường / Nghỉ tuần / Lễ-Tết (× Ngày/Đêm) | Tổng OT đã duyệt, phân loại theo ngày |
| Nghỉ: P / R / Ô / TS / KL | Tổng từ CHI TIẾT |

## Khoảng cách với mô hình dữ liệu hiện tại (cần bổ sung ở GĐ3)

1. **NhanVien thiếu trường**: `maDonVi` (vd `23TT`), `heSoViTri`, `diemDanhGia`, `mucM`. → Thêm cột (migration), hoặc để trống/cấu hình nếu chưa quản lý lương.
2. **OT phân loại Ngày thường/Nghỉ tuần/Lễ-Tết × Ngày/Đêm**: DonTu loại OT cần trường phân loại ngày, hoặc suy ra từ ngày OT so với lịch lễ + ngày nghỉ tuần + `ca.banDem`. → Bổ sung khi làm GĐ3.
3. **Công đêm**: suy từ `ca.banDem` của bản ghi ChamCong/LichTruc.
4. **Mốc cắt kỳ 21→20**: thêm CauHinh `ngay_cat_ky_cong`; hàm `layBangCongThang` nhận tham số kỳ và tính khoảng ngày tương ứng (không dùng ngày 1→cuối tháng).

## Kết xuất kỹ thuật (Apps Script)

- Tạo Spreadsheet tạm bằng `SpreadsheetApp.create()` hoặc dùng template có sẵn (copy file mẫu), ghi 2 sheet, rồi xuất `.xlsx` qua `DriveApp`/export URL; HOẶC xuất **CSV/HTML** đơn giản nếu chỉ cần dữ liệu.
- Giữ định dạng merge header + chân ký nếu xuất `.xlsx` từ template (khuyến nghị: clone file mẫu rồi đổ dữ liệu vào vùng từ dòng 12).
- File mẫu để tham chiếu định dạng: `docs/Copy of Chấm công tháng 6.xlsx` (2 sheet: `CT5` chi tiết, `CC5` tổng hợp).
