# Hệ thống Chấm công – Nghỉ phép – Duyệt đơn

Phần mềm chấm công cho đơn vị **Chiếu sáng khu vực Trung tâm** (Công ty CP Chiếu sáng công cộng TP.HCM), tuân thủ Nội quy lao động của Công ty (QĐ số 44/QĐ-CTCSCC) và Bộ luật Lao động 2019.

## Mục tiêu

Số hóa toàn bộ nghiệp vụ quản lý thời gian làm việc: chấm công hàng ngày (văn phòng + hiện trường), quản lý ca/lịch trực, đơn từ, quy trình duyệt nhiều cấp, tính số dư phép tự động, cảnh báo ngưỡng kỷ luật, và kết xuất bảng công phục vụ tính lương.

## Stack đề xuất

| Lớp | Công nghệ |
|-----|-----------|
| Giao diện | React + Vite (hỗ trợ mobile để chấm công hiện trường) |
| Xử lý | Google Apps Script (Web App) — hoặc Node.js khi mở rộng |
| Dữ liệu | Google Sheets (quy mô đơn vị) — hoặc PostgreSQL khi mở rộng |
| Phân quyền | Theo email Google + vai trò |

> Phần đặc tả chức năng độc lập với lựa chọn công nghệ; có thể triển khai trên nền tảng khác.

## Cấu trúc thư mục

```
chamcong/
├── README.md                  # Tài liệu này
├── CLAUDE.md                  # Ngữ cảnh cho Claude Code
├── .gitignore
└── docs/
    ├── Dac_ta_phan_mem_cham_cong_CSCC_v1.0.docx   # Đặc tả SRS (bản Word chính thức)
    ├── 00-srs.md              # Đặc tả SRS (bản markdown để git theo dõi)
    ├── 01-business-rules.md   # Quy tắc nghiệp vụ (giờ làm, OT, nghỉ phép, kỷ luật)
    ├── 02-data-model.md       # Mô hình dữ liệu (các bảng/sheet)
    ├── 03-approval-workflow.md# Luồng duyệt đơn & ma trận phân quyền
    └── 04-compliance-matrix.md# Bảng đối chiếu Nội quy ↔ chức năng
```

## Lộ trình triển khai

| GĐ | Phạm vi | Kết quả |
|----|---------|---------|
| 1 | Nhân sự + Ca + Chấm công | Danh mục NLĐ, phân ca, chấm công cơ bản |
| 2 | Đơn từ + Quy trình duyệt | Đơn và duyệt nhiều cấp |
| 3 | Quản lý phép + Bảng công | Số dư phép tự động, xuất Excel |
| 4 | Cảnh báo kỷ luật + Quản trị | Cảnh báo ngưỡng, báo cáo, phân quyền |

## Quy ước

- Tài liệu Word là bản chính thức để trình ký; bản `.md` trong `docs/` là nguồn để git diff và cho Claude Code đọc.
- Tăng số phiên bản mỗi lần cập nhật tài liệu (v1.0 → v1.1 → …).
- Toàn bộ quy tắc nghiệp vụ lấy từ Nội quy lao động — xem `docs/01-business-rules.md`.
