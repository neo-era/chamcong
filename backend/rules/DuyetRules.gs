// ─── DuyetRules.gs ────────────────────────────────────────────────────────────
// Logic THUẦN cho quy trình duyệt đơn (docs/03-approval-workflow.md).
// KHÔNG truy cập Sheets. Nhận tham số, trả kết quả thuần.

const LOAI_DON = [
  'Phép năm', 'Việc riêng', 'Không lương', 'OT', 'Công tác', 'Ra ngoài',
  'Ốm đau', 'Chăm con ốm', 'Thai sản nữ', 'Thai sản nam', 'TNLĐ-BNN', 'Khám thai'
];

const TRANG_THAI_DON = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET:  'Đã duyệt',
  TU_CHOI:   'Từ chối',
  BO_SUNG:   'Bổ sung',
  THU_HOI:   'Thu hồi'
};

const KET_QUA_DUYET = ['Duyệt', 'Từ chối', 'Yêu cầu bổ sung'];

/**
 * Trả về danh sách quyền cần có cho từng bước duyệt, dựa vào
 * vaiTro và khoi của NV TẠO đơn (không phụ thuộc loại đơn).
 *
 *   BGD / TruongDonVi     → 1 cấp  ['DUYET_CAP3']
 *   Gián tiếp (NV / TT)   → 2 cấp  ['DUYET_CAP2', 'DUYET_CAP3']
 *   Trực tiếp (công nhân) → 3 cấp  ['DUYET_CAP1', 'DUYET_CAP2', 'DUYET_CAP3']
 *
 * @param {string} vaiTroNV  vaiTro của người tạo đơn
 * @param {string} khoiNV    khoi của người tạo đơn ('Gián tiếp' | 'Trực tiếp')
 * @returns {string[]}
 */
function capDuyetYeuCau(vaiTroNV, khoiNV) {
  if (['BGD', 'TruongDonVi'].includes(vaiTroNV)) {
    return ['DUYET_CAP3'];
  }
  if (khoiNV === 'Trực tiếp') {
    return ['DUYET_CAP1', 'DUYET_CAP2', 'DUYET_CAP3'];
  }
  return ['DUYET_CAP2', 'DUYET_CAP3']; // NV, ToTruong khối Gián tiếp
}

// Quyền cần có để duyệt bước thứ `cap` (1-indexed) của một đơn.
function quyenChoCap(yeuCau, cap) {
  return yeuCau[cap - 1] || null;
}

/**
 * Trạng thái đơn sau khi một bước duyệt hoàn tất.
 * @param {number} capHienTai  - cấp vừa duyệt (1-indexed)
 * @param {number} capToiDa    - tổng số cấp cần duyệt
 * @param {string} ketQua      - 'Duyệt' | 'Từ chối' | 'Yêu cầu bổ sung'
 */
function tinhTrangThaiSauBuoc(capHienTai, capToiDa, ketQua) {
  if (ketQua === 'Từ chối')          return TRANG_THAI_DON.TU_CHOI;
  if (ketQua === 'Yêu cầu bổ sung')  return TRANG_THAI_DON.BO_SUNG;
  // Duyệt
  return capHienTai >= capToiDa ? TRANG_THAI_DON.DA_DUYET : TRANG_THAI_DON.CHO_DUYET;
}

/**
 * Số ngày công của đơn. Loại T7/CN và ngày lễ (cho đơn theo giờ HC).
 * donViTinh 'Nửa ngày' → luôn 0.5.
 * @param {string} tuNgay   'yyyy-MM-dd'
 * @param {string} denNgay  'yyyy-MM-dd'
 * @param {string} donViTinh 'Ngày' | 'Nửa ngày'
 * @param {string[]} danhSachNgayLe  mảng 'yyyy-MM-dd'
 * @returns {number}
 */
function tinhSoNgay(tuNgay, denNgay, donViTinh, danhSachNgayLe) {
  if (donViTinh === 'Nửa ngày') return 0.5;
  if (!tuNgay || !denNgay) return 0;
  const le = {};
  (danhSachNgayLe || []).forEach(d => { le[d] = true; });

  let count = 0;
  const d = new Date(tuNgay + 'T00:00:00');
  const end = new Date(denNgay + 'T00:00:00');
  while (d <= end) {
    const dow = d.getDay();              // 0=CN, 6=T7
    const iso = _isoDate(d);
    if (dow !== 0 && dow !== 6 && !le[iso]) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Nguồn chi trả mặc định theo loại đơn (có thể bị body ghi đè).
function nguonChiTraMacDinh(loaiDon) {
  switch (loaiDon) {
    case 'Không lương': return 'Không lương';
    case 'Ốm đau':
    case 'Chăm con ốm':
    case 'Thai sản nữ':
    case 'Thai sản nam':
    case 'TNLĐ-BNN':
    case 'Khám thai':   return 'BHXH';
    default:            return 'Công ty'; // Phép năm, Việc riêng, OT, Công tác, Ra ngoài
  }
}

function _isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
