# 02 — Mô hình dữ liệu

Mỗi thực thể = 1 bảng (trên Google Sheets là 1 sheet). Khóa chính ghi (PK), khóa ngoại (FK).

## NhanVien
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| maNV (PK) | text | Mã nhân viên |
| hoTen | text | Họ tên |
| donVi | text | Phòng/đơn vị/tổ đội |
| khoi | enum | Gián tiếp / Trực tiếp |
| chucDanh | text | Chức danh |
| dieuKienCV | enum | Bình thường / Nặng nhọc / Đặc biệt nặng nhọc |
| ngayVaoLam | date | Tính thâm niên + quota phép |
| quanLyTrucTiep | text | maNV người duyệt cấp 1 |
| trangThai | enum | Đang làm / Thử việc / Nghỉ việc |
| email | text | Đăng nhập + nhận thông báo |

## Ca
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| maCa (PK) | text | Mã ca |
| tenCa | text | Hành chính / Trực đêm… |
| gioBatDau | time | |
| gioKetThuc | time | |
| banDem | bool | Áp phụ cấp ca đêm |

## LichTruc
| maLT (PK) | text | Mã phân ca |
| maNV (FK) | text | Nhân viên |
| ngay | date | |
| maCa (FK) | text | Ca được phân |

## ChamCong
| maCC (PK) | text | |
| maNV (FK) | text | |
| ngay | date | |
| maCa (FK) | text | |
| gioVao / gioRa | time | |
| nguon | enum | Trụ sở / GPS hiện trường / Khai báo |
| toaDo | text | GPS (nếu hiện trường) |
| trangThai | enum | Đủ công / Trễ / Sớm / Mất công / Vắng phép / Vắng không phép |

## DonTu
| maDon (PK) | text | |
| maNV (FK) | text | Người tạo |
| loaiDon | enum | Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài / Ốm đau / Chăm con ốm / Thai sản nữ / Thai sản nam / TNLĐ-BNN / Khám thai |
| donViTinh | enum | Ngày / Nửa ngày (hỗ trợ nghỉ ốm nửa ngày theo Luật BHXH 2024) |
| nguonChiTra | enum | Công ty / BHXH / Không lương |
| tuNgay / denNgay | date | |
| soNgay | number | Số ngày/giờ quy đổi |
| lyDo | text | |
| dinhKem | file | Minh chứng |
| trangThai | enum | Chờ duyệt / Đã duyệt / Từ chối / Bổ sung / Thu hồi |

## BuocDuyet
| maBuoc (PK) | text | |
| maDon (FK) | text | |
| capDuyet | number | 1, 2, 3… |
| nguoiDuyet | text | maNV |
| ketQua | enum | Duyệt / Từ chối / Yêu cầu bổ sung |
| yKien | text | |
| thoiDiem | datetime | Lưu vết |

## SoDuPhep
| maNV (PK) | text | |
| nam | number | |
| quota | number | Tổng phép (gồm thâm niên) |
| daDung | number | |
| conLai | number | quota − daDung |

## CanhBaoKyLuat
| maCB (PK) | text | |
| maNV (FK) | text | |
| soNgayBoViec30 | number | Cộng dồn 30 ngày |
| soNgayBoViec365 | number | Cộng dồn 365 ngày |
| mucCanhBao | enum | Khiển trách / Kéo dài nâng lương / Sa thải |
| thoiDiem | datetime | |

## CauHinh (tham số hệ thống — không hardcode)
| key | Ví dụ giá trị | Mô tả |
|-----|---------------|-------|
| gio_hc_sang | 07:30-11:30 | Giờ hành chính sáng |
| gio_hc_chieu | 13:00-17:00 | Giờ hành chính chiều |
| luong_toi_thieu_vung | 5310000 | Vùng I (TP.HCM), NĐ 293/2025 |
| ty_le_bhxh_nld | 10.5 | % NLĐ đóng |
| ty_le_bhxh_dn | 21.5 | % doanh nghiệp đóng |
| dinh_muc_om_dau | (theo điều kiện) | Số ngày ốm đau/năm |
| dinh_muc_con_om_duoi3 | 20 | Ngày chăm con <3 tuổi |
| dinh_muc_con_om_3den7 | 15 | Ngày chăm con 3–<7 tuổi |
| nguong_ky_luat | 3/4/5/20 | Ngày bỏ việc → kỷ luật |
| nguong_duyet_cap_cao | 2 | Phép > N ngày phải duyệt cấp 3 |
| ngay_le_tet | (danh sách) | Lịch nghỉ lễ trong năm |
