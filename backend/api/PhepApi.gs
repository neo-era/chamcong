// ─── PhepApi.gs ───────────────────────────────────────────────────────────────
// Quản lý số dư phép (GĐ3). Orchestrate PhepRules + SoDuPhepData + NhanVienData.

// Map số ngày cơ bản đọc từ CauHinh (fallback 12/14/16 nếu chưa seed).
function _baseMapPhep() {
  return {
    'Bình thường':        getConfigNumber('phep_co_ban_binh_thuong', 12),
    'Nặng nhọc':          getConfigNumber('phep_co_ban_nang_nhoc', 14),
    'Đặc biệt nặng nhọc': getConfigNumber('phep_co_ban_dac_biet', 16)
  };
}

// POST action=tinhQuotaDauNam  body {nam?}
// Tính & ghi quota cho mọi NV đang làm; giữ nguyên daDung nếu đã có bản ghi.
function apiTinhQuotaDauNam(user, body) {
  requireQuyen(user, 'QUAN_LY_QUOTA');
  const nam = (body && body.nam) ? Number(body.nam) : new Date().getFullYear();
  const baseMap = _baseMapPhep();
  const ds = listNV({ trangThai: 'Đang làm' });
  let count = 0;
  ds.forEach(nv => {
    const quota  = tinhQuota(nv.dieuKienCV, nv.ngayVaoLam, nam, baseMap);
    const sd     = getSoDu(nv.maNV, nam);
    const daDung = sd ? Number(sd.daDung) : 0;
    upsertSoDu(nv.maNV, nam, { quota, daDung, conLai: quota - daDung });
    count++;
  });
  appendLog(user.maNV, user.email, 'TINH_QUOTA_DAU_NAM', 'SoDuPhep', { nam, soNV: count });
  return { ok: true, data: { nam, soNV: count } };
}

// GET action=getSoDuPhep&nam=&maNV=&donVi=
function apiGetSoDuPhep(user, params) {
  const nam = params.nam ? Number(params.nam) : new Date().getFullYear();

  // Xem 1 NV cụ thể
  if (params.maNV) {
    if (!canViewNV(user, params.maNV)) throw new Error('Không có quyền xem số dư phép của NV này');
    const sd = getSoDu(params.maNV, nam);
    return { ok: true, data: sd };
  }

  // NV thường: chỉ của mình
  if (!['HR', 'Admin', 'BGD', 'ToTruong', 'TruongDonVi'].includes(user.vaiTro)) {
    const sd = getSoDu(user.maNV, nam);
    return { ok: true, data: sd ? [_gan(sd, getNVByMa(user.maNV))] : [] };
  }

  // Quản lý/HR: theo phạm vi đơn vị
  let dsNV;
  if (['HR', 'Admin', 'BGD'].includes(user.vaiTro)) {
    dsNV = listNV(params.donVi ? { donVi: params.donVi } : {});
  } else {
    dsNV = listNV({ donVi: user.donVi });
  }
  const out = dsNV.map(nv => {
    const sd = getSoDu(nv.maNV, nam) || { maNV: nv.maNV, nam, quota: 0, daDung: 0, conLai: 0 };
    return _gan(sd, nv);
  });
  return { ok: true, data: out };
}

function _gan(sd, nv) {
  return Object.assign({}, sd, nv ? { hoTen: nv.hoTen, donVi: nv.donVi, dieuKienCV: nv.dieuKienCV } : {});
}
