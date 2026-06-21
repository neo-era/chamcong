# 07 — Chấm công khối Trực tiếp tính theo giờ (spec đã chốt)

> Bổ sung quy tắc: khối **Trực tiếp** chấm công **theo giờ thực làm trong ca**, thay vì
> quy tắc "mất công cả ngày" (Điều 7.3) vốn chỉ áp cho khối **Gián tiếp**.
> Trạng thái: ⏳ ĐÃ CHỐT THIẾT KẾ — CHƯA CODE.

## Quyết định nghiệp vụ

1. **Phân biệt theo Khối của NV** (`NhanVien.khoi`):
   - `Gián tiếp` → giữ nguyên Điều 7.3: đi trễ / về sớm = **mất công cả ngày** (`TRE`/`SOM`), tính vào kỷ luật.
   - `Trực tiếp` → tính **theo giờ**: đi trễ / về sớm chỉ **trừ số giờ thiếu**, trạng thái vẫn `DU_CONG`.

2. **Trực tiếp trễ/sớm KHÔNG tính kỷ luật** (Điều 33–35): chỉ giảm `soGioCong`.
   `laBoViec()` tự động = false vì trạng thái là `DU_CONG`.

3. **Vắng cả ca** (không chấm gì) → vẫn là `VANG_KHONG_PHEP` / `MAT_CONG` và **vẫn tính kỷ luật**
   cho cả hai khối (vắng cả ca khác với đi trễ).

## Cách tính giờ công (khối trực tiếp)

- `soGioCong = giờ ra − giờ vào`.
- **Nghỉ giữa ca tính vào giờ làm** (NQLĐ: ca liên tục ≥6h tính nghỉ vào giờ làm) → **không trừ**.
- Làm tròn **xuống bội số 0.5 giờ**.
- **Không** dùng ân hạn (grace) — tính giờ thực.
- Chưa chấm ra → `soGioCong = 0` (chờ).

## Hiển thị bảng công

- Ô lưới ngày (khối trực tiếp): **Mã + số giờ**, vd `N·8`, `D·7.5` (N=công ngày, D=công đêm).
- Khối gián tiếp giữ nguyên mã `N`/`D` (không kèm giờ).
- Cột tổng hợp: thêm/điều chỉnh để cộng **tổng giờ công** cho khối trực tiếp.

## Phạm vi code (khi triển khai)

- `rules/ChamCongRules.gs`:
  - `tinhTrangThaiCong(gioVaoISO, gioRaISO, ca, graceMinutes, theoGio)` — thêm tham số `theoGio`.
    - `theoGio=true`: có chấm vào → `DU_CONG`; không → `MAT_CONG`. Không trả `TRE`/`SOM`.
  - `tinhSoGioLam(trangThai, gioVaoISO, gioRaISO, ca, theoGio)` — `theoGio=true` → trả giờ thực
    (không trả 0 khi trễ/sớm).
- `api/ChamCongApi.gs`: suy `theoGio = (getNVByMa(user.maNV).khoi === 'Trực tiếp')`; truyền vào rules;
  lưu `soGioCong` vào sheet ChamCong (thêm cột, migration an toàn).
- `rules/BangCongRules.gs`: `maNgay` trả kèm số giờ cho khối trực tiếp; `tongHopNV` cộng tổng giờ.
- `data/ChamCongData.gs`: thêm cột `soGioCong` (ensure cột giống `isLocked`).
- Test (Node + Editor): trễ 1h ca 8h → trực tiếp `soGioCong=7`, `DU_CONG`, `laBoViec=false`;
  gián tiếp cùng tình huống → `TRE`, `soGioCong=0`, `laBoViec=true`.

## Lưu ý

- Cần migration: thêm cột `soGioCong` vào sheet `ChamCong`.
- Backend đổi → phải tạo deployment version mới sau khi code.
