# Đặc tả Yêu cầu Phần mềm (SRS) — Hệ thống Chấm công

Phiên bản v1.0 · Đơn vị Chiếu sáng khu vực Trung tâm · Căn cứ Nội quy lao động (QĐ 44/QĐ-CTCSCC) & BLLĐ 2019

> Bản markdown này là bản sao của file Word `Dac_ta_phan_mem_cham_cong_CSCC_v1.0.docx` để git theo dõi thay đổi. Khi cập nhật, sửa cả hai và tăng phiên bản.

---

# 1. GIỚI THIỆU

## 1.1. Mục đích tài liệu

Tài liệu này đặc tả đầy đủ các yêu cầu của Hệ thống Chấm công – Nghỉ phép – Duyệt đơn cho đơn vị Chiếu sáng khu vực Trung tâm. Tài liệu là cơ sở thống nhất giữa bộ phận nghiệp vụ (Nhân sự, các đơn vị trực thuộc) và bộ phận phát triển phần mềm; đồng thời là căn cứ để kiểm thử và nghiệm thu, bảo đảm hệ thống vận hành đúng Nội quy lao động của Công ty và quy định của pháp luật.

## 1.2. Phạm vi hệ thống

Hệ thống số hóa toàn bộ nghiệp vụ quản lý thời gian làm việc của người lao động, bao gồm: chấm công hàng ngày (văn phòng và hiện trường), quản lý ca/lịch trực, quản lý các loại đơn (nghỉ phép, nghỉ việc riêng, nghỉ không lương, làm thêm giờ, công tác), quy trình duyệt đơn nhiều cấp, tính toán số dư phép tự động, cảnh báo ngưỡng kỷ luật, và kết xuất bảng công phục vụ tính lương.

## 1.3. Đối tượng sử dụng tài liệu

- Ban Giám đốc, Trưởng/Phó các đơn vị: phê duyệt phạm vi và quy trình.

- Phòng Tổ chức – Nhân sự: quản trị danh mục, quota phép, bảng công.

- Tổ trưởng/Đội trưởng: phân ca, duyệt cấp trực tiếp.

- Đội ngũ phát triển và kiểm thử phần mềm.

## 1.4. Căn cứ pháp lý và quy định nội bộ

- Bộ luật Lao động số 45/2019/QH14.

- Nghị định 145/2020/NĐ-CP quy định chi tiết một số điều của Bộ luật Lao động.

- Nội quy lao động Công ty (ban hành kèm **QĐ số 44/QĐ-CTCSCC**) – là nguồn quy tắc nghiệp vụ chính của hệ thống.

- Quy chế trả lương và Thang/Bảng lương năm 2026 của Công ty.

## 1.5. Thuật ngữ và từ viết tắt

| **Viết tắt** | **Diễn giải** |
| --- | --- |
| NLĐ | Người lao động |
| NSDLĐ | Người sử dụng lao động (Tổng Giám đốc hoặc người được ủy quyền) |
| NQLĐ | Nội quy lao động |
| BLLĐ | Bộ luật Lao động 2019 |
| HC | Giờ hành chính |
| OT | Làm thêm giờ (overtime) |
| GPS | Định vị toàn cầu (dùng cho chấm công hiện trường) |
| SRS | Tài liệu đặc tả yêu cầu phần mềm |

# 2. TỔNG QUAN HỆ THỐNG

## 2.1. Mô tả tổng quát

Hệ thống là ứng dụng web (có hỗ trợ thiết bị di động) cho phép NLĐ tự chấm công và gửi đơn từ trực tuyến; cấp quản lý duyệt đơn theo luồng nhiều cấp; bộ phận Nhân sự theo dõi bảng công, số dư phép và cảnh báo kỷ luật. Mọi quy tắc về giờ làm, nghỉ phép và kỷ luật được mã hóa trực tiếp từ Nội quy lao động để hệ thống tự động kiểm soát, giảm sai sót thủ công.

## 2.2. Đối tượng người dùng và vai trò

| **Vai trò** | **Chức năng chính** |
| --- | --- |
| Nhân viên (NLĐ) | Chấm công vào/ra, xem bảng công cá nhân, tạo đơn, theo dõi số dư phép. |
| Tổ trưởng / Đội trưởng / Chỉ huy trưởng công trường | Phân ca, duyệt cấp trực tiếp, theo dõi chấm công tổ/đội. |
| Trưởng / Phó đơn vị | Duyệt cấp 2, duyệt làm thêm giờ, xem báo cáo đơn vị. |
| Tổng Giám đốc / người được ủy quyền | Phê duyệt cuối với các trường hợp đặc biệt (nghỉ dài ngày, không lương). |
| Nhân sự (HR) | Quản lý hồ sơ NLĐ, quota phép, khóa bảng công, kết xuất lương, theo dõi cảnh báo kỷ luật. |
| Quản trị (Admin) | Quản lý danh mục, ca, phân quyền, cấu hình tham số hệ thống. |

## 2.3. Kiến trúc tổng thể

Hệ thống áp dụng kiến trúc web ba lớp, ưu tiên chi phí hạ tầng thấp và khả năng tự vận hành:

- **Lớp giao diện: **Ứng dụng web (React) chạy trên trình duyệt, hỗ trợ điện thoại để chấm công hiện trường.

- **Lớp xử lý: **Dịch vụ web (Google Apps Script hoặc máy chủ Node.js) chứa toàn bộ quy tắc nghiệp vụ và xác thực.

- **Lớp dữ liệu: **Cơ sở dữ liệu (Google Sheets cho quy mô đơn vị, hoặc PostgreSQL khi mở rộng).

**Ghi chú: **Kiến trúc trên là khuyến nghị; phần đặc tả chức năng (Mục 3–8) không phụ thuộc vào lựa chọn công nghệ và có thể triển khai trên nền tảng khác.

## 2.4. Các phân hệ chính

| **Phân hệ** | **Mô tả** |
| --- | --- |
| QH-01 Nhân sự & tổ chức | Quản lý hồ sơ NLĐ, đơn vị, khối, chức danh, điều kiện công việc. |
| QH-02 Ca & lịch trực | Định nghĩa ca, phân ca, lịch trực vận hành/hiện trường. |
| QH-03 Chấm công | Ghi nhận vào/ra theo nhiều hình thức, tính trạng thái công. |
| QH-04 Đơn từ | Tạo và quản lý các loại đơn. |
| QH-05 Quy trình duyệt | Luồng duyệt nhiều cấp, lưu vết phê duyệt. |
| QH-06 Quản lý phép | Tính quota, trừ phép, theo dõi số dư. |
| QH-07 Cảnh báo kỷ luật | Đếm ngày bỏ việc, cảnh báo ngưỡng 3/4/5/20 ngày. |
| QH-08 Báo cáo & bảng công | Bảng công tháng, thống kê, kết xuất Excel. |
| QH-09 Quản trị hệ thống | Phân quyền, cấu hình tham số, nhật ký hệ thống. |

# 3. YÊU CẦU CHỨC NĂNG

## 3.1. QH-01 – Quản lý nhân sự và tổ chức

- CN-01.1: Quản lý hồ sơ NLĐ (mã, họ tên, ngày sinh, ngày vào làm, đơn vị, khối gián tiếp/trực tiếp, chức danh).

- CN-01.2: Gắn điều kiện công việc cho NLĐ (bình thường / nặng nhọc, độc hại / đặc biệt nặng nhọc) để xác định quota phép năm 12/14/16 ngày.

- CN-01.3: Quản lý cây tổ chức (phòng, đơn vị, tổ/đội) và quan hệ quản lý trực tiếp để định tuyến duyệt đơn.

- CN-01.4: Quản lý trạng thái lao động (đang làm, thử việc, tạm hoãn, nghỉ việc).

## 3.2. QH-02 – Quản lý ca và lịch trực

- CN-02.1: Khai báo danh mục ca (ca hành chính, ca trực vận hành, ca đêm) với giờ bắt đầu/kết thúc.

- CN-02.2: Phân ca cho NLĐ khối trực tiếp theo ngày/tuần; hỗ trợ ca xoay vòng.

- CN-02.3: Cảnh báo khi khoảng nghỉ giữa hai ca của một NLĐ dưới 12 giờ (vi phạm nghỉ chuyển ca).

- CN-02.4: Cảnh báo khi NLĐ không có tối thiểu 24 giờ nghỉ liên tục trong tuần.

## 3.3. QH-03 – Chấm công

- CN-03.1: Chấm công vào/ra qua web tại trụ sở; ghi nhận mốc thời gian máy chủ.

- CN-03.2: Chấm công hiện trường qua điện thoại có đính kèm tọa độ GPS và ảnh (tùy chọn).

- CN-03.3: Tự động xác định trạng thái: đủ công / đi trễ / về sớm / mất công ngày / vắng có phép / vắng không phép.

- CN-03.4: Áp dụng quy tắc Điều 7 NQLĐ – đi trễ, về sớm hoặc vắng họp/học tập đúng giờ quy định bị đánh dấu **tự ý bỏ việc của ngày hôm đó**.

- CN-03.5: Cho phép HR điều chỉnh chấm công thủ công có lý do, lưu vết người và thời điểm chỉnh sửa.

## 3.4. QH-04 – Đơn từ

- CN-04.1: Tạo đơn theo các loại: nghỉ phép năm, nghỉ việc riêng hưởng lương, nghỉ không lương, làm thêm giờ, công tác, ra ngoài trong giờ.

- CN-04.2: Hệ thống tự kiểm tra số dư phép khi tạo đơn nghỉ phép; chặn hoặc chuyển sang không lương nếu vượt.

- CN-04.3: Cho phép đính kèm minh chứng (giấy tờ, hình ảnh).

- CN-04.4: Cho phép thu hồi đơn khi chưa được duyệt cuối.

## 3.5. QH-05 – Quy trình duyệt

- CN-05.1: Định tuyến đơn theo luồng nhiều cấp dựa trên loại đơn, số ngày và cây tổ chức (xem Mục 6.2).

- CN-05.2: Cho phép từng cấp: Duyệt / Từ chối / Yêu cầu bổ sung, kèm ý kiến.

- CN-05.3: Lưu vết đầy đủ từng bước duyệt (người, thời điểm, ý kiến) phục vụ lập biên bản theo Điều 28 NQLĐ.

- CN-05.4: Thông báo (in-app / email) cho người tạo và người duyệt kế tiếp.

## 3.6. QH-06 – Quản lý phép và số dư

- CN-06.1: Tính quota phép năm theo công thức **Số ngày cơ bản (12/14/16) + ⌊thâm niên ÷ 5⌋** (Điều 25, 26 NQLĐ).

- CN-06.2: Tính phép theo tỷ lệ với NLĐ chưa đủ 12 tháng làm việc.

- CN-06.3: Trừ số dư khi đơn nghỉ phép được duyệt cuối; hoàn lại khi đơn bị hủy.

- CN-06.4: Theo dõi nghỉ việc riêng/không lương đúng định mức (xem Mục 4).

## 3.7. QH-07 – Cảnh báo kỷ luật

- CN-07.1: Đếm số ngày tự ý bỏ việc không lý do chính đáng theo **cửa sổ trượt 30 ngày và 365 ngày**.

- CN-07.2: Tự sinh cảnh báo cho HR và quản lý khi chạm các ngưỡng 3 / 4 / 5 / 20 ngày (xem Mục 4.5).

- CN-07.3: Hỗ trợ kết xuất danh sách NLĐ vi phạm phục vụ xử lý kỷ luật.

## 3.8. QH-08 – Báo cáo và bảng công

- CN-08.1: Bảng công tháng theo NLĐ/đơn vị (ngày công, công OT, ngày nghỉ phân loại).

- CN-08.2: Thống kê đi trễ/về sớm/vắng theo kỳ.

- CN-08.3: Kết xuất Excel theo định dạng phục vụ tính lương.

- CN-08.4: Khóa kỳ công sau khi chốt; chỉ HR/Admin được mở khóa, có lưu vết.

## 3.9. QH-09 – Quản trị hệ thống

- CN-09.1: Quản lý người dùng, vai trò và phân quyền theo Mục 7.

- CN-09.2: Cấu hình tham số (giờ HC, danh mục ca, ngày lễ, ngưỡng kỷ luật, định mức nghỉ).

- CN-09.3: Nhật ký hệ thống (audit log) cho các thao tác quan trọng.

# 4. QUY TẮC NGHIỆP VỤ (Business Rules)

Các quy tắc dưới đây được trích trực tiếp từ Nội quy lao động và Bộ luật Lao động 2019; hệ thống phải tự động kiểm soát.

## 4.1. Thời giờ làm việc

| **Quy tắc** | **Nội dung** |
| --- | --- |
| Giờ hành chính | Sáng 07:30–11:30; Chiều 13:00–17:00. |
| Khối gián tiếp | Làm theo ngày; 40 giờ/tuần; nghỉ Chủ nhật; không quá 8 giờ/ngày, 48 giờ/tuần. |
| Khối trực tiếp | Làm theo ca/khoán; ca xoay vòng ≤10 giờ/ngày, ≤48 giờ/tuần. |
| Nghỉ giữa giờ | ≥30 phút (ca ngày ≥6 giờ); ≥45 phút (làm ban đêm); ca liên tục ≥6 giờ tính nghỉ vào giờ làm. |
| Nghỉ chuyển ca | ≥12 giờ trước khi chuyển sang ca khác. |
| Nghỉ hằng tuần | ≥24 giờ liên tục mỗi tuần. |

## 4.2. Chấm công

- Đơn vị bắt buộc chấm công hàng ngày (Điều 7.3 NQLĐ).

- Đi trễ, về sớm, hoặc vắng mặt đúng giờ ở họp/học tập/hội nghị → **xem như tự ý bỏ việc của ngày hôm đó**.

- Làm thêm sau giờ phải có ý kiến đồng ý của Trưởng/Phó đơn vị (Điều 7.7 NQLĐ).

## 4.3. Làm thêm giờ (OT)

| **Giới hạn / Hệ số** | **Giá trị** |
| --- | --- |
| OT tối đa trong ngày | ≤50% số giờ làm bình thường; theo tuần tổng ≤12 giờ/ngày. |
| OT tối đa trong tháng | ≤40 giờ. |
| OT tối đa trong năm | ≤200 giờ (trừ trường hợp Điều 61 NĐ 145/2020). |
| Hệ số ngày thường | ≥150%. |
| Hệ số ngày nghỉ hằng tuần | ≥200%. |
| Hệ số ngày lễ, tết, nghỉ hưởng lương | ≥300%. |
| Phụ cấp làm ban đêm | +30%. |
| OT vào ban đêm | Cộng thêm 20% ngoài các hệ số trên. |

## 4.4. Các loại nghỉ và định mức

| **Loại nghỉ** | **Định mức** | **Hưởng lương** |
| --- | --- | --- |
| Phép năm – điều kiện bình thường | 12 ngày/năm | Có |
| Phép năm – nặng nhọc/độc hại/chưa thành niên/khuyết tật | 14 ngày/năm | Có |
| Phép năm – đặc biệt nặng nhọc | 16 ngày/năm | Có |
| Thâm niên (mỗi đủ 5 năm +1 ngày) | +1, +2, … | Có |
| Kết hôn bản thân | 3 ngày | Có |
| Con (đẻ/nuôi) kết hôn | 1 ngày | Có |
| Tang cha/mẹ (kể cả bên vợ/chồng), vợ/chồng, con | 3 ngày | Có |
| Ông bà/anh chị em ruột mất; cha/mẹ tái hôn; anh chị em ruột cưới | 1 ngày | Không |
| Nghỉ không lương thỏa thuận | Theo thỏa thuận | Không |
| Nghỉ lễ, tết | 11 ngày/năm | Có |

## 4.5. Ngưỡng kỷ luật theo vắng mặt

Áp dụng cho hành vi tự ý bỏ việc không có lý do chính đáng (Điều 33, 34, 35 NQLĐ):

| **Số ngày bỏ việc (cộng dồn)** | **Hình thức kỷ luật** |
| --- | --- |
| 3 ngày trong 30 ngày | Khiển trách |
| 4 ngày trong 30 ngày | Kéo dài thời hạn nâng lương ≤6 tháng |
| 5 ngày trong 30 ngày HOẶC 20 ngày trong 365 ngày | Sa thải |

**Lưu ý: **hệ thống cảnh báo sớm khi NLĐ tiến gần ngưỡng để đơn vị kịp thời nhắc nhở; không tự động ra quyết định kỷ luật.

# 5. MÔ HÌNH DỮ LIỆU

Mỗi thực thể tương ứng một bảng (trên Google Sheets là một sheet). Khóa chính in đậm.

### 5.1. NhanVien

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maNV (PK) | Văn bản | Mã nhân viên duy nhất. |
| hoTen | Văn bản | Họ và tên. |
| donVi | Văn bản | Phòng/đơn vị/tổ đội. |
| khoi | Danh mục | Gián tiếp / Trực tiếp. |
| chucDanh | Văn bản | Chức danh công việc. |
| dieuKienCV | Danh mục | Bình thường / Nặng nhọc / Đặc biệt nặng nhọc. |
| ngayVaoLam | Ngày | Dùng tính thâm niên và quota phép. |
| quanLyTrucTiep | Văn bản | maNV người duyệt cấp 1. |
| trangThai | Danh mục | Đang làm / Thử việc / Nghỉ việc. |
| email | Văn bản | Tài khoản đăng nhập và nhận thông báo. |

### 5.2. Ca

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maCa (PK) | Văn bản | Mã ca. |
| tenCa | Văn bản | Ví dụ: Hành chính, Trực đêm. |
| gioBatDau | Giờ | Giờ bắt đầu ca. |
| gioKetThuc | Giờ | Giờ kết thúc ca. |
| banDem | Đúng/Sai | Đánh dấu ca đêm (áp phụ cấp). |

### 5.3. LichTruc

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maLT (PK) | Văn bản | Mã phân ca. |
| maNV (FK) | Văn bản | Nhân viên được phân. |
| ngay | Ngày | Ngày làm việc. |
| maCa (FK) | Văn bản | Ca được phân. |

### 5.4. ChamCong

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maCC (PK) | Văn bản | Mã bản ghi. |
| maNV (FK) | Văn bản | Nhân viên. |
| ngay | Ngày | Ngày công. |
| maCa (FK) | Văn bản | Ca tham chiếu. |
| gioVao / gioRa | Giờ | Mốc vào/ra. |
| nguon | Danh mục | Trụ sở / GPS hiện trường / Khai báo. |
| toaDo | Văn bản | Tọa độ GPS (nếu hiện trường). |
| trangThai | Danh mục | Đủ công / Trễ / Sớm / Mất công / Vắng phép / Vắng không phép. |

### 5.5. DonTu

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maDon (PK) | Văn bản | Mã đơn. |
| maNV (FK) | Văn bản | Người tạo đơn. |
| loaiDon | Danh mục | Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài. |
| tuNgay / denNgay | Ngày | Khoảng thời gian nghỉ. |
| soNgay | Số | Số ngày/giờ quy đổi. |
| lyDo | Văn bản | Lý do. |
| dinhKem | Tệp | Minh chứng (tùy chọn). |
| trangThai | Danh mục | Chờ duyệt / Đã duyệt / Từ chối / Bổ sung / Thu hồi. |

### 5.6. BuocDuyet

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maBuoc (PK) | Văn bản | Mã bước duyệt. |
| maDon (FK) | Văn bản | Đơn liên quan. |
| capDuyet | Số | Thứ tự cấp (1, 2, 3…). |
| nguoiDuyet | Văn bản | maNV người duyệt. |
| ketQua | Danh mục | Duyệt / Từ chối / Yêu cầu bổ sung. |
| yKien | Văn bản | Ý kiến phê duyệt. |
| thoiDiem | Ngày giờ | Mốc duyệt (lưu vết). |

### 5.7. SoDuPhep

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maNV (PK) | Văn bản | Nhân viên. |
| nam | Số | Năm áp dụng. |
| quota | Số | Tổng phép năm (gồm thâm niên). |
| daDung | Số | Số ngày đã nghỉ. |
| conLai | Số | quota − daDung. |

### 5.8. CanhBaoKyLuat

| **Trường** | **Kiểu** | **Mô tả** |
| --- | --- | --- |
| maCB (PK) | Văn bản | Mã cảnh báo. |
| maNV (FK) | Văn bản | Nhân viên. |
| soNgayBoViec30 | Số | Số ngày bỏ việc cộng dồn trong 30 ngày. |
| soNgayBoViec365 | Số | Số ngày bỏ việc cộng dồn trong 365 ngày. |
| mucCanhBao | Danh mục | Khiển trách / Kéo dài nâng lương / Sa thải. |
| thoiDiem | Ngày giờ | Thời điểm phát sinh cảnh báo. |

# 6. QUY TRÌNH NGHIỆP VỤ

## 6.1. Luồng chấm công hàng ngày

- NLĐ chấm công vào đầu ca (web tại trụ sở hoặc GPS tại hiện trường).

- Hệ thống kiểm tra so với giờ ca: nếu trễ → đánh dấu trạng thái Trễ.

- NLĐ chấm công ra cuối ca; nếu về sớm → đánh dấu Sớm.

- Hệ thống xác định trạng thái ngày: đủ công, mất công ngày (trễ/sớm/vắng họp), hoặc vắng.

- Trường hợp vắng nhưng có đơn đã duyệt → ghi nhận Vắng có phép, không tính bỏ việc.

## 6.2. Luồng tạo và duyệt đơn

Luồng duyệt được định tuyến theo thẩm quyền nêu trong Nội quy lao động (Trưởng phòng / Trưởng đơn vị / Chỉ huy trưởng công trường / Đội trưởng thi công; NSDLĐ là Tổng Giám đốc hoặc người được ủy quyền):

**NLĐ tạo đơn  →  Tổ trưởng/Đội trưởng (cấp 1) duyệt  →  Trưởng/Phó đơn vị (cấp 2) duyệt  →  ***[nếu nghỉ dài ngày hoặc không lương]***  Tổng GĐ/ủy quyền (cấp 3) duyệt  →  HR ghi nhận, trừ phép, khóa bảng công.**

| **Loại đơn** | **Cấp duyệt yêu cầu** | **Ghi chú** |
| --- | --- | --- |
| Phép năm ≤ 2 ngày | Cấp 1 → Cấp 2 | Định tuyến theo cây tổ chức. |
| Phép năm > 2 ngày | Cấp 1 → Cấp 2 → Cấp 3 | Ngưỡng số ngày cấu hình được. |
| Nghỉ việc riêng (hưởng lương) | Cấp 1 → Cấp 2 | Kiểm tra đúng định mức (Mục 4.4). |
| Nghỉ không lương | Cấp 1 → Cấp 2 → Cấp 3 | Bắt buộc duyệt cấp cao. |
| Làm thêm giờ (OT) | Trưởng/Phó đơn vị | Theo Điều 7.7; kiểm tra trần OT. |
| Công tác / Ra ngoài trong giờ | Cấp 1 | Lưu vết để không tính bỏ việc. |

## 6.3. Luồng tính số dư phép

- Đầu năm: hệ thống tính quota = số ngày cơ bản (12/14/16) + ⌊thâm niên ÷ 5⌋.

- NLĐ chưa đủ 12 tháng: quota theo tỷ lệ số tháng làm việc.

- Khi đơn phép năm được duyệt cuối: trừ vào daDung, cập nhật conLai.

- Khi đơn bị hủy/thu hồi sau duyệt: hoàn lại số dư.

- Cuối năm: báo cáo phép tồn để xử lý theo quy định.

## 6.4. Luồng cảnh báo kỷ luật

- Mỗi ngày, hệ thống quét các ngày Vắng không phép của từng NLĐ.

- Đếm cộng dồn theo cửa sổ trượt 30 ngày và 365 ngày.

- So ngưỡng 3 / 4 / 5 / 20 ngày và sinh bản ghi CanhBaoKyLuat tương ứng.

- Thông báo cho HR và quản lý đơn vị; không tự động kết luận kỷ luật.

# 7. MA TRẬN PHÂN QUYỀN

Ký hiệu: ✓ = được phép; – = không.

| **Chức năng** | **NV** | **Tổ/Đội** | **Đơn vị** | **BGĐ** | **HR** | **Admin** |
| --- | --- | --- | --- | --- | --- | --- |
| Chấm công cá nhân | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tạo đơn | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Duyệt cấp 1 | – | ✓ | ✓ | ✓ | – | – |
| Duyệt cấp 2 | – | – | ✓ | ✓ | – | – |
| Duyệt cấp 3 (đặc biệt) | – | – | – | ✓ | – | – |
| Phân ca | – | ✓ | ✓ | – | ✓ | ✓ |
| Quản lý quota phép | – | – | – | – | ✓ | ✓ |
| Khóa/mở bảng công | – | – | – | – | ✓ | ✓ |
| Xem cảnh báo kỷ luật | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| Kết xuất lương | – | – | – | ✓ | ✓ | ✓ |
| Cấu hình tham số / phân quyền | – | – | – | – | – | ✓ |

# 8. BẢNG ĐỐI CHIẾU TUÂN THỦ (Nội quy ↔ Chức năng)

Bảng truy vết chứng minh mỗi quy định trọng yếu của Nội quy lao động đều được hiện thực bằng một chức năng cụ thể của hệ thống.

| **Điều khoản NQLĐ** | **Nội dung quy định** | **Chức năng đáp ứng** |
| --- | --- | --- |
| Điều 21 / Điều 5 | Giờ HC 7:30–11:30, 13:00–17:00; gián tiếp 40h/tuần; trực tiếp theo ca. | CN-02.1, CN-03.3 (cấu hình giờ ca, xác định trạng thái công). |
| Điều 22 (nghỉ chuyển ca) | Nghỉ ≥12 giờ trước khi chuyển ca. | CN-02.3 (cảnh báo khoảng nghỉ <12h). |
| Điều 23 (nghỉ tuần) | ≥24 giờ nghỉ liên tục/tuần. | CN-02.4 (cảnh báo thiếu nghỉ tuần). |
| Điều 24 / Điều 5.7 (lễ tết) | 11 ngày lễ, tết hưởng nguyên lương. | CN-09.2 (danh mục ngày lễ), CN-08.1. |
| Điều 25, 26 (phép năm) | Phép 12/14/16 ngày + thâm niên. | CN-06.1, CN-06.2 (tính quota). |
| Điều 27 / Điều 5.8 (việc riêng) | Định mức nghỉ việc riêng/không lương. | CN-04.1, CN-06.4 (kiểm tra định mức). |
| Điều 5.3 (OT) | Trần OT 40h/tháng, 200h/năm; hệ số lương. | CN-04.2, CN-07 (kiểm tra trần OT), CN-08. |
| Điều 7.3 (chấm công) | Chấm công hàng ngày; trễ/sớm = bỏ việc ngày đó. | CN-03.1→03.4 (lõi quy tắc chấm công). |
| Điều 7.7 (làm thêm) | Làm thêm phải có đồng ý Trưởng/Phó đơn vị. | CN-05.1 (định tuyến duyệt OT). |
| Điều 28 (xử lý kỷ luật) | Phải lập biên bản, có lưu vết. | CN-05.3 (lưu vết phê duyệt đầy đủ). |
| Điều 33 (khiển trách) | Bỏ việc 3 ngày/30 ngày. | CN-07.1, CN-07.2 (cảnh báo ngưỡng 3). |
| Điều 34 (kéo dài nâng lương) | Bỏ việc 4 ngày/30 ngày. | CN-07.2 (cảnh báo ngưỡng 4). |
| Điều 35 (sa thải) | Bỏ việc 5 ngày/30 hoặc 20 ngày/365. | CN-07.1, CN-07.2 (cảnh báo ngưỡng 5/20). |

# 9. YÊU CẦU PHI CHỨC NĂNG

- **Bảo mật: **đăng nhập theo tài khoản, phân quyền theo vai trò; nhật ký thao tác quan trọng.

- **Toàn vẹn dữ liệu: **mốc thời gian chấm công lấy từ máy chủ; không cho sửa lịch sử nếu không có quyền và lý do.

- **Khả dụng: **giao diện thân thiện trên điện thoại để chấm công hiện trường.

- **Hiệu năng: **đáp ứng tốt cho quy mô vài trăm NLĐ; bảng công tháng kết xuất dưới vài giây.

- **Khả năng cấu hình: **giờ ca, ngày lễ, định mức nghỉ, ngưỡng kỷ luật đều chỉnh được mà không sửa mã nguồn.

- **Sao lưu: **dữ liệu được sao lưu định kỳ; khôi phục được khi sự cố.

# 10. LỘ TRÌNH TRIỂN KHAI

| **Giai đoạn** | **Phạm vi** | **Kết quả** |
| --- | --- | --- |
| GĐ 1 | QH-01, QH-02, QH-03 | Danh mục NLĐ, phân ca, chấm công cơ bản chạy được. |
| GĐ 2 | QH-04, QH-05 | Đơn từ và quy trình duyệt nhiều cấp. |
| GĐ 3 | QH-06, QH-08 | Số dư phép tự động và bảng công tháng xuất Excel. |
| GĐ 4 | QH-07, QH-09 | Cảnh báo kỷ luật, báo cáo quản trị, hoàn thiện phân quyền. |

# 11. PHỤ LỤC

## 11.1. Danh mục loại đơn

- Đơn nghỉ phép năm.

- Đơn nghỉ việc riêng (hưởng lương).

- Đơn nghỉ không hưởng lương.

- Đơn đăng ký làm thêm giờ (OT).

- Đơn công tác.

- Đơn ra ngoài trong giờ làm việc.

## 11.2. Trường thông tin tối thiểu của một đơn xin phép

- Người tạo, đơn vị, loại đơn, từ ngày – đến ngày, số ngày/giờ, lý do, minh chứng (nếu có), người duyệt từng cấp, trạng thái.

## 11.3. Cấu hình tham số hệ thống (gợi ý)

- Giờ ca hành chính và danh mục ca.

- Danh sách ngày nghỉ lễ, tết trong năm.

- Định mức từng loại nghỉ việc riêng/không lương.

- Ngưỡng cảnh báo kỷ luật (mặc định 3/4/5/20 ngày).

- Ngưỡng số ngày phép yêu cầu duyệt cấp cao.