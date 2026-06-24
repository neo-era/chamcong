# 10 — Chấm công đa ca & cảnh báo trần giờ

> Mở rộng luồng chấm công để gánh **chuyển ca / nhiều ca trong ngày**, **ca đêm vắt qua nửa đêm**, và **cảnh báo thời gian làm việc**. (ĐÃ code 2026-06-24)

## Vấn đề trước đây

- Model cũ: **1 bản ghi ChamCong / (maNV, ngày)** → chỉ chấm được 1 ca/ngày.
- Ca đêm chấm vào 22:00 hôm nay, chấm ra 06:00 hôm sau → `apiChamRa` tìm bản ghi theo `todayStr()` (ngày hôm sau) nên **không thấy** → kẹt.
- Không cảnh báo gì khi tổng giờ làm vượt quy định.

## Thiết kế hiện tại

### Khóa bản ghi: `(maNV, ngày, maCa)`

- Mỗi ca = 1 bản ghi riêng → đa ca/ngày không giới hạn.
- `genMaCC(maNV, ngày, maCa)` → `CC_<maNV>_<yyyyMMdd>_<maCa>`.
- Hàm dữ liệu mới:
  - `getChamCongNgayList(maNV, ngày)` — tất cả bản ghi trong ngày.
  - `getChamCongNgayCa(maNV, ngày, maCa)` — bản ghi 1 ca cụ thể.
  - `getChamCongMoDang(maNV)` — **bản ghi đang mở** (đã `gioVao`, chưa `gioRa`) mới nhất, **không phụ thuộc ngày lịch**.
  - `getLichTrucNgayList(maNV, ngày)` — mảng ca được phân trong ngày.

### Chấm vào (`apiChamVao`, body `{maCa?, toaDo?}`)

1. Nếu còn **ca đang mở** (kể cả ca đêm hôm qua) → **chặn**, bắt chấm ra ca đó trước.
2. Xác định ca: ưu tiên `maCa` client gửi; nếu trống → suy từ lịch trực hôm nay (1 ca → tự chọn; nhiều ca → yêu cầu chọn; không có lịch → ca mặc định).
3. Nếu đã chấm vào đúng ca đó trong ngày → chặn (không cho chấm trùng).
4. Lưu bản ghi mới với `maCa` tương ứng.

### Chấm ra (`apiChamRa`, body `{toaDo?}`)

1. Lấy **bản ghi đang mở** gần nhất (`getChamCongMoDang`) → fix ca đêm qua nửa đêm.
2. Tính trạng thái + `soGioCong` theo ca của chính bản ghi đó.
3. Trả thêm mảng `canhBao` (xem dưới).

### Thông tin hôm nay (`apiGetChamCongHomNay`)

Trả về: `{ ngay, caList (ca phân hôm nay), records (đa ca đã chấm), moDang (ca đang mở), tatCaCa (toàn bộ ca để chọn khi tăng cường) }`.

## Cảnh báo trần giờ (chỉ cảnh báo — KHÔNG chặn)

Tính tại thời điểm **chấm ra**, trả qua `data.canhBao` (mảng chuỗi). Ngưỡng đọc từ `CauHinh`:

| Tiêu chí | Config | Mặc định | Logic |
|---|---|---|---|
| Tổng giờ/ngày | `gio_toi_da_ngay` | 12 | Cộng `soGioCong` mọi ca trong ngày; vượt → cảnh báo (`kiemTraTranGioNgay`). |
| Nghỉ tuần | `nghi_tuan_toi_thieu_gio` | 24 | Khoảng nghỉ liên tục **dài nhất** trong 7 ngày gần nhất < ngưỡng → cảnh báo (`khoangNghiLienTucMax`). |

> Hai tiêu chí KHÔNG làm (theo yêu cầu, để dành thêm sau nếu cần): "vượt giờ chuẩn ca → OT" và "nghỉ chuyển ca <12h".

## Frontend (`chamcong.html` + `chamcong.js`)

- Hiển thị rõ ca: tên ca + giờ BĐ–KT + badge 🌙 nếu ca đêm.
- Có **ca đang mở** → hiện khối "Đang trong ca …" + nút **CHẤM CÔNG RA** (ghi rõ nếu ca đêm từ hôm trước).
- Chưa có ca mở → **chọn ca** (dropdown nếu nhiều ca, ca đã chấm bị disable) + nút **CHẤM CÔNG VÀO**.
- Bảng "Ca đã chấm hôm nay" liệt kê từng ca (vào/ra/giờ công/trạng thái).
- Banner ⚠ vàng hiển thị các cảnh báo trần giờ sau khi chấm ra.

## Xác minh vị trí GPS (địa bàn làm việc)

Khi chấm công **kèm toạ độ GPS hiện trường**, hệ thống đổi toạ độ → địa chỉ (reverse geocoding) để **hiển thị đường/phường** và **kiểm tra có nằm trong địa bàn không**.

- **Dịch vụ:** Nominatim (OpenStreetMap), gọi từ backend (`reverseGeocode` trong `GeoData.gs`), cache 6h theo toạ độ làm tròn ~11m (tránh vượt rate-limit khi nhiều người chấm cùng lúc).
- **Kiểm tra địa bàn:** `kiemTraDiaBan(addr, cfg)` (thuần, `GeoRules.gs`) đối chiếu địa chỉ với cấu hình:
  - `dia_ban_cho_phep` (CauHinh, JSON): `{quan:[...], khuVuc:[...], loaiTru:[...]}`.
  - Mặc định: Quận 1,3,5,8,10,11, Phú Nhuận, Bình Thạnh + khu Bến Cát, **trừ** Văn Thố, Bàu Bàng.
  - Khớp số quận theo token riêng (Q12 không nhầm Q1); khớp tên theo chứa chuỗi (bỏ dấu); loại trừ ưu tiên trước.
- **Hành xử:**
  - Trong địa bàn → ghi nhận, lưu địa chỉ vào cột `diaChi` (ChamCong).
  - Ngoài địa bàn (xác minh được) → **chặn**, báo "Ngoài khu vực làm việc".
  - Không xác minh được (toạ độ sai / dịch vụ lỗi) → **fail-open**: vẫn cho chấm + cảnh báo + ghi log để HR rà soát.
  - Chỉ áp dụng **khi có kèm GPS**; chấm "Trụ sở" (không GPS) không kiểm tra.
- **Bật/tắt & tinh chỉnh:** `kiem_tra_dia_ban` (TRUE/khác), `dia_ban_cho_phep` (JSON), `geocode_email` — đều trong CauHinh, sửa qua trang Quản trị. Vì dữ liệu hành chính 2025 đổi nhiều, nên **test với toạ độ thật rồi chỉnh danh sách** cho khớp.
- **Frontend:** bật GPS → gọi `kiemTraViTri` hiển thị 📍 địa chỉ + trạng thái (xanh: trong địa bàn / đỏ: ngoài → khoá nút chấm / vàng: chưa xác minh được). Backend luôn kiểm tra lại (không tin client).

## Định dạng giờ lưu (gioVao/gioRa)

- Lưu theo **giờ Việt Nam có offset** `+07:00`, vd `2026-06-22T09:33:08+07:00` (hàm `toIsoVN(d)` trong SheetHelper). VN không có DST → `+07:00` luôn đúng.
- Dễ đọc trực tiếp trên Sheet (đúng giờ thực), không nhập nhằng, `new Date()` parse đúng instant.
- Bản ghi cũ lưu UTC (`...Z`) vẫn parse/hiển thị đúng → không cần migrate.
- **Toàn hệ thống** đã thống nhất lưu giờ VN qua `toIsoVN`: chấm công (gioVao/gioRa), AuditLog, BuocDuyet (lưu vết duyệt), ThongBao, KyLuat (cảnh báo), BangCong (thoiDiemKhoa), DonTu (ngayTao).
- *Lưu ý chuyển tiếp:* trong thời gian sheet còn trộn bản ghi cũ (`...Z`) và mới (`+07:00`), vài danh sách sắp xếp theo chuỗi thời điểm có thể lệch thứ tự nhẹ ở mốc giao thời — tự hết khi bản ghi mới tích lũy.

## Tương thích ngược

- Cột `maCa` đã có sẵn trong sheet ChamCong → không cần migration cấu trúc.
- Bản ghi cũ (1 ca/ngày, `maCC` không có hậu tố ca) vẫn đọc/sửa bình thường qua `maCC`.
- `getChamCongNgay` (cũ, trả 1 bản ghi) giữ nguyên cho `apiSuaChamCong` (HR sửa theo maNV+ngày).
