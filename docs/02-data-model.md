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
| vaiTro | enum | NV / ToTruong / TruongDonVi / BGD / HR / Admin |
| matKhau | text | Hash SHA-256 (kèm salt, 1000 vòng) — KHÔNG lưu thô |
| salt | text | Muối ngẫu nhiên cho hash mật khẩu |
| phaiDoiMK | bool | TRUE → ép đổi mật khẩu lần đăng nhập kế tiếp (NC-A) |

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
> Khoá logic: **(maNV, ngày, maCa)** — hỗ trợ đa ca/ngày. `maCC = CC_<maNV>_<yyyyMMdd>_<maCa>`. Xem docs/10.

| maCC (PK) | text | |
| maNV (FK) | text | |
| ngay | date | Ngày VN của lần chấm vào |
| maCa (FK) | text | |
| gioVao / gioRa | datetime | ISO giờ VN (+07:00), vd `2026-06-22T09:33:08+07:00` |
| nguon | enum | Trụ sở / GPS hiện trường / Khai báo |
| toaDo | text | GPS lat,lng (nếu hiện trường) |
| trangThai | enum | Đủ công / Trễ / Sớm / Mất công / Vắng phép / Vắng không phép |
| isLocked | bool | Đã khoá chốt công (HR) |
| soGioCong | number | Số giờ công thực tế (khối Trực tiếp / đa ca) |
| diaChi | text | Địa chỉ reverse-geocode khi chấm kèm GPS (đường, phường, quận) |

## DonTu
| maDon (PK) | text | |
| maNV (FK) | text | Người tạo |
| loaiDon | enum | Phép năm / Việc riêng / Không lương / OT / Công tác / Ra ngoài / Ốm đau / Chăm con ốm / Thai sản nữ / Thai sản nam / TNLĐ-BNN / Khám thai |
| donViTinh | enum | Ngày / Nửa ngày (hỗ trợ nghỉ ốm nửa ngày theo Luật BHXH 2024) |
| nguonChiTra | enum | Công ty / BHXH / Không lương |
| tuNgay / denNgay | date | |
| soNgay | number | Số ngày/giờ quy đổi |
| lyDo | text | |
| dinhKem | file | Minh chứng (URL Drive nếu upload file) |
| trangThai | enum | Chờ duyệt / Đã duyệt / Từ chối / Bổ sung / Thu hồi |
| ngayTao | datetime | ISO giờ VN (+07:00) |
| soGio | number | Số giờ (đơn OT) |
| lyDoDinhMuc | text | Lý do nghỉ việc riêng có định mức (vd Kết hôn bản thân) |

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

## ThongBao (thông báo trong app — NC-E)
| maTB (PK) | text | |
| maNV (FK) | text | Người nhận |
| noiDung | text | |
| link | text | Trang đích khi bấm |
| daDoc | bool | |
| thoiDiem | datetime | ISO giờ VN (+07:00) |

## BangCong (khoá chốt kỳ công — GĐ3)
| ky (PK) | text | Kỳ công (vd 2026-06) |
| maNV (PK) | text | |
| isLocked | bool | Đã khoá kỳ |
| nguoiKhoa | text | maNV người khoá |
| thoiDiemKhoa | datetime | ISO giờ VN (+07:00) |

## AuditLog (nhật ký — lưu vết Điều 28)
| maLog (PK) | text | |
| thoiDiem | datetime | ISO giờ VN (+07:00) |
| maNV / email | text | Người thao tác (SYSTEM nếu tự động) |
| action | text | CHAM_VAO / DUYET_DON / BACKUP / ARCHIVE_CHAMCONG… |
| doiTuong | text | Sheet/đối tượng tác động |
| chiTiet | json | Chi tiết thay đổi (cũ → mới) |

## CauHinh (tham số hệ thống — không hardcode)
| key | Ví dụ giá trị | Mô tả |
|-----|---------------|-------|
| ma_ca_mac_dinh | CA_HC | Ca mặc định khối gián tiếp |
| grace_minutes | 0 | Phút ân hạn trễ/sớm |
| luong_toi_thieu_vung | 5310000 | Vùng I (TP.HCM), NĐ 293/2025 |
| ty_le_bhxh_nld / ty_le_bhxh_dn | 10.5 / 21.5 | % NLĐ / DN đóng |
| dinh_muc_con_om_duoi3 / _3den7 | 20 / 15 | Ngày chăm con ốm |
| nguong_ky_luat_30_khien/_keo/_sa | 3 / 4 / 5 | Ngày bỏ việc/30 → kỷ luật |
| nguong_ky_luat_365_sa | 20 | Ngày bỏ việc/365 → sa thải |
| nguong_duyet_cap_cao | 2 | Phép > N ngày phải duyệt cấp 3 |
| phep_co_ban_binh_thuong/_nang_nhoc/_dac_biet | 12 / 14 / 16 | Phép năm cơ bản theo điều kiện |
| ngay_cat_ky_cong | 21 | Ngày cắt kỳ công (21 tháng trước → 20 tháng này) |
| dang_nhap_toi_da / dang_nhap_khoa_phut | 5 / 15 | Khoá đăng nhập sau N lần sai (NC-B) |
| ot_max_thang / ot_max_nam | 40 / 200 | Trần OT (NC-C) |
| dinh_muc_viec_rieng | (JSON) | Định mức nghỉ việc riêng theo lý do (NC-D) |
| gio_toi_da_ngay | 12 | Trần giờ làm/ngày — cảnh báo (docs/10) |
| nghi_tuan_toi_thieu_gio | 24 | Nghỉ tuần tối thiểu — cảnh báo (docs/10) |
| kiem_tra_dia_ban | TRUE | Bật kiểm tra địa bàn GPS (docs/10) |
| dia_ban_cho_phep | (JSON) | Địa bàn cho phép `{quan,khuVuc,loaiTru}` |
| geocode_email | admin@cscc.vn | Email gửi kèm yêu cầu Nominatim |
| ngay_le_tet | (danh sách) | Lịch nghỉ lễ trong năm |
| timezone | Asia/Ho_Chi_Minh | Múi giờ hệ thống |

> **Sheet lưu trữ/sao lưu** (không phải bảng nghiệp vụ): bản sao spreadsheet trong Drive `CSCC_ChamCong_Backup`; dữ liệu ChamCong cũ archive sang spreadsheet `CSCC_ChamCong_LuuTru`. Xem docs/11.
