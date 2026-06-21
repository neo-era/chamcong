// ─── NhanSuImport.gs ──────────────────────────────────────────────────────────
// Import 45 nhân sự từ "Bang tong hop nhan su CSKVTT 2026.xlsx".
// Chạy 1 lần trong Editor: chọn importNhanSu → Run. An toàn khi chạy lại (bỏ qua maNV đã có).
//
// Email theo tên: viết tắt chữ đầu các từ + từ cuối đầy đủ, bỏ dấu (vd "Mạch Ngọc Huy" → mnhuy@cscc.vn).
// Trùng tên → thêm số của mã NV (vd hai "Lê Văn Hùng" → lvhung1830 / lvhung1840).
// Mật khẩu mặc định: 123456.
//
// CẦN BỔ SUNG SAU (trang Nhân viên): ngayVaoLam, quanLyTrucTiep, rà lại vaiTro & dieuKienCV.

function importNhanSu() {
  addMatKhauColumn();
  var ds = [
  {
    "maNV": "L2085",
    "hoTen": "Mai Vũ Lâm",
    "donVi": "CSKV B",
    "khoi": "Gián tiếp",
    "chucDanh": "GĐ CSKVTT",
    "vaiTro": "BGD",
    "email": "mvlam@cscc.vn"
  },
  {
    "maNV": "H1930",
    "hoTen": "MẠCH NGỌC HUY",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "P.GĐ CSKVTT",
    "vaiTro": "BGD",
    "email": "mnhuy@cscc.vn"
  },
  {
    "maNV": "H1830",
    "hoTen": "LÊ VĂN HÙNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "GĐ XNCS Chợ Lớn",
    "vaiTro": "TruongDonVi",
    "email": "lvhung1830@cscc.vn"
  },
  {
    "maNV": "T3205",
    "hoTen": "LÊ TÔN QUANG THỨC",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "GĐ BKHĐT",
    "vaiTro": "TruongDonVi",
    "email": "ltqthuc@cscc.vn"
  },
  {
    "maNV": "L2235",
    "hoTen": "TRẦN HỮU LƯU",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "GĐ XNCS Sài Gòn",
    "vaiTro": "TruongDonVi",
    "email": "thluu@cscc.vn"
  },
  {
    "maNV": "H1840",
    "hoTen": "LÊ VĂN HÙNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "Cán sự",
    "vaiTro": "NV",
    "email": "lvhung1840@cscc.vn"
  },
  {
    "maNV": "N2400",
    "hoTen": "NGUYỄN QUANG NGHĨA",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CHUYÊN VIÊN",
    "vaiTro": "NV",
    "email": "nqnghia@cscc.vn"
  },
  {
    "maNV": "T4245",
    "hoTen": "PHẠM VĂN TÍNH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "pvtinh@cscc.vn"
  },
  {
    "maNV": "V3600",
    "hoTen": "PHẠM TẤN VIỆT",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CHUYÊN VIÊN",
    "vaiTro": "NV",
    "email": "ptviet@cscc.vn"
  },
  {
    "maNV": "P4250",
    "hoTen": "LÊ HỒNG PHÚC",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CHUYÊN VIÊN",
    "vaiTro": "NV",
    "email": "lhphuc@cscc.vn"
  },
  {
    "maNV": "A1015",
    "hoTen": "TRƯƠNG THÀNH AN",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÁN SỰ",
    "vaiTro": "NV",
    "email": "ttan@cscc.vn"
  },
  {
    "maNV": "L2220",
    "hoTen": "CHÂU THÀNH LUÂN",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÁN SỰ",
    "vaiTro": "NV",
    "email": "ctluan@cscc.vn"
  },
  {
    "maNV": "D1340",
    "hoTen": "ĐỖ TIẾN ĐẠT",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "dtdat@cscc.vn"
  },
  {
    "maNV": "C1305",
    "hoTen": "PHẠM XUÂN CƯỜNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "pxcuong@cscc.vn"
  },
  {
    "maNV": "H1860",
    "hoTen": "NGUYỄN TRẦN HÙNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nthung@cscc.vn"
  },
  {
    "maNV": "V3605",
    "hoTen": "NGUYỄN BÁ VINH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nbvinh@cscc.vn"
  },
  {
    "maNV": "B1110",
    "hoTen": "BÙI VĂN BÌNH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "bvbinh@cscc.vn"
  },
  {
    "maNV": "T3075",
    "hoTen": "NGUYỄN TRỌNG THI",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "ntthi@cscc.vn"
  },
  {
    "maNV": "T2880",
    "hoTen": "VÕ MINH TÀI",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "vmtai@cscc.vn"
  },
  {
    "maNV": "A1025",
    "hoTen": "TRẦN VĂN ÂN",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "tvan@cscc.vn"
  },
  {
    "maNV": "T2845",
    "hoTen": "HỒ TẤN TÀI",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "httai@cscc.vn"
  },
  {
    "maNV": "T3215",
    "hoTen": "TRẦN THANH THỦY",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "NHÂN VIÊN",
    "vaiTro": "NV",
    "email": "ttthuy@cscc.vn"
  },
  {
    "maNV": "H1980",
    "hoTen": "CHUNG HOÀNG HUYNH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "Phụ trách kho",
    "vaiTro": "NV",
    "email": "chhuynh@cscc.vn"
  },
  {
    "maNV": "P2605",
    "hoTen": "TRẦN CAO PHƯỚC",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "tcphuoc@cscc.vn"
  },
  {
    "maNV": "T3225",
    "hoTen": "NGUYỄN QUÍ TIÊN",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nqtien@cscc.vn"
  },
  {
    "maNV": "H1885",
    "hoTen": "TRƯƠNG KHÁNH HÙNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "tkhung@cscc.vn"
  },
  {
    "maNV": "C1175",
    "hoTen": "PHẠM MINH CHÁNH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "pmchanh@cscc.vn"
  },
  {
    "maNV": "T4165",
    "hoTen": "HỒ PHÚ TRƯỜNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "hptruong@cscc.vn"
  },
  {
    "maNV": "D1400",
    "hoTen": "NGUYỄN HỮU ĐỨC",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nhduc@cscc.vn"
  },
  {
    "maNV": "P2645",
    "hoTen": "NGUYỄN THÀNH PHƯƠNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "Đội trưởng",
    "vaiTro": "ToTruong",
    "email": "ntphuong@cscc.vn"
  },
  {
    "maNV": "K2000",
    "hoTen": "TỐNG VĂN KHANH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "tvkhanh@cscc.vn"
  },
  {
    "maNV": "D1370",
    "hoTen": "TRẦN ĐỨC ĐỊNH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "tddinh@cscc.vn"
  },
  {
    "maNV": "H1715",
    "hoTen": "NGUYỄN CHÍ HIẾU",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nchieu@cscc.vn"
  },
  {
    "maNV": "H1635",
    "hoTen": "NGUYỄN VĂN HẬU",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nvhau@cscc.vn"
  },
  {
    "maNV": "P2595",
    "hoTen": "NGUYỄN BÁ PHƯỚC",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nbphuoc@cscc.vn"
  },
  {
    "maNV": "T3120",
    "hoTen": "LÊ THỌ",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "ltho@cscc.vn"
  },
  {
    "maNV": "T3545",
    "hoTen": "NGUYỄN ĐÔNG TÙNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "Đội trưởng",
    "vaiTro": "ToTruong",
    "email": "ndtung@cscc.vn"
  },
  {
    "maNV": "B1115",
    "hoTen": "DƯƠNG VĂN BÌNH",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "dvbinh@cscc.vn"
  },
  {
    "maNV": "N2455",
    "hoTen": "HỒ VĂN NHÂN",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "hvnhan@cscc.vn"
  },
  {
    "maNV": "H1905",
    "hoTen": "TĂNG QUỐC HƯNG",
    "donVi": "CSKV TT",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "tqhung@cscc.vn"
  },
  {
    "maNV": "H4535",
    "hoTen": "Đào Thế Hiển",
    "donVi": "",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "dthien@cscc.vn"
  },
  {
    "maNV": "N4545",
    "hoTen": "Nguyễn Trần Hiếu Nghĩa",
    "donVi": "",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "nthnghia@cscc.vn"
  },
  {
    "maNV": "K4625",
    "hoTen": "Đoàn Tuấn Kiệt",
    "donVi": "",
    "khoi": "Gián tiếp",
    "chucDanh": "CÔNG NHÂN",
    "vaiTro": "NV",
    "email": "dtkiet@cscc.vn"
  },
  {
    "maNV": "P4540",
    "hoTen": "Nguyễn Thị Thanh Phượng",
    "donVi": "",
    "khoi": "Gián tiếp",
    "chucDanh": "NHÂN VIÊN",
    "vaiTro": "NV",
    "email": "nttphuong@cscc.vn"
  },
  {
    "maNV": "H1575",
    "hoTen": "Đặng Tuấn Hải",
    "donVi": "",
    "khoi": "Gián tiếp",
    "chucDanh": "Kỹ sư",
    "vaiTro": "NV",
    "email": "dthai@cscc.vn"
  }
];
  var ok = 0, skip = 0, err = 0;
  ds.forEach(function (n) {
    try {
      if (!getNVByMa(n.maNV)) {
        createNV({
          maNV: n.maNV, hoTen: n.hoTen, donVi: n.donVi, khoi: n.khoi,
          chucDanh: n.chucDanh, dieuKienCV: 'Bình thường', ngayVaoLam: '',
          quanLyTrucTiep: '', trangThai: 'Đang làm', email: n.email, vaiTro: n.vaiTro
        });
        ok++;
      } else { skip++; }
      setPassword(n.maNV, '123456');
    } catch (e) { err++; Logger.log('LỖI ' + n.maNV + ': ' + e.message); }
  });
  Logger.log('✓ Import nhân sự: tạo ' + ok + ', bỏ qua(đã có) ' + skip + ', lỗi ' + err + ' / tổng ' + ds.length);
}
