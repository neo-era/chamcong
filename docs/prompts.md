# Bộ Prompt Thực Thi — Hệ thống Chấm công CSCC

> **Cách dùng:** Mỗi prompt dưới đây là một "đơn vị công việc" hoàn chỉnh. Paste **KHỐI NGỮ CẢNH CHUNG** (mục 0) một lần đầu phiên, rồi paste tiếp prompt của bước đang làm. Làm tuần tự từ trên xuống. Sau mỗi phase chạy prompt nghiệm thu tương ứng trước khi sang phase sau.
>
> **Quy ước:** Mọi hằng số pháp lý đọc từ sheet `CauHinh` qua `getConfig`/`getConfigNumber` — KHÔNG hardcode. Mọi thao tác ghi/sửa chấm công, duyệt đơn, khoá/mở kỳ công đều gọi `appendLog`. Timestamp lấy từ `new Date()` phía Apps Script. Tên hàm camelCase tiếng Anh; giao diện 100% tiếng Việt.

---

## TRẠNG THÁI DỰ ÁN (cập nhật)

| Giai đoạn | Phạm vi | Trạng thái |
|-----------|---------|-----------|
| **GĐ1** | Nhân sự + Ca + Chấm công | ✅ Hoàn chỉnh. Đã bổ sung (P0): khoá/mở khoá bản ghi chấm công + trang `sua-cham-cong.html` cho HR/Admin. |
| **GĐ2** | Đơn từ + Quy trình duyệt | ✅ Hoàn chỉnh (P1). Đơn từ 12 loại, duyệt 1–3 cấp, lưu vết BuocDuyet, email thông báo. Hook trừ phép chờ GĐ3. |
| **GĐ3** | Quản lý phép + Bảng công tháng | ✅ Hoàn chỉnh (P2). Quota phép + trừ/hoàn phép (nối GĐ2), bảng công kỳ 21→20 (chi tiết/tổng hợp), khoá kỳ, xuất CSV. |
| **GĐ4** | Cảnh báo kỷ luật + Quản trị | ✅ Hoàn chỉnh (P3). Cửa sổ trượt 30/365, quét cảnh báo + trigger, trang Cảnh báo KL + Quản trị (sửa CauHinh, xem AuditLog). |
| **BS** | Chấm công khối Trực tiếp theo giờ | ✅ Hoàn chỉnh (docs/07). Trực tiếp: trễ/sớm chỉ trừ giờ, không kỷ luật; cột soGioCong; bảng công "N·8" + Tổng giờ. |
| **BS2** | Duyệt mọi đơn đủ 3 cấp (1→2→3) | ✅ Hoàn chỉnh (docs/08). Mọi loại đơn: Tổ trưởng → Trưởng đơn vị → BGĐ/Admin. |
| **NC** | Nâng cao & tuân thủ (NC-A..J) | ✅ Hoàn chỉnh. Đổi MK lần đầu, khoá login, trần OT, định mức việc riêng, thông báo (chuông), dashboard, tối ưu (cache), PWA, đính kèm file, biên bản kỷ luật. |

Thứ tự thực thi đề nghị: **P0 → P1 → P2 → P3 → P4** (mỗi P = một phase bên dưới). **PHASE BS** làm sau cùng (bổ sung).

---

## 0. KHỐI NGỮ CẢNH CHUNG (paste 1 lần đầu mỗi phiên)

```
Tôi đang phát triển hệ thống Chấm công CSCC (đơn vị Chiếu sáng khu vực Trung tâm).
Nguồn chân lý: thư mục docs/ (00-srs, 01-business-rules, 02-data-model, 03-approval-workflow,
04-compliance-matrix, 05-legal-insurance). Mọi quy tắc bắt nguồn từ Nội quy lao động
(QĐ 44/QĐ-CTCSCC) + BLLĐ 2019 + Luật BHXH 2024.

STACK:
- Backend: Google Apps Script Web App (thư mục backend/), DB là Google Sheets.
- Frontend: HTML thuần + Alpine.js (CDN) + CSS tự viết (web/), host GitHub Pages.
- Auth: email + mật khẩu (hash SHA-256 trong sheet NhanVien). Backend tạo HMAC session
  token 8h ký bằng Script Property SESSION_SECRET. action='login' không cần token;
  mọi action khác cần token.

KIẾN TRÚC TẦNG (BẮT BUỘC giữ nguyên):
  Code.gs (doGet/doPost dispatcher)
    → api/   (validate input, gọi rules + data; ném throw new Error(msg) khi lỗi)
      → rules/ (logic THUẦN — KHÔNG truy cập Sheets, KHÔNG import data/)
      → data/  (truy cập Sheets qua SheetHelper)
  api/ KHÔNG gọi Sheets trực tiếp. rules/ KHÔNG gọi data/.

QUY ƯỚC GIAO TIẾP:
- POST: Content-Type 'text/plain;charset=utf-8'; body = JSON.stringify({action, token, ...data}).
  KHÔNG dùng application/json (tránh preflight CORS).
- GET: token đặt trong query string.
- Frontend: token lưu sessionStorage key 'cc_token', user lưu 'cc_user'.
  Dùng helper có sẵn: web/js/api.js (apiGet, apiPost, Api), web/js/auth.js (login, getToken,
  requireLogin, renderHeader). Alpine x-data function camelCase.

QUY TẮC TUYỆT ĐỐI:
1. Mọi hằng số (giờ ca, ngưỡng kỷ luật, định mức nghỉ, ngưỡng duyệt cấp cao) đọc từ sheet
   CauHinh qua getConfig(key)/getConfigNumber(key, fallback). KHÔNG hardcode số.
2. Timestamp chấm công = new Date() phía server. Không tin client.
3. Gọi appendLog(maNV, email, action, doiTuong, chiTiet) sau MỌI thao tác ghi/sửa chấm công,
   duyệt đơn, khoá/mở kỳ công, sửa cấu hình.
4. Phân quyền: chỉ qua backend/rules/QuyenRules.gs — QUYEN_MAP là nguồn chân lý duy nhất.
   Dùng requireQuyen(user, quyen) ở tầng api/.
5. Trạng thái chấm công: DU_CONG/TRE/SOM/MAT_CONG/VANG_PHEP/VANG_KHONG_PHEP.
   TRE và SOM đều tính "bỏ việc cả ngày" (Điều 7.3) — kiểm tra bằng laBoViec(trangThai).
6. Tên sheet đúng docs/02: NhanVien, Ca, LichTruc, ChamCong, CauHinh, AuditLog,
   DonTu, BuocDuyet, SoDuPhep, CanhBaoKyLuat (+ BangCong cho GĐ3).

CODE ĐÃ CÓ (tái sử dụng, KHÔNG viết lại):
- data/SheetHelper.gs: getSheet, getOrCreateSheet, sheetToObjects, findRow, appendRow,
  updateRow, toDateStr, todayStr, setupGD1.
- data/CauHinhData.gs: getConfig, getConfigNumber, getAllConfig, setConfig.
- data/AuditLogData.gs: appendLog.
- data/NhanVienData.gs: getNVByEmail, getNVByMa, listNV, tinhThamNien, ...
- data/ChamCongData.gs: getChamCongNgay, getChamCongKhoang, getChamCongDonVi, saveChamCong, ...
- rules/QuyenRules.gs: VAI_TRO, QUYEN_MAP, hasQuyen, requireQuyen, canViewNV.
- rules/ChamCongRules.gs: TRANG_THAI_CC, tinhTrangThaiCong, laBoViec, labelTrangThai, tinhSoGioLam.
- rules/CaRules.gs: kiemTraNghiChuyenCa, kiemTraNghiTuan, kiemTraLichTuan.

Nhiệm vụ cụ thể sẽ nêu trong prompt tiếp theo. Trước khi code, đọc các file liên quan để
khớp đúng pattern. Sau khi code, liệt kê route mới cần thêm vào Code.gs và key CauHinh mới cần seed.
```

---

# PHASE 0 — Hoàn thiện GĐ1 (bịt 2 lỗ hổng)

## P0.1 — Khoá/mở khoá chấm công ngày + UI sửa chấm công cho HR

```
[GĐ1] Hoàn thiện 2 chức năng còn thiếu của Giai đoạn 1.

A. KHOÁ/MỞ KHOÁ BẢN GHI CHẤM CÔNG NGÀY
- Thêm cột `isLocked` (bool) vào sheet ChamCong nếu chưa có (viết hàm migration
  ensureChamCongCols() trong data/ChamCongData.gs, gọi an toàn nhiều lần).
- backend/api/ChamCongApi.gs: thêm
    apiKhoaChamCong(user, body)   — body {maCC} hoặc {maNV, ngay}; requireQuyen KHOA_BANG_CONG;
                                     set isLocked=true; appendLog.
    apiMoKhoaChamCong(user, body) — yêu cầu lyDo; requireQuyen KHOA_BANG_CONG; set isLocked=false;
                                     appendLog(chiTiet kèm lyDo).
- apiSuaChamCong: nếu bản ghi isLocked=true → throw 'Bản ghi đã khoá, phải mở khoá trước khi sửa'.
- Code.gs: thêm route POST 'khoaChamCong', 'moKhoaChamCong'.

B. UI SỬA CHẤM CÔNG (HR/Admin)
- Trang mới web/sua-cham-cong.html + web/js/suachamcong.js:
  * Guard quyền SUA_CHAM_CONG (redirect chamcong.html nếu không đủ quyền).
  * Chọn NV + khoảng ngày → bảng chấm công (gọi Api tương ứng getChamCongKhoang).
  * Mỗi dòng: sửa gioVao/gioRa/trangThai + ô lyDo (bắt buộc) → gọi suaChamCong.
  * Nút khoá/mở khoá từng dòng; dòng đã khoá hiện badge "Đã khoá" và disable sửa.
  * Hiển thị trạng thái bằng nhãn tiếng Việt (labelTrangThai), badge màu như chamcong.js.
- web/js/api.js: thêm shorthand cho các action mới.
- web/js/auth.js renderHeader: thêm link "Sửa chấm công" cho HR/Admin.

Ràng buộc: TRE/SOM vẫn phải tính mất công cả ngày khi HR đổi giờ (gọi lại tinhTrangThaiCong
nếu HR chỉ sửa giờ mà không chỉ định trangThai). Mọi sửa đổi ghi AuditLog kèm giá trị cũ→mới.
```

---

# PHASE 1 — GĐ2: Đơn từ & Quy trình duyệt nhiều cấp

> Đọc trước: `docs/02-data-model.md` (DonTu, BuocDuyet), `docs/03-approval-workflow.md`.
> Loại đơn: `Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài / Ốm đau / Chăm con ốm / Thai sản nữ / Thai sản nam / TNLĐ-BNN / Khám thai`.
> `donViTinh`: `Ngày` | `Nửa ngày`. `nguonChiTra`: `Công ty` | `BHXH` | `Không lương`.

## P1.1 — Backend: data + rules định tuyến duyệt

```
[GĐ2] Backend tầng data + rules cho Đơn từ & Duyệt.

1. data/DonTuData.gs — sheet DonTu (cột theo docs/02: maDon, maNV, loaiDon, donViTinh,
   nguonChiTra, tuNgay, denNgay, soNgay, lyDo, dinhKem, trangThai, ngayTao):
   - genMaDon(maNV)              → 'DON_NV001_20260621_xx'
   - createDon(don)             → ghi 1 dòng, trangThai mặc định 'Chờ duyệt'
   - getDonByMa(maDon)
   - listDonCuaNV(maNV, filters) → đơn của 1 NV (filter loaiDon/trangThai/khoảng ngày)
   - listDonChoDuyet()          → tất cả đơn trangThai 'Chờ duyệt' hoặc 'Bổ sung'
   - updateDon(maDon, updates)

2. data/BuocDuyetData.gs — sheet BuocDuyet (maBuoc, maDon, capDuyet, nguoiDuyet, ketQua,
   yKien, thoiDiem):
   - genMaBuoc(maDon, cap)
   - themBuocDuyet(buoc)        → thoiDiem = new Date()
   - getBuocDuyetCuaDon(maDon)  → mảng các bước, sort theo capDuyet/thoiDiem

3. rules/DuyetRules.gs — logic THUẦN, không truy cập Sheets:
   - LOAI_DON (hằng), TRANG_THAI_DON (Chờ duyệt/Đã duyệt/Từ chối/Bổ sung/Thu hồi)
   - capDuyetYeuCau(loaiDon, soNgay, nguongDuyetCapCao) → trả số cấp tối đa cần duyệt:
       Phép năm/Việc riêng: soNgay <= nguong → 2 cấp; > nguong → 3 cấp
       Không lương: luôn 3 cấp
       OT: 1 cấp nhưng do Cấp 2 (Trưởng/Phó đơn vị) duyệt — đánh dấu duyetBoiCap2=true
       Công tác/Ra ngoài: 1 cấp
       Ốm/Chăm con ốm/Thai sản/TNLĐ/Khám thai: 1 cấp (Cấp 1) — chủ yếu ghi nhận + lưu chứng từ
   - quyenChoCap(capDuyet) → trả quyền cần có: 1→DUYET_CAP1, 2→DUYET_CAP2, 3→DUYET_CAP3
   - tinhTrangThaiSauBuoc(capHienTai, capToiDa, ketQua) →
       ketQua 'Từ chối' → 'Từ chối' (kết thúc)
       ketQua 'Yêu cầu bổ sung' → 'Bổ sung'
       ketQua 'Duyệt' & capHienTai < capToiDa → vẫn 'Chờ duyệt' (chuyển cấp kế)
       ketQua 'Duyệt' & capHienTai == capToiDa → 'Đã duyệt'
   - tinhSoNgay(tuNgay, denNgay, donViTinh, danhSachNgayLe) → số ngày công (loại T7/CN + ngày lễ
     cho đơn theo HC; donViTinh 'Nửa ngày' → 0.5). Trả number.

Tham số đọc từ CauHinh ở tầng api (truyền vào rules): nguong_duyet_cap_cao (mặc định 2),
ngay_le_tet. Viết kèm vài Logger test nhỏ minh hoạ định tuyến để tự kiểm.
```

## P1.2 — Backend: API đơn từ + định tuyến người duyệt + thông báo

```
[GĐ2] backend/api/DonTuApi.gs — orchestrate rules + data + phân quyền + email.

- apiTaoDon(user, body): validate (loaiDon hợp lệ, tuNgay<=denNgay, lyDo bắt buộc).
  Tính soNgay = DuyetRules.tinhSoNgay(...). Với loaiDon='Phép năm': kiểm tra số dư phép
  (GĐ3 sẽ nối; ở P1 chỉ cảnh báo nếu chưa có SoDuPhep, KHÔNG chặn). createDon. appendLog.
  Gửi email cho người duyệt cấp 1 (= quanLyTrucTiep của NV). Trả {maDon}.
- apiThuHoiDon(user, body {maDon}): chỉ người tạo, chỉ khi trangThai ∈ {Chờ duyệt, Bổ sung}.
  set 'Thu hồi'. appendLog.
- apiSuaDonBoSung(user, body): người tạo nộp lại đơn đang 'Bổ sung' → 'Chờ duyệt'.
- apiDanhSachDonCuaToi(user, params): listDonCuaNV + gắn getBuocDuyetCuaDon mỗi đơn.
- apiDonChoDuyet(user, params): trả các đơn mà 'user' là người duyệt cấp kế tiếp.
  Xác định cấp kế tiếp: đếm số bước 'Duyệt' đã có → cap = soBuocDuyet+1. Lọc đơn theo:
  user có quyenChoCap(cap) VÀ user là người quản lý phù hợp trong cây tổ chức
  (cấp 1 = quanLyTrucTiep; cấp 2 = trưởng đơn vị của NV; cấp 3 = BGĐ). Dùng QuyenRules.canViewNV
  để giới hạn phạm vi.
- apiDuyetDon(user, body {maDon, ketQua, yKien}):
  * Xác định capHienTai, capToiDa (DuyetRules.capDuyetYeuCau với CauHinh).
  * requireQuyen(user, quyenChoCap(capHienTai)); kiểm tra user đúng người duyệt cấp này.
  * themBuocDuyet({...}). trangThaiMoi = tinhTrangThaiSauBuoc(...). updateDon.
  * Nếu 'Đã duyệt' và loaiDon='Phép năm' → gọi hook trừ phép (GĐ3: PhepRules/SoDuPhepData;
    ở P1 để TODO có chú thích rõ, KHÔNG tự trừ nếu module GĐ3 chưa có).
  * appendLog đầy đủ (Điều 28). Email cho người tạo + (nếu còn cấp) người duyệt cấp kế.

Code.gs: thêm route POST taoDon, thuHoiDon, suaDonBoSung, duyetDon; GET danhSachDonCuaToi,
donChoDuyet. Liệt kê các key CauHinh cần seed (nguong_duyet_cap_cao đã có).
```

## P1.3 — Frontend: trang tạo đơn + trang duyệt đơn

```
[GĐ2] Frontend đơn từ. Theo đúng pattern Alpine có sẵn (x-data, Api.*, requireLogin, renderHeader).

A. web/don-tu.html + web/js/donton.js (mọi vai trò tạo đơn được, trừ Admin):
- Form: loaiDon (dropdown 12 loại), tuNgay–denNgay, donViTinh (Ngày/Nửa ngày), lyDo, dinhKem (URL/ghi chú).
- Tự tính soNgay khi đổi ngày/đơn vị tính (gọi 1 endpoint preview hoặc tính client đơn giản
  loại T7/CN; số chính xác do backend chốt).
- Với Phép năm: hiện số dư phép còn lại nếu API trả; cảnh báo vàng nếu vượt (không chặn ở GĐ2).
- Bảng "Đơn của tôi": trạng thái + tiến độ duyệt (render các bước BuocDuyet: cấp, người, kết quả, ý kiến).
- Nút "Thu hồi" khi đơn còn Chờ duyệt/Bổ sung; nút "Nộp lại" khi đang Bổ sung.

B. web/duyet-don.html + web/js/duyetdon.js (Tổ trưởng/Đơn vị/BGĐ):
- Guard: user có DUYET_CAP1/2/3 bất kỳ.
- Bảng đơn chờ duyệt của mình (gọi donChoDuyet). Filter theo loại đơn/đơn vị.
- Click dòng → modal chi tiết: thông tin đơn + lịch sử các bước đã duyệt.
- Nút Duyệt / Từ chối / Yêu cầu bổ sung + ô ý kiến (bắt buộc khi Từ chối/Bổ sung) → gọi duyetDon.

api.js: thêm shorthand taoDon, thuHoiDon, suaDonBoSung, danhSachDonCuaToi, donChoDuyet, duyetDon.
auth.js renderHeader: thêm link "Đơn từ" (mọi NV) và "Duyệt đơn" (người có quyền duyệt).
```

## P1.N — Nghiệm thu GĐ2

```
[GĐ2-TEST] Viết hàm test Apps Script (Logger.log) cho rules/DuyetRules.gs:
- capDuyetYeuCau('Phép năm', 1, 2) → 2 cấp; ('Phép năm', 3, 2) → 3 cấp.
- capDuyetYeuCau('Không lương', 1, 2) → 3 cấp (luôn cấp cao).
- capDuyetYeuCau('OT', 5, 2) → duyệt bởi cấp 2.
- tinhTrangThaiSauBuoc(1, 2, 'Duyệt') → 'Chờ duyệt'; (2,2,'Duyệt') → 'Đã duyệt';
  (1,3,'Từ chối') → 'Từ chối'; (1,3,'Yêu cầu bổ sung') → 'Bổ sung'.
- tinhSoNgay('2026-06-22','2026-06-26','Ngày', []) → 5 (T2–T6); donViTinh 'Nửa ngày' → 0.5.
E2E (cần deploy): tạo đơn phép 3 ngày → duyệt cấp 1 → cấp 2 → cấp 3 → 'Đã duyệt';
mỗi bước có BuocDuyet + AuditLog; thu hồi sau khi đã duyệt cuối → bị chặn.
```

---

# PHASE 2 — GĐ3: Quản lý phép & Bảng công tháng

> Đọc trước: `docs/00-srs.md` Mục 6.3, `docs/02-data-model.md` (SoDuPhep).
> Công thức quota (Điều 25, 26): `quota = base + ⌊thamNien/5⌋`, base = {Bình thường:12, Nặng nhọc:14, Đặc biệt nặng nhọc:16}. Chưa đủ 12 tháng: `quota = base * soThangLamViec / 12` (làm tròn 0.5).

## P2.1 — Backend: quota phép + nối trừ phép vào luồng duyệt GĐ2

```
[GĐ3] Quản lý số dư phép.

1. rules/PhepRules.gs (THUẦN):
   - BASE_PHEP = {'Bình thường':12,'Nặng nhọc':14,'Đặc biệt nặng nhọc':16} — nhưng nhận
     giá trị qua tham số/CauHinh, không hardcode trong logic tính.
   - tinhQuota(dieuKienCV, ngayVaoLam, nam, baseMap) → áp công thức trên; xử lý tỷ lệ <12 tháng;
     làm tròn xuống bội số 0.5.
   - kiemTraDuPhep(soDuConLai, soNgayXin) → {du:boolean, thieu:number}.

2. data/SoDuPhepData.gs — sheet SoDuPhep (maNV, nam, quota, daDung, conLai):
   - getSoDu(maNV, nam), upsertSoDu(maNV, nam, {quota,daDung,conLai}),
   - truPhep(maNV, nam, soNgay) → daDung += soNgay; conLai = quota - daDung; (không cho âm → throw).
   - hoanPhep(maNV, nam, soNgay) → daDung -= soNgay; conLai cập nhật.

3. api/PhepApi.gs:
   - apiTinhQuotaDauNam(user): requireQuyen QUAN_LY_PHEP; duyệt NV 'Đang làm', tính & upsert quota
     năm hiện tại; appendLog. (Dùng được làm Time-trigger thủ công đầu năm.)
   - apiGetSoDuPhep(user, params {maNV?, nam?}): NV xem của mình; HR/Admin xem theo đơn vị.

4. NỐI VÀO GĐ2: trong DonTuApi.apiDuyetDon, khi đơn 'Phép năm' chuyển 'Đã duyệt' →
   truPhep(maNV, nam, soNgay) + appendLog. Trong apiThuHoiDon/khi huỷ đơn phép đã duyệt →
   hoanPhep. Bỏ TODO đã để ở P1.2.

Code.gs: route POST tinhQuotaDauNam; GET getSoDuPhep.
```

## P2.2 — Backend: bảng công tháng + khoá kỳ + xuất biểu mẫu

```
[GĐ3] Bảng công tháng. ĐỌC TRƯỚC docs/06-bang-cong-template.md — đầu ra phải khớp biểu mẫu
thực tế (2 sheet: CHI TIẾT giống CT5, TỔNG HỢP giống CC5 trong docs/Copy of Chấm công tháng 6.xlsx).

QUAN TRỌNG — kỳ công KHÔNG theo tháng dương lịch:
- Kỳ chạy từ ngày `ngay_cat_ky_cong` (mặc định 21) tháng trước → ngày (cắt-1)=20 tháng này.
- Thêm CauHinh: ngay_cat_ky_cong=21, don_vi_cap1, don_vi_cap2, ma_cham_cong (bảng mã N/D/P/R/Ô/TS/KL/L).
- Mọi mốc/ngưỡng đọc từ CauHinh, KHÔNG hardcode.

1. rules/BangCongRules.gs (THUẦN):
   - khoangKyCong(thangNhan 'yyyy-MM', ngayCat) → {tuNgay, denNgay} (21 tháng trước → 20 tháng này).
   - maNgay(chamCong, ca, donDaDuyetNgay, ngayLe) → trả mã ô lưới (N/D/P/R/Ô/TS/KL/L/trống)
     theo bảng mã trong docs/06. Công đêm (D) khi ca.banDem=true.
   - tongHopNV(danhSachMaNgay, danhSachOT) → {congNgay, congDem, nghiP, nghiR, nghiOm, nghiTS,
     nghiKL, otNgayThuong:{ngay,dem}, otNghiTuan:{ngay,dem}, otLeTet:{ngay,dem}, congOT}.

2. data/BangCongData.gs:
   - layDuLieuKyCong(maNVList, tuNgay, denNgay) → gom ChamCong (getChamCongDonVi) + LichTruc
     (getLichTrucDonVi) + DonTu đã duyệt trong kỳ + danh mục Ca. Trả cấu trúc đủ để build 2 sheet.
   - sheet BangCong (khoá theo kỳ): cột ky 'yyyy-MM', maNV, isLocked, nguoiKhoa, thoiDiemKhoa.
   - kiemTraKhoa(ky, maNV), datKhoa/moKhoa(ky, maNV, nguoi, lyDo).

3. api/BangCongApi.gs:
   - apiGetBangCong(user, params {ky, donVi?, maNV?, loai:'chi_tiet'|'tong_hop'}): NV xem của mình;
     HR/Tổ trưởng/BGĐ xem theo phạm vi (QuyenRules.canViewNV). Trả JSON đã tổng hợp (FE render lưới).
   - apiKhoaKyCong(user, body {ky, donVi?}): requireQuyen KHOA_BANG_CONG; appendLog.
   - apiMoKhoaKyCong(user, body {ky, maNV?, lyDo}): yêu cầu lyDo; appendLog.
   - apiXuatBangCong(user, params {ky, donVi?, dinhDang:'xlsx'|'csv'}):
     * xlsx: clone file template (docs/Copy of Chấm công tháng 6.xlsx upload sẵn vào Drive, lưu
       template_file_id trong CauHinh) → đổ dữ liệu từ dòng 12 vào 2 sheet CT5/CC5 → export .xlsx,
       trả file (DriveApp) hoặc base64. Giữ header pháp lý + chân ký Người chấm công/Phó Trưởng đơn vị.
     * csv: fallback đơn giản, UTF-8 có BOM cho Excel đọc đúng dấu.

LƯU Ý mô hình dữ liệu (xem docs/06 mục "Khoảng cách"): NhanVien có thể cần thêm maDonVi,
heSoViTri, diemDanhGia, mucM (migration, để trống nếu chưa quản lý lương). OT cần phân loại
Ngày thường/Nghỉ tuần/Lễ-Tết × Ngày/Đêm (suy từ ngày OT so lịch lễ + nghỉ tuần + ca.banDem).

Code.gs: GET getBangCong, xuatBangCong; POST khoaKyCong, moKhoaKyCong.
```

## P2.3 — Frontend: bảng công + số dư phép

```
[GĐ3] Frontend.

A. web/bang-cong.html + web/js/bangcong.js (đối chiếu biểu mẫu docs/06-bang-cong-template.md):
- Chọn kỳ (mặc định kỳ hiện tại, hiển thị "kỳ 21/MM-1 → 20/MM"). NV xem của mình;
  HR/Tổ trưởng/BGĐ chọn đơn vị/NV.
- Toggle 2 chế độ xem: "Chi tiết" (lưới ngày × NV, mỗi ô là mã N/D/P/R/Ô/TS/KL/L) và
  "Tổng hợp" (mỗi NV 1 dòng: công ngày/đêm, OT theo nhóm, các loại nghỉ) — khớp CT5/CC5.
- Nút "Khoá kỳ" / "Mở khoá" (chỉ HR/Admin), hiện trạng thái khoá.
- Nút "Xuất Excel" → gọi xuatBangCong (dinhDang 'xlsx'), tải file đúng biểu mẫu; có fallback CSV.

B. web/so-du-phep.html + web/js/soduphep.js:
- NV xem quota/đã dùng/còn lại năm hiện tại + lịch sử trừ phép (lọc DonTu loaiDon='Phép năm'
  trangThai='Đã duyệt').
- HR/Admin: bảng số dư toàn đơn vị + nút "Tính quota đầu năm" (gọi tinhQuotaDauNam).

api.js + auth.js renderHeader: thêm link "Bảng công", "Số dư phép" theo quyền.
```

## P2.N — Nghiệm thu GĐ3

```
[GĐ3-TEST] Test rules/PhepRules.gs:
- tinhQuota('Bình thường', '2010-01-01', 2026, base) → 12 + ⌊16/5⌋=3 → 15.
- tinhQuota('Nặng nhọc', '2024-07-01', 2026, base) → 14 (đủ năm) + bonus.
- NV vào 2026-04-01 (làm 9 tháng tính tới cuối năm) 'Bình thường' → 12*9/12 = 9.
- kiemTraDuPhep(2, 3) → {du:false, thieu:1}.
E2E: duyệt cuối đơn phép 2 ngày → SoDuPhep.daDung +2, conLai -2; thu hồi → hoàn lại.
Bảng công tháng: 1 ngày TRE → soGioLam=0, đếm vào "mất công"; khoá kỳ → sửa chấm công bị chặn.
```

---

# PHASE 3 — GĐ4: Cảnh báo kỷ luật & Quản trị

> Đọc trước: `docs/01-business-rules.md` Mục 5, `docs/02-data-model.md` (CanhBaoKyLuat).
> "Bỏ việc" = ChamCong.trangThai ∈ {TRE, SOM, MAT_CONG, VANG_KHONG_PHEP} → dùng `laBoViec()`.
> Hệ thống **CHỈ CẢNH BÁO**, không tự ra quyết định kỷ luật.

## P3.1 — Backend: cửa sổ trượt kỷ luật + quét tự động

```
[GĐ4] Cảnh báo kỷ luật.

CauHinh (seed mới, KHÔNG hardcode):
  nguong_ky_luat_30_khien = 3, nguong_ky_luat_30_keo = 4,
  nguong_ky_luat_30_sa = 5, nguong_ky_luat_365_sa = 20.

1. rules/KyLuatRules.gs (THUẦN):
   - demBoViecTrongKhoang(danhSachChamCong) → đếm số ngày laBoViec=true (mỗi ngày tính 1).
   - xacDinhMucCanhBao(soNgay30, soNgay365, nguong) → trả mức cao nhất chạm:
       soNgay30 >= sa OR soNgay365 >= sa365 → 'Sa thải'
       soNgay30 >= keo → 'Kéo dài nâng lương'
       soNgay30 >= khien → 'Khiển trách'
       else null.

2. api/KyLuatApi.gs:
   - quetCanhBaoMotNV(maNV): den=todayStr(); tu30=toDateStr(-30); tu365=toDateStr(-365);
     đếm bỏ việc 2 cửa sổ (getChamCongKhoang), xacDinhMucCanhBao. Nếu chạm ngưỡng và CHƯA có
     CanhBaoKyLuat cùng NV+mức trong ngày → ghi sheet CanhBaoKyLuat + appendLog.
   - quetCanhBaoTatCa(): lặp NV 'Đang làm', gọi quetCanhBaoMotNV. Trả tổng số cảnh báo mới.
     (Đăng ký Time-driven trigger everyDays(1) atHour(6) — hướng dẫn tạo trigger thủ công.)
   - apiGetCanhBao(user, params {donVi?, mucCanhBao?}): requireQuyen XEM_CANH_BAO; lọc theo phạm vi.

data/KyLuatData.gs (nếu tách): listCanhBao, themCanhBao, daCoCanhBaoTrongNgay(maNV, muc).

Code.gs: POST quetCanhBao (chạy thủ công); GET getCanhBao.
```

## P3.2 — Backend: Quản trị (CauHinh + AuditLog)

```
[GĐ4] api/QuanTriApi.gs — Admin only (requireQuyen QUAN_TRI).
- apiGetCauHinh(user): trả getAllConfig() (đã có route getCauHinh ở GĐ1 — kiểm tra, tránh trùng).
- apiSetCauHinh(user, body {key, value, moTa}): setConfig + appendLog (giá trị cũ→mới).
- apiGetAuditLog(user, params {tuNgay?, denNgay?, action?, maNV?}): đọc sheet AuditLog có phân
  trang + lọc. Chỉ Admin/HR.
Code.gs: POST setCauHinh; GET getAuditLog.
```

## P3.3 — Frontend: cảnh báo kỷ luật + quản trị

```
[GĐ4] Frontend.

A. web/ky-luat.html + web/js/kyluat.js (HR/Tổ trưởng/Đơn vị/BGĐ):
- Guard XEM_CANH_BAO. Bảng cảnh báo: NV, đơn vị, soNgayBoViec30/365, mucCanhBao (badge màu
  tăng dần: vàng→cam→đỏ), thời điểm. Lọc theo đơn vị + mức. Nút "Quét lại" (nếu có quyền).
- Ghi rõ dòng chú thích: "Hệ thống chỉ cảnh báo, không tự ra quyết định kỷ luật (Điều 33–35 NQLĐ)".

B. web/quan-tri.html + web/js/quantri.js (Admin):
- Tab CauHinh: bảng key/value/mô tả, sửa inline → setCauHinh (xác nhận trước khi lưu).
- Tab AuditLog: bảng nhật ký có lọc theo ngày/action/NV, phân trang.

api.js + auth.js renderHeader: link "Cảnh báo kỷ luật" (người có quyền), "Quản trị" (Admin).
```

## P3.N — Nghiệm thu GĐ4

```
[GĐ4-TEST] Test rules/KyLuatRules.gs:
- demBoViecTrongKhoang: list 3 ngày TRE + 1 DU_CONG + 1 VANG_PHEP → 3.
- xacDinhMucCanhBao(3,5,nguong) → 'Khiển trách'; (5,5,...) → 'Sa thải';
  (2,20,...) → 'Sa thải' (chạm 365); (2,2,...) → null.
E2E: tạo 3 ngày bỏ việc trong 30 ngày → quetCanhBaoMotNV sinh 'Khiển trách' + AuditLog;
chạy lại cùng ngày → KHÔNG ghi trùng. Sửa CauHinh ngưỡng → quét lại đổi kết quả.
```

---

# PHASE BS — Bổ sung: Chấm công khối Trực tiếp tính theo giờ

> Đọc trước: `docs/07-cham-cong-truc-tiep-theo-gio.md` (spec đã chốt).
> Phân biệt **theo `NhanVien.khoi`**: `Trực tiếp` → tính theo giờ; `Gián tiếp` → giữ Điều 7.3 (mất công cả ngày).

## PBS.1 — Backend: rules + data + api theo giờ

```
[BS] Chấm công khối Trực tiếp tính theo giờ. Đọc docs/07-cham-cong-truc-tiep-theo-gio.md.
KHÔNG đụng hành vi khối Gián tiếp (phải y như cũ — Điều 7.3).

QUY TẮC (đã chốt):
- Phân biệt theo NhanVien.khoi: 'Trực tiếp' → theoGio=true; 'Gián tiếp' → theoGio=false.
- Trực tiếp: đi trễ/về sớm → trạng thái vẫn DU_CONG, chỉ TRỪ GIỜ; KHÔNG TRE/SOM, KHÔNG tính kỷ luật.
  Vắng cả ca (không chấm vào) → MAT_CONG/VANG_KHONG_PHEP, VẪN tính kỷ luật.
- soGioCong = (giờ ra − giờ vào); nghỉ giữa ca TÍNH VÀO giờ làm (không trừ); làm tròn xuống 0.5h;
  không dùng grace. Chưa chấm ra → 0.

1. rules/ChamCongRules.gs (THUẦN — giữ nguyên nhánh gián tiếp):
   - tinhTrangThaiCong(gioVaoISO, gioRaISO, ca, graceMinutes, theoGio):
       theoGio=true: !gioVao → 'MAT_CONG'; else → 'DU_CONG' (không bao giờ TRE/SOM).
       theoGio falsy: y như hiện tại.
   - tinhSoGioLam(trangThai, gioVaoISO, gioRaISO, ca, theoGio):
       theoGio=true: trả (gioRa-gioVao)/60 làm tròn xuống 0.5 (0 nếu thiếu vào/ra); KHÔNG trả 0 vì trễ/sớm.
       theoGio falsy: y như hiện tại (0 nếu TRE/SOM/MAT_CONG).
   - laBoViec không đổi (trực tiếp DU_CONG → tự động false).

2. data/ChamCongData.gs: thêm cột 'soGioCong' vào CC_HEADERS + ensureChamCongCols (giống isLocked).

3. api/ChamCongApi.gs (apiChamVao/apiChamRa):
   - theoGio = (getNVByMa(user.maNV).khoi === 'Trực tiếp').
   - Truyền theoGio vào tinhTrangThaiCong; khi chamRa tính soGioCong = tinhSoGioLam(..., theoGio) và lưu.
   - apiSuaChamCong: cũng tính lại soGioCong theo theoGio của NV bản ghi.

Viết Logger test: trễ 1h ca 8h → trực tiếp soGioCong=7, DU_CONG, laBoViec=false;
gián tiếp cùng tình huống → TRE, soGioCong=0, laBoViec=true.
Code.gs không thêm route. Liệt kê cột mới + migration cần chạy.
```

## PBS.2 — Bảng công: ô "Mã + số giờ" cho khối trực tiếp

```
[BS] Bảng công hiển thị giờ cho khối Trực tiếp. Đọc docs/07.

- rules/BangCongRules.gs:
  * maNgay(...) thêm tham số theoGio + soGioCong (hoặc trả {ma, gio}); khối trực tiếp ô = "N·8"/"D·7.5"
    (mã N/D kèm số giờ); gián tiếp giữ "N"/"D".
  * tongHopNV(...) cộng thêm tongGioCong cho khối trực tiếp.
- api/BangCongApi.gs: khi build lưới, biết khoi của từng NV (đã có nv) → truyền theoGio + soGioCong
  (lấy từ bản ghi ChamCong cột soGioCong). Cột tổng hợp/CSV/xlsx thêm "Tổng giờ" cho NV trực tiếp.
- FE bang-cong.html/js: ô lưới hiện chuỗi "N·8"; chú thích mã cập nhật.

Giữ nguyên hiển thị khối gián tiếp. Test: 1 NV trực tiếp 3 ngày (8h,7.5h,6h) → tổng 21.5h.
```

## PBS.N — Nghiệm thu

```
[BS-TEST] Node + Editor:
- tinhTrangThaiCong(vào 08:00, ra 16:00, ca 08:00-17:00, grace 0, theoGio=true) → 'DU_CONG'.
- tinhTrangThaiCong(vào 09:00 (trễ 1h), ra 17:00, ca, 0, theoGio=true) → 'DU_CONG' (không TRE).
- tinhSoGioLam('DU_CONG', 09:00, 17:00, ca, theoGio=true) → 8 (giờ thực, không bị 0).
- Cùng input theoGio=false → 'TRE', tinhSoGioLam → 0.
- laBoViec('DU_CONG') → false. Khối trực tiếp trễ KHÔNG góp vào quetCanhBao.
E2E: đổi 1 NV sang khoi='Trực tiếp' → chấm trễ → bảng công ô "N·7", số dư kỷ luật KHÔNG tăng.
```

---

# PHASE BS2 — Bổ sung: Duyệt mọi đơn đủ 3 cấp (1→2→3)

> Đọc trước: `docs/08-duyet-don-3-cap.md`. Cấp 1 = Tổ trưởng, Cấp 2 = Trưởng đơn vị, Cấp 3 = BGĐ/Admin.

```
[BS2] Đổi định tuyến duyệt: MỌI loại đơn đều qua đủ 3 cấp tuần tự 1→2→3. Đọc docs/08.

- rules/DuyetRules.gs:
  * capDuyetYeuCau(loaiDon, soNgay, nguong) → LUÔN trả ['DUYET_CAP1','DUYET_CAP2','DUYET_CAP3']
    cho mọi loại đơn (bỏ switch theo loại + bỏ dùng ngưỡng ngày). Giữ chữ ký hàm.
  * Các hàm khác (tinhTrangThaiSauBuoc, quyenChoCap, tinhSoNgay) giữ nguyên.
- QuyenRules.gs / DonTuApi.gs: KHÔNG đổi (DUYET_CAP1/2/3 đã phủ đúng vai trò; _canApprove đã cho
  BGĐ+Admin duyệt mọi cấp).
- Cập nhật test P1.N: mọi loại đơn → capDuyetYeuCau(...).length === 3.

Lưu ý vận hành (ghi lại cho người dùng): mỗi NV cần quanLyTrucTiep = Tổ trưởng (cấp 1);
mỗi đơn vị cần Trưởng đơn vị (cấp 2); cần ≥1 BGĐ/Admin (cấp 3). Nếu quanLyTrucTiep chính là
Trưởng đơn vị thì cấp 1 và 2 trùng người (duyệt 2 lần) — nên gán Tổ trưởng làm quanLyTrucTiep.
```

---

# PHASE NC — Nâng cao & Tuân thủ (backlog, chưa code)

> Danh sách + ưu tiên: `docs/09-backlog-tinh-nang.md`. Mỗi prompt self-contained, chạy độc lập.
> Giữ nguyên quy ước chung (mục 0): CauHinh, AuditLog, phân quyền, POST text/plain.

## NC-A — Bắt đổi mật khẩu lần đầu

```
[NC-A] Ép đổi mật khẩu lần đầu (45 NV đang dùng chung 123456).
- NhanVien: thêm cột 'phaiDoiMK' (migration giống soGioCong).
- data/NhanVienData.datMatKhau: set phaiDoiMK='TRUE' khi đặt mật khẩu (import/reset/admin).
  apiDoiMatKhau (AuthApi): sau khi user tự đổi → set phaiDoiMK=''.
- apiLogin trả thêm phaiDoiMK trong user. FE auth.js sau login: nếu user.phaiDoiMK → ép sang
  doi-mat-khau.html, chặn truy cập trang khác tới khi đổi xong.
```

## NC-B — Khoá đăng nhập sau N lần sai

```
[NC-B] Khoá đăng nhập tạm sau nhiều lần sai (chống dò mật khẩu).
- CauHinh: dang_nhap_toi_da=5, dang_nhap_khoa_phut=15.
- AuthApi.apiLogin: dùng CacheService (key 'login_fail_'+email) đếm số lần sai;
  ≥ ngưỡng → ném 'Tài khoản tạm khoá, thử lại sau N phút' (không tiết lộ đúng/sai mật khẩu);
  đăng nhập đúng → xoá đếm. Ghi AuditLog khi chạm ngưỡng khoá.
```

## NC-C — Kiểm tra trần OT (Điều 5.3)

```
[NC-C] Kiểm soát trần làm thêm giờ. Đọc docs/00-srs Mục 4.3.
- Bổ sung số GIỜ cho đơn OT: DonTu thêm trường soGio (đơn OT donViTinh='Giờ', nhập số giờ).
- CauHinh: ot_max_ngay=50 (%/ngày), ot_max_thang=40, ot_max_nam=200.
- rules/OtRules.gs (THUẦN): tongOtTrongKhoang(danhSachDonOT) → tổng giờ; kiemTraTranOT(thangGio, namGio, nguong).
- api/DonTuApi: khi tạo đơn OT → cảnh báo nếu vượt; khi DUYỆT CUỐI đơn OT → CHẶN nếu vượt
  trần tháng/năm (đọc các đơn OT 'Đã duyệt' của NV trong tháng/năm + đơn hiện tại).
```

## NC-D — Định mức nghỉ việc riêng (Mục 4.4)

```
[NC-D] Kiểm soát định mức nghỉ việc riêng có lương (Điều 27 / Mục 4.4).
- CauHinh 'dinh_muc_viec_rieng' (JSON): {"Kết hôn bản thân":3,"Con kết hôn":1,"Tang cha mẹ/vợ chồng/con":3,...}.
- DonTu loaiDon='Việc riêng': thêm trường 'lyDoDinhMuc' (chọn từ danh mục trên).
- api/DonTuApi.apiTaoDon: nếu Việc riêng → soNgay ≤ định mức của lyDoDinhMuc; vượt → chặn hoặc
  gợi ý chuyển 'Không lương'. FE don-tu: dropdown lý do định mức khi loaiDon=Việc riêng.
```

## NC-E — Thông báo trong app (chuông)

```
[NC-E] Thông báo in-app (bù cho email hay lỗi scope).
- data/ThongBaoData.gs — sheet ThongBao (maTB, maNV, noiDung, link, daDoc, thoiDiem).
  themThongBao(maNV, noiDung, link); listChuaDoc(maNV); danhDauDaDoc(maTB|maNV).
- Sinh thông báo trong DonTuApi: đơn duyệt/từ chối/bổ sung → cho người tạo; đơn mới cần duyệt →
  cho người duyệt kế tiếp. KyLuatApi: cảnh báo mới → cho HR.
- api: getThongBao, danhDauDaDoc. FE: chuông 🔔 + số chưa đọc trên header (như badge duyệt);
  trang/thả dropdown danh sách thông báo.
```

## NC-F — Dashboard / báo cáo

```
[NC-F] Trang tổng quan + báo cáo.
- api/BaoCaoApi.gs: thongKeKy(ky, donVi) → {soDiTre, soVang, tongOT, tongPhep, ...} theo phạm vi quyền;
  aiDangNghi(ngay) → NV có đơn nghỉ 'Đã duyệt' phủ ngày.
- web/dashboard.html + js: thẻ số liệu kỳ + danh sách "đang nghỉ hôm nay". Thêm vào nav.
```

## NC-G — Tối ưu tốc độ (CacheService)

```
[NC-G] Giảm ~6s/thao tác.
- data/CauHinhData + NhanVienData: bọc getAllConfig() và listNV() bằng CacheService (TTL 60s);
  xoá cache khi setConfig/createNV/updateNV.
- api/DonTuApi.donChoDuyet + BangCongApi: đọc NhanVien/BuocDuyet 1 LẦN, build map, bỏ getNVByMa lặp.
- Đo lại thời gian trước/sau. KHÔNG đổi hành vi/kết quả.
```

## NC-H — PWA (cài như app)

```
[NC-H] Biến web thành PWA.
- web/manifest.json (name, short_name, icons, start_url='chamcong.html', display='standalone', theme_color).
- web/sw.js service worker: cache tĩnh (html/css/js) để mở nhanh + offline xem.
- Link <link rel=manifest> + đăng ký SW trong các trang. Test 'Add to Home Screen' trên Android/iOS.
```

## NC-I — Đính kèm file thật

```
[NC-I] Upload minh chứng lên Drive (thay vì chỉ dán URL).
- api/DonTuApi.apiUploadDinhKem(user, body{tenFile, mime, base64}) → DriveApp tạo file trong thư mục
  (CauHinh 'drive_folder_dinhkem'), set chia sẻ link, trả URL → lưu DonTu.dinhKem. Scope drive đã có.
- FE don-tu: <input type=file> → đọc base64 → upload → hiện link. Giới hạn dung lượng.
```

## NC-J — Biên bản kỷ luật (Điều 28)

```
[NC-J] Sinh biên bản xử lý kỷ luật từ cảnh báo.
- api/KyLuatApi.getChiTietViPham(maNV, tuNgay, denNgay) → liệt kê các ngày bỏ việc (ChamCong laBoViec)
  + trạng thái + lý do.
- web/bien-ban-ky-luat.html (kiểu in-don.html, window.print): header pháp lý, thông tin NV, bảng ngày
  vi phạm, mức đề nghị (Điều 33–35), chỗ ký hội đồng. Nút "Lập biên bản" ở trang Cảnh báo KL.
```

---

# CÔNG CỤ XUYÊN SUỐT

## DEPLOY / SETUP (khi cần lần đầu hoặc deploy lại)

```
Hướng dẫn deploy hệ thống Chấm công CSCC theo SETUP.md. Stack: Apps Script + GitHub Pages + Sheets.
Auth: email + mật khẩu (SHA-256), session HMAC 8h ký bằng Script Property SESSION_SECRET.
Các bước: (1) tạo Spreadsheet, điền SPREADSHEET_ID vào backend/data/SheetHelper.gs;
(2) clasp push --force; (3) đặt Script Property SESSION_SECRET ≥32 ký tự;
(4) chạy setupGD1() tạo sheet; (5) tạo Admin đầu tiên bằng createNV()+setPassword() trong Editor;
(6) Deploy Web App (Execute as Me, Access Anyone) lấy URL;
(7) copy web/js/config.example.js → config.js, điền BACKEND_URL;
(8) bật GitHub Pages (branch main, thư mục /web).
Sau khi thêm phase mới: chạy migration sheet tương ứng (tạo sheet DonTu/BuocDuyet/SoDuPhep/
BangCong/CanhBaoKyLuat + seed CauHinh mới), rồi Deploy lại bản mới của Web App.
Kiểm tra giúp tôi từng bước và xác nhận giá trị cần điền.
```

## GỠ LỖI XÁC THỰC

```
Gỡ lỗi xác thực Chấm công CSCC. Triệu chứng: [mô tả].
Luồng: FE POST {action:'login',email,matKhau} (Content-Type text/plain) → AuthApi.apiLogin
hash SHA-256 so với cột matKhau NhanVien → tạo HMAC token (email|expires, ký SESSION_SECRET)
→ FE lưu sessionStorage cc_token → request sau gửi token (POST body / GET query) →
verifyAndGetUser kiểm chữ ký + hạn 8h + trangThai NV.
File: backend/api/AuthApi.gs, backend/data/NhanVienData.gs (setPassword/addMatKhauColumn),
web/js/auth.js, web/js/api.js, web/js/config.js.
Checklist: SESSION_SECRET đã đặt? cột matKhau có chưa (addMatKhauColumn)? setPassword đã chạy?
Web App đã Deploy bản mới? Content-Type POST đúng text/plain? Tìm nguyên nhân và sửa.
```

## VIẾT TEST BUSINESS RULES (dùng lại mỗi phase)

```
Viết test cho rules/ của [tên phase]. Mọi hàm trong rules/ phải test được KHÔNG cần Sheets
(logic thuần, nhận tham số). Viết hàm chayTest_<Module>() dùng Logger.log: in PASS/FAIL từng
ca, tổng kết cuối. Bao quát ca biên (đúng ngưỡng, qua nửa đêm, làm tròn 0.5). Liệt kê ca lỗi.
```

---

## GHI CHÚ QUAN TRỌNG KHI THỰC THI

1. **Mỗi prompt chỉ làm đúng phạm vi của nó** — không tự ý nhảy phase, không refactor code GĐ1 đang chạy trừ khi prompt yêu cầu.
2. **Sau mỗi phase**: chạy prompt `*-TEST`, rồi chạy migration sheet + Deploy lại Web App trước khi sang phase sau.
3. **CauHinh là nguồn chân lý số liệu** — khi thêm tham số mới phải seed trong `setupGD1`/migration tương ứng và liệt kê cho người vận hành.
4. **AuditLog không được bỏ sót** ở: chấm công sửa/khoá/mở, duyệt đơn (mọi bước), trừ/hoàn phép, khoá/mở kỳ công, sửa CauHinh, sinh cảnh báo kỷ luật.
5. **Phân quyền chỉ qua `requireQuyen`** — nếu cần quyền mới (VD QUAN_LY_PHEP, KHOA_BANG_CONG, XEM_CANH_BAO, QUAN_TRI) phải khai báo trong `QUYEN_MAP`.
```
