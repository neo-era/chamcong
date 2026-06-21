// ─── BangCongApi.gs ───────────────────────────────────────────────────────────
// Bảng công tháng (GĐ3). Đầu ra khớp biểu mẫu docs/06-bang-cong-template.md.

// ── Helpers ──────────────────────────────────────────────────────────────────
function _ngayLeSet() {
  const raw = getConfig('ngay_le_tet') || '';
  const set = {};
  String(raw).split(/[\s,;]+/).forEach(s => { s = s.trim(); if (s) set[s] = true; });
  return set;
}

// Kỳ công hiện tại theo ngày cắt: nếu hôm nay >= ngayCat → thuộc kỳ tháng sau.
function _kyHienTai(ngayCat) {
  const now = new Date();
  const cat = Number(ngayCat) || 21;
  let y = now.getFullYear(), m = now.getMonth() + 1;
  if (now.getDate() >= cat) { m += 1; if (m > 12) { m = 1; y += 1; } }
  return y + '-' + String(m).padStart(2, '0');
}

function _donCuaNgay(donList, maNV, ngayStr) {
  for (let i = 0; i < donList.length; i++) {
    const o = donList[i];
    if (o.maNV !== maNV) continue;
    if (toDateStr(o.tuNgay) <= ngayStr && ngayStr <= toDateStr(o.denNgay)) return o;
  }
  return null;
}

// Phạm vi NV theo quyền của user.
function _scopeNV(user, params) {
  if (params.maNV) {
    if (!canViewNV(user, params.maNV)) throw new Error('Không có quyền xem bảng công NV này');
    const nv = getNVByMa(params.maNV);
    return nv ? [nv] : [];
  }
  if (['HR', 'Admin', 'BGD'].includes(user.vaiTro)) {
    const ds = listNV(params.donVi ? { donVi: params.donVi } : {});
    return ds.filter(n => n.trangThai !== 'Nghỉ việc');
  }
  if (['ToTruong', 'TruongDonVi'].includes(user.vaiTro)) {
    return listNV({ donVi: user.donVi }).filter(n => n.trangThai !== 'Nghỉ việc');
  }
  const nv = getNVByMa(user.maNV);
  return nv ? [nv] : [];
}

// ── Lấy bảng công ────────────────────────────────────────────────────────────
// GET action=getBangCong&ky=yyyy-MM&donVi=&maNV=
function apiGetBangCong(user, params) {
  const ngayCat = getConfigNumber('ngay_cat_ky_cong', 21);
  const ky = params.ky || _kyHienTai(ngayCat);
  const kc = khoangKyCong(ky, ngayCat);
  const tuNgay = kc.tuNgay, denNgay = kc.denNgay;

  const dsNV = _scopeNV(user, params);
  const maNVList = dsNV.map(n => n.maNV);

  const du = layDuLieuKyCong(maNVList, tuNgay, denNgay);
  const caMap = {}; du.caList.forEach(c => { caMap[c.maCa] = c; });
  const ngayLeSet = _ngayLeSet();
  const ngayList = lietKeNgay(tuNgay, denNgay);

  const ccIdx = {};
  du.cc.forEach(r => { ccIdx[r.maNV + '|' + toDateStr(r.ngay)] = r; });

  const rows = dsNV.map(nv => {
    const days = {}, maList = [];
    ngayList.forEach(d => {
      const c  = ccIdx[nv.maNV + '|' + d.ngay] || null;
      const dn = _donCuaNgay(du.don, nv.maNV, d.ngay);
      const ca = c ? caMap[c.maCa] : null;
      const m  = maNgay(c, ca, dn, d.ngay, ngayLeSet);
      days[d.ngay] = m; maList.push(m);
    });
    return {
      maNV: nv.maNV, hoTen: nv.hoTen, donVi: nv.donVi, dieuKienCV: nv.dieuKienCV,
      days, tongHop: tongHopNV(maList), isLocked: kiemTraKhoa(ky, nv.maNV)
    };
  });

  return { ok: true, data: {
    ky, tuNgay, denNgay, ngayCat,
    ngayList: ngayList.map(d => ({ ngay: d.ngay, thu: d.thu })),
    rows
  } };
}

// ── Khoá / mở khoá kỳ ────────────────────────────────────────────────────────
// POST action=khoaKyCong  body {ky, donVi?, maNV?}
function apiKhoaKyCong(user, body) {
  requireQuyen(user, 'KHOA_BANG_CONG');
  if (!body.ky) throw new Error('Thiếu kỳ (ky)');
  const maNVList = body.maNV ? [body.maNV] : listNV(body.donVi ? { donVi: body.donVi } : {}).map(n => n.maNV);
  maNVList.forEach(m => datKhoaBangCong(body.ky, m, user.maNV));
  appendLog(user.maNV, user.email, 'KHOA_KY_CONG', 'BangCong', { ky: body.ky, soNV: maNVList.length, donVi: body.donVi || '' });
  return { ok: true, data: { ky: body.ky, soNV: maNVList.length } };
}

// POST action=moKhoaKyCong  body {ky, maNV?, donVi?, lyDo}
function apiMoKhoaKyCong(user, body) {
  requireQuyen(user, 'KHOA_BANG_CONG');
  if (!body.ky) throw new Error('Thiếu kỳ (ky)');
  if (!body.lyDo) throw new Error('Phải nhập lý do khi mở khoá kỳ công');
  const maNVList = body.maNV ? [body.maNV] : listNV(body.donVi ? { donVi: body.donVi } : {}).map(n => n.maNV);
  maNVList.forEach(m => moKhoaBangCong(body.ky, m, user.maNV));
  appendLog(user.maNV, user.email, 'MO_KHOA_KY_CONG', 'BangCong', { ky: body.ky, soNV: maNVList.length, lyDo: body.lyDo });
  return { ok: true, data: { ky: body.ky, soNV: maNVList.length } };
}

// ── Xuất CSV (UTF-8 có BOM, mở đúng dấu trong Excel) ─────────────────────────
// GET action=xuatBangCong&ky=&donVi=&loai=chi_tiet|tong_hop
function apiXuatBangCong(user, params) {
  const r = apiGetBangCong(user, params).data;
  const loai = params.loai === 'tong_hop' ? 'tong_hop' : 'chi_tiet';
  const csv = (loai === 'tong_hop') ? _csvTongHop(r) : _csvChiTiet(r);
  const content = '﻿' + csv;   // BOM
  const b64 = Utilities.base64Encode(content, Utilities.Charset.UTF_8);
  return { ok: true, data: {
    filename: 'BangCong_' + loai + '_' + r.ky + '.csv',
    mimeType: 'text/csv;charset=utf-8',
    base64: b64
  } };
}

function _csvCell(v) {
  const s = (v == null) ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function _csvRow(arr) { return arr.map(_csvCell).join(','); }

function _csvChiTiet(r) {
  const lines = [];
  lines.push('BẢNG CHI TIẾT CHẤM CÔNG KỲ ' + r.ky + ' (' + r.tuNgay + ' đến ' + r.denNgay + ')');
  const head = ['STT', 'Mã NV', 'Họ và tên'];
  r.ngayList.forEach(d => head.push(d.ngay.substring(8, 10)));   // số ngày
  head.push('Công ngày', 'Công đêm', 'P', 'R', 'Ô', 'TS', 'KL');
  lines.push(_csvRow(head));
  r.rows.forEach((row, i) => {
    const cells = [i + 1, row.maNV, row.hoTen];
    r.ngayList.forEach(d => cells.push(row.days[d.ngay] || ''));
    const t = row.tongHop;
    cells.push(t.congNgay, t.congDem, t.nghiP, t.nghiR, t.nghiOm, t.nghiTS, t.nghiKL);
    lines.push(_csvRow(cells));
  });
  return lines.join('\n');
}

function _csvTongHop(r) {
  const lines = [];
  lines.push('BẢNG TỔNG HỢP CHẤM CÔNG KỲ ' + r.ky + ' (' + r.tuNgay + ' đến ' + r.denNgay + ')');
  lines.push(_csvRow(['STT', 'Mã NV', 'Đơn vị', 'Họ và tên', 'Công ngày', 'Công đêm',
    'Nghỉ phép (P)', 'Việc riêng (R)', 'Nghỉ bệnh (Ô)', 'Thai sản (TS)', 'Không lương (KL)', 'Bỏ việc']));
  r.rows.forEach((row, i) => {
    const t = row.tongHop;
    lines.push(_csvRow([i + 1, row.maNV, row.donVi, row.hoTen,
      t.congNgay, t.congDem, t.nghiP, t.nghiR, t.nghiOm, t.nghiTS, t.nghiKL, t.boViec]));
  });
  return lines.join('\n');
}
