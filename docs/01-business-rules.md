# 01 — Quy tắc nghiệp vụ (Business Rules)

Trích từ Nội quy lao động (QĐ 44/QĐ-CTCSCC) và BLLĐ 2019. Hệ thống phải tự động kiểm soát.

## 1. Thời giờ làm việc

| Quy tắc | Nội dung |
|---------|----------|
| Giờ hành chính | Sáng 07:30–11:30; Chiều 13:00–17:00 |
| Khối gián tiếp | Theo ngày; 40h/tuần; nghỉ Chủ nhật; ≤8h/ngày, ≤48h/tuần |
| Khối trực tiếp | Theo ca/khoán; ca xoay vòng ≤10h/ngày, ≤48h/tuần |
| Nghỉ giữa giờ | ≥30 phút (ca ngày ≥6h); ≥45 phút (ban đêm); ca liên tục ≥6h tính nghỉ vào giờ làm |
| Nghỉ chuyển ca | ≥12h trước khi chuyển ca |
| Nghỉ hằng tuần | ≥24h liên tục/tuần |

## 2. Chấm công

- Đơn vị **bắt buộc chấm công hàng ngày** (Điều 7.3).
- Đi trễ / về sớm / vắng họp đúng giờ → **xem như tự ý bỏ việc của ngày hôm đó**.
- Làm thêm sau giờ phải có đồng ý Trưởng/Phó đơn vị (Điều 7.7).

## 3. Làm thêm giờ (OT)

| Giới hạn / Hệ số | Giá trị |
|------------------|---------|
| OT tối đa/ngày | ≤50% giờ thường; theo tuần tổng ≤12h/ngày |
| OT tối đa/tháng | ≤40h |
| OT tối đa/năm | ≤200h (trừ Điều 61 NĐ 145/2020) |
| Ngày thường | ≥150% |
| Ngày nghỉ tuần | ≥200% |
| Ngày lễ, tết | ≥300% |
| Phụ cấp ban đêm | +30% |
| OT ban đêm | +20% (ngoài các hệ số trên) |

## 4. Các loại nghỉ và định mức

| Loại nghỉ | Định mức | Hưởng lương |
|-----------|----------|-------------|
| Phép năm – bình thường | 12 ngày/năm | Có |
| Phép năm – nặng nhọc/độc hại/chưa thành niên/khuyết tật | 14 ngày/năm | Có |
| Phép năm – đặc biệt nặng nhọc | 16 ngày/năm | Có |
| Thâm niên (đủ 5 năm +1) | +1, +2… | Có |
| Kết hôn bản thân | 3 ngày | Có |
| Con kết hôn | 1 ngày | Có |
| Tang cha/mẹ (kể cả bên vợ/chồng), vợ/chồng, con | 3 ngày | Có |
| Ông bà/anh chị em ruột mất; cha/mẹ tái hôn; anh chị em ruột cưới | 1 ngày | Không |
| Không lương thỏa thuận | Theo thỏa thuận | Không |
| Lễ, tết | 11 ngày/năm | Có |

## 5. Ngưỡng kỷ luật theo vắng mặt

Áp dụng cho tự ý bỏ việc không lý do chính đáng (Điều 33, 34, 35):

| Số ngày (cộng dồn) | Hình thức |
|--------------------|-----------|
| 3 ngày / 30 ngày | Khiển trách |
| 4 ngày / 30 ngày | Kéo dài nâng lương ≤6 tháng |
| 5 ngày / 30 ngày HOẶC 20 ngày / 365 ngày | Sa thải |

Hệ thống **cảnh báo sớm**, không tự ra quyết định kỷ luật. Dùng thuật toán cửa sổ trượt 30/365 ngày.

## 6. Lương tối thiểu vùng & bảo hiểm (cập nhật 2026)

Chi tiết xem `05-legal-insurance.md`. Tóm tắt các con số đưa vào sheet CauHinh:

- **Lương tối thiểu Vùng I (TP.HCM) 2026:** 5.310.000 đ/tháng (25.500 đ/giờ) — NĐ 293/2025/NĐ-CP.
- **Tỷ lệ đóng:** tổng 32% (NLĐ 10,5% + DN 21,5%).
- Dùng lương tối thiểu vùng làm mốc cho ngưỡng bồi thường "10 tháng lương tối thiểu vùng" (Điều 35, 36 Nội quy).

## 7. Các loại nghỉ theo BHXH (Luật BHXH 2024)

Hệ thống phải hỗ trợ thêm các loại nghỉ này (do BHXH chi trả, phân biệt với nghỉ Công ty trả):

| Loại nghỉ | Định mức / Ghi chú | Nguồn chi trả |
|-----------|--------------------|---------------|
| Ốm đau (bản thân) | 75% lương đóng BHXH; **hỗ trợ nghỉ nửa ngày** | BHXH |
| Bệnh dài ngày | 30–70 ngày/năm tùy điều kiện làm việc | BHXH |
| Chăm con ốm | 20 ngày/năm/con (<3 tuổi); 15 ngày (3–<7 tuổi) | BHXH |
| Thai sản (nữ) | 6 tháng; sinh đôi +1 tháng/con; 100% bình quân | BHXH |
| Thai sản (nam, vợ sinh) | 5 / 7 / 10 / 14 ngày; nghỉ trong 60 ngày đầu | BHXH |
| TNLĐ – BNN | Theo chế độ; ghi nhận riêng (đặc thù chiếu sáng) | BHXH |

**Quy tắc nửa ngày:** nghỉ dưới nửa ngày tính nửa ngày; từ nửa đến dưới 1 ngày tính 1 ngày.
