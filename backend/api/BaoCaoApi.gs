// ─── BaoCaoApi.gs ─────────────────────────────────────────────────────────────
// Dashboard / báo cáo tổng quan (NC-F).

function _scopeNVBaoCao(user, donVi) {
  if (['HR', 'Admin', 'BGD'].includes(user.vaiTro)) {
    return listNV(donVi ? { donVi: donVi } : {}).filter(n => n.trangThai !== 'Nghỉ việc');
  }
  if (['ToTruong', 'TruongDonVi'].includes(user.vaiTro)) {
    return listNV({ donVi: user.donVi }).filter(n => n.trangThai !== 'Nghỉ việc');
  }
  return [getNVByMa(user.maNV)].filter(Boolean);
}

const _LOAI_NGHI = ['Phép năm', 'Việc riêng', 'Không lương', 'Ốm đau', 'Chăm con ốm',
  'Thai sản nữ', 'Thai sản nam', 'TNLĐ-BNN', 'Khám thai'];

// GET action=getDashboard&ky=&donVi=
function apiGetDashboard(user, params) {
  const ngayCat = getConfigNumber('ngay_cat_ky_cong', 21);
  const ky = params.ky || _kyHienTai(ngayCat);
  const kc = khoangKyCong(ky, ngayCat);
  const dsNV = _scopeNVBaoCao(user, params.donVi);
  const maNVList = dsNV.map(n => n.maNV);
  const byMa = {}; dsNV.forEach(n => { byMa[n.maNV] = n; });

  // Chấm công trong kỳ
  const cc = getChamCongDonVi(maNVList, kc.tuNgay, kc.denNgay);
  let tre = 0, som = 0, matCong = 0, vangKhong = 0, tongGio = 0;
  cc.forEach(r => {
    if (r.trangThai === 'TRE') tre++;
    else if (r.trangThai === 'SOM') som++;
    else if (r.trangThai === 'MAT_CONG') matCong++;
    else if (r.trangThai === 'VANG_KHONG_PHEP') vangKhong++;
    if (r.soGioCong) tongGio += Number(r.soGioCong) || 0;
  });

  // Đơn đã duyệt trong kỳ
  const donKy = listDonDaDuyetTrongKy(maNVList, kc.tuNgay, kc.denNgay);
  let tongPhep = 0, tongOT = 0;
  donKy.forEach(d => {
    if (d.loaiDon === 'Phép năm') tongPhep += Number(d.soNgay) || 0;
    if (d.loaiDon === 'OT') tongOT += Number(d.soGio) || 0;
  });

  // Ai đang nghỉ hôm nay
  const homNay = todayStr();
  const dangNghi = listDonDaDuyetTrongKy(maNVList, homNay, homNay)
    .filter(d => _LOAI_NGHI.includes(d.loaiDon))
    .map(d => ({ maNV: d.maNV, hoTen: (byMa[d.maNV] || {}).hoTen || d.maNV,
                 loaiDon: d.loaiDon, tuNgay: d.tuNgay, denNgay: d.denNgay }));

  return { ok: true, data: {
    ky, tuNgay: kc.tuNgay, denNgay: kc.denNgay, soNV: dsNV.length,
    diTre: tre, veSom: som, matCong, vangKhongPhep: vangKhong,
    tongGioCong: Math.round(tongGio * 2) / 2, tongPhep, tongOT,
    dangNghi
  } };
}
