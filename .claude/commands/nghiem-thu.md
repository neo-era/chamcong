# /nghiem-thu — Checklist nghiệm thu từng giai đoạn

Dự án **Chấm công CSCC** — kiểm tra nghiệm thu.

## Nghiệm thu GĐ1

Chạy từng kiểm thử dưới đây. Đánh dấu ✓ khi pass.

### Backend

- [ ] `setupGD1()` tạo đủ 6 sheet: NhanVien, Ca, LichTruc, ChamCong, CauHinh, AuditLog
- [ ] Sheet CauHinh có đủ 13 key mặc định (grace_minutes, luong_toi_thieu_vung…)
- [ ] Sheet Ca có 4 ca mặc định: CA_HC, CA_DEM, CA_SANG, CA_CHIEU
- [ ] `tinhTrangThaiCong` trả DU_CONG khi vào đúng giờ
- [ ] `tinhTrangThaiCong` trả TRE khi trễ 1 phút (Điều 7.3 — mất công cả ngày)
- [ ] `tinhTrangThaiCong` trả SOM khi về sớm 1 phút (Điều 7.3)
- [ ] `kiemTraNghiChuyenCa` cảnh báo khi khoảng cách < 12h (Điều 22)
- [ ] `kiemTraNghiTuan` cảnh báo khi nghỉ liên tục < 24h (Điều 23)
- [ ] `chamVao` lấy giờ từ `new Date()` máy chủ, không tin client
- [ ] `chamVao` lần 2 → lỗi "Đã chấm công vào"
- [ ] `chamRa` không có `chamVao` → lỗi "Chưa chấm công vào"
- [ ] `suaChamCong` không có `lyDo` → lỗi "Phải nhập lý do"
- [ ] `suaChamCong` có `lyDo` → ghi AuditLog (kiểm tra sheet AuditLog)
- [ ] NV vai trò `NV` không gọi được `createNhanVien` → lỗi "Không có quyền"
- [ ] HR gọi được `createNhanVien` thành công

### Frontend

- [ ] `index.html` hiển thị nút đăng nhập Google
- [ ] Sau đăng nhập → redirect về `chamcong.html`
- [ ] `chamcong.html` hiển thị ca hôm nay và trạng thái chấm công
- [ ] Nút "CHẤM CÔNG VÀO" disabled sau khi đã chấm vào
- [ ] Nút "CHẤM CÔNG RA" disabled trước khi chấm vào
- [ ] Khi đi trễ → hiện cảnh báo đỏ "Đi trễ — mất công ngày này (Điều 7.3 NQLĐ)"
- [ ] GPS toggle hoạt động trên mobile (điện thoại có GPS)
- [ ] `nhanvien.html` chỉ hiển thị cho HR/Admin
- [ ] Form tạo NV validation: maNV + email bắt buộc
- [ ] `phanca.html` grid tuần × NV hiển thị đúng
- [ ] Click ô → chọn ca → Lưu → ô hiện tên ca
- [ ] Khi phân ca gây nghỉ chuyển ca < 12h → hiện cảnh báo vàng
- [ ] Đăng xuất → redirect về `index.html`

## Nghiệm thu GĐ2

- [ ] Tạo đơn phép năm ≤ 2 ngày → luồng Cấp 1 → Cấp 2
- [ ] Tạo đơn phép > `nguong_duyet_cap_cao` ngày → luồng Cấp 1 → 2 → 3
- [ ] Tạo đơn Không lương → bắt buộc duyệt Cấp 3
- [ ] Từng bước duyệt ghi 1 bản ghi BuocDuyet (nguoiDuyet, ketQua, yKien, thoiDiem)
- [ ] Thu hồi đơn đã duyệt cuối → không cho phép
- [ ] OT kiểm tra trần 40h/tháng (đọc từ CauHinh)

## Nhiệm vụ

$ARGUMENTS

Chạy kiểm thử tương ứng với giai đoạn được chỉ định trong argument (gd1 / gd2 / gd3 / gd4).
Báo cáo kết quả dạng bảng: | Kiểm thử | Kết quả | Ghi chú |
