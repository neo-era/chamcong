// ─── QuyenRules.gs ────────────────────────────────────────────────────────────
// Ma trận phân quyền theo docs/03-approval-workflow.md.
// KHÔNG truy cập Sheets ở đây — chỉ kiểm tra thuần logic.

const VAI_TRO = {
  NV:           'NV',
  TO_TRUONG:    'ToTruong',
  TRUONG_DON_VI:'TruongDonVi',
  BGD:          'BGD',
  HR:           'HR',
  ADMIN:        'Admin'
};

// Danh sách vai trò có quyền thực hiện từng chức năng
const QUYEN_MAP = {
  CHAM_CONG:     ['NV','ToTruong','TruongDonVi','BGD','HR','Admin'],
  TAO_DON:       ['NV','ToTruong','TruongDonVi','BGD','HR','Admin'],
  DUYET_CAP1:    ['ToTruong','TruongDonVi','BGD','Admin'],
  DUYET_CAP2:    ['TruongDonVi','BGD','Admin'],
  DUYET_CAP3:    ['BGD','Admin'],
  PHAN_CA:       ['ToTruong','TruongDonVi','HR','Admin'],
  QUAN_LY_NV:    ['HR','Admin'],
  QUAN_LY_CA:    ['HR','Admin'],
  QUAN_LY_QUOTA: ['HR','Admin'],
  KHOA_BANG_CONG:['HR','Admin'],
  SUA_CHAM_CONG: ['HR','Admin'],
  XEM_CANH_BAO:  ['ToTruong','TruongDonVi','BGD','HR','Admin'],
  QUET_LUONG:    ['BGD','HR','Admin'],
  QUAN_TRI:      ['Admin']
};

function hasQuyen(user, quyen) {
  const ds = QUYEN_MAP[quyen];
  if (!ds) return false;
  return ds.includes(user.vaiTro);
}

function requireQuyen(user, quyen) {
  if (!hasQuyen(user, quyen)) {
    throw new Error('Không có quyền thực hiện: ' + quyen + ' (vai trò: ' + user.vaiTro + ')');
  }
}

// Kiểm tra NV có thể xem dữ liệu của maNVTarget không
// (bản thân luôn được xem; quản lý xem được cấp dưới; HR/Admin xem được tất cả)
function canViewNV(user, maNVTarget) {
  if (user.maNV === maNVTarget) return true;
  if (['HR','Admin','BGD'].includes(user.vaiTro)) return true;
  if (['ToTruong','TruongDonVi'].includes(user.vaiTro)) {
    // Kiểm tra maNVTarget có trong đơn vị của user không
    const target = getNVByMa(maNVTarget);
    return target && target.donVi === user.donVi;
  }
  return false;
}
