# 08 — Duyệt đơn tuần tự 3 cấp cho MỌI loại đơn (spec đã chốt)

> Trạng thái: ⏳ ĐÃ CHỐT THIẾT KẾ — CHƯA CODE.
> Thay đổi định tuyến duyệt: **mọi loại đơn** đều duyệt tuần tự **Cấp 1 → Cấp 2 → Cấp 3**.

## Quyết định nghiệp vụ

1. **Mọi loại đơn** (Phép năm, Việc riêng, Không lương, OT, Công tác, Ra ngoài, Ốm đau,
   Chăm con ốm, Thai sản, TNLĐ-BNN, Khám thai) → đều qua **đủ 3 cấp** theo trình tự:

   | Cấp | Người duyệt |
   |-----|-------------|
   | 1 | **Tổ trưởng** (`ToTruong`) — = `quanLyTrucTiep` của NV |
   | 2 | **Trưởng đơn vị** (`TruongDonVi`) — của đơn vị NV |
   | 3 | **BGĐ hoặc Admin** (`BGD` ≡ `Admin`, ai cũng duyệt được) |

2. **Bỏ định tuyến theo loại đơn + ngưỡng ngày** (không còn đơn 1 cấp / 2 cấp). Tham số
   `nguong_duyet_cap_cao` không còn dùng cho định tuyến (giữ trong CauHinh nhưng vô hiệu, hoặc xoá).

3. **Cấp 3 = BGĐ ≡ Admin**: `QUYEN_MAP.DUYET_CAP3 = ['BGD','Admin']` (đã đúng, không đổi).
   `_canApprove`: BGĐ và Admin duyệt được mọi cấp (đã đúng).

## Phạm vi code (khi triển khai)

- `rules/DuyetRules.gs`:
  - `capDuyetYeuCau(loaiDon, soNgay, nguong)` → **luôn trả** `['DUYET_CAP1','DUYET_CAP2','DUYET_CAP3']`
    cho mọi loại đơn (bỏ switch theo loại + ngưỡng). Giữ chữ ký hàm để không vỡ chỗ gọi.
  - `tinhTrangThaiSauBuoc`, `quyenChoCap`, `tinhSoNgay` — giữ nguyên.
- `rules/QuyenRules.gs`: giữ nguyên (DUYET_CAP1/2/3 đã phủ đúng vai trò).
- `api/DonTuApi.gs`: không đổi logic (đã đọc capDuyetYeuCau + định tuyến người duyệt theo cấp).
- Test cập nhật (P1.N): mọi loại đơn → capToiDa = 3.

## Lưu ý vận hành (dữ liệu)

- Mỗi NV phải có **`quanLyTrucTiep`** trỏ tới Tổ trưởng (cấp 1) — đã thiết lập.
- Mỗi đơn vị phải có **Trưởng đơn vị** (cấp 2).
- Phải có ít nhất 1 **BGĐ hoặc Admin** (cấp 3) — đã có.
- ⚠️ Nếu `quanLyTrucTiep` của NV CHÍNH LÀ Trưởng đơn vị → cấp 1 và cấp 2 trùng người
  (người đó duyệt 2 lần). Nên gán Tổ trưởng làm `quanLyTrucTiep` để 3 cấp là 3 người khác nhau.
- ⚠️ Mọi đơn (kể cả ra ngoài 1 giờ, ốm, công tác) đều cần đủ 3 cấp duyệt — tăng số bước.
  Nếu sau này muốn rút gọn vài loại đơn, chỉnh lại `capDuyetYeuCau`.
