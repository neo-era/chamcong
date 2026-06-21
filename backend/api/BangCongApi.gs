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
    const theoGio = (nv.khoi === 'Trực tiếp');   // khối trực tiếp: ô hiện "N·8"
    const days = {}, maList = [];
    let tongGioCong = 0;
    ngayList.forEach(d => {
      const c  = ccIdx[nv.maNV + '|' + d.ngay] || null;
      const dn = _donCuaNgay(du.don, nv.maNV, d.ngay);
      const ca = c ? caMap[c.maCa] : null;
      const m  = maNgay(c, ca, dn, d.ngay, ngayLeSet);   // mã gốc (N/D/P/...)
      maList.push(m);
      // Hiển thị: khối trực tiếp, ngày có công (N/D) → kèm số giờ
      if (theoGio && (m === 'N' || m === 'D') && c && c.soGioCong !== '' && c.soGioCong != null) {
        days[d.ngay] = m + '·' + c.soGioCong;
        tongGioCong += Number(c.soGioCong) || 0;
      } else {
        days[d.ngay] = m;
      }
    });
    const th = tongHopNV(maList);
    th.tongGioCong = theoGio ? (Math.round(tongGioCong * 2) / 2) : null;
    return {
      maNV: nv.maNV, hoTen: nv.hoTen, donVi: nv.donVi, dieuKienCV: nv.dieuKienCV, khoi: nv.khoi,
      days, tongHop: th, isLocked: kiemTraKhoa(ky, nv.maNV)
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

// ── Xuất bảng công ───────────────────────────────────────────────────────────
// GET action=xuatBangCong&ky=&donVi=&loai=chi_tiet|tong_hop&dinhDang=csv|xlsx
function apiXuatBangCong(user, params) {
  const r = apiGetBangCong(user, params).data;
  const loai = params.loai === 'tong_hop' ? 'tong_hop' : 'chi_tiet';
  if (params.dinhDang === 'xlsx') return _xuatBangCongXlsx(r, loai);

  // Mặc định CSV (UTF-8 có BOM)
  const csv = (loai === 'tong_hop') ? _csvTongHop(r) : _csvChiTiet(r);
  const b64 = Utilities.base64Encode('﻿' + csv, Utilities.Charset.UTF_8);
  return { ok: true, data: {
    filename: 'BangCong_' + loai + '_' + r.ky + '.csv',
    mimeType: 'text/csv;charset=utf-8',
    base64: b64
  } };
}

// Xuất .xlsx 2 sheet (Chi tiết + Tổng hợp) theo biểu mẫu docs/06.
// Tạo Spreadsheet tạm → export xlsx → base64 → xoá file tạm.
function _xuatBangCongXlsx(r, loaiUuTien) {
  const dv1 = getConfig('don_vi_cap1') || 'CÔNG TY CỔ PHẦN CHIẾU SÁNG CÔNG CỘNG TP.HCM';
  const dv2 = getConfig('don_vi_cap2') || 'CHIẾU SÁNG KHU VỰC TRUNG TÂM';
  const ss = SpreadsheetApp.create('BC_' + r.ky + '_' + (new Date().getTime()));
  try {
    const shCT = ss.getSheets()[0].setName('Chi tiết');
    _ghiSheet(shCT, _aoaChiTiet(r, dv1, dv2));
    const shCC = ss.insertSheet('Tổng hợp');
    _ghiSheet(shCC, _aoaTongHop(r, dv1, dv2));
    // Đưa sheet ưu tiên lên đầu
    if (loaiUuTien === 'tong_hop') ss.setActiveSheet(shCC); else ss.setActiveSheet(shCT);
    SpreadsheetApp.flush();

    const id = ss.getId();
    const url = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';
    const resp = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    const b64 = Utilities.base64Encode(resp.getBlob().getBytes());
    return { ok: true, data: {
      filename: 'BangCong_' + r.ky + '.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: b64
    } };
  } finally {
    try { DriveApp.getFileById(ss.getId()).setTrashed(true); } catch (_) {}
  }
}

function _ghiSheet(sheet, aoa) {
  let width = 1;
  aoa.forEach(row => { if (row.length > width) width = row.length; });
  const norm = aoa.map(row => { const c = row.slice(); while (c.length < width) c.push(''); return c; });
  sheet.getRange(1, 1, norm.length, width).setValues(norm);
  sheet.getRange(1, 1, 4, 1).setFontWeight('bold');     // header pháp lý + tiêu đề
}

function _aoaChiTiet(r, dv1, dv2) {
  const aoa = [];
  aoa.push([dv1]);
  aoa.push([dv2]);
  aoa.push(['']);
  aoa.push(['BẢNG CHI TIẾT CHẤM CÔNG KỲ ' + r.ky + ' (' + r.tuNgay + ' đến ' + r.denNgay + ')']);
  aoa.push(['']);
  const head = ['STT', 'Mã NV', 'Họ và tên'];
  r.ngayList.forEach(d => head.push(d.ngay.substring(8, 10)));
  head.push('Công ngày', 'Công đêm', 'P', 'R', 'Ô', 'TS', 'KL');
  aoa.push(head);
  r.rows.forEach((row, i) => {
    const cells = [i + 1, row.maNV, row.hoTen];
    r.ngayList.forEach(d => cells.push(row.days[d.ngay] || ''));
    const t = row.tongHop;
    cells.push(t.congNgay, t.congDem, t.nghiP, t.nghiR, t.nghiOm, t.nghiTS, t.nghiKL);
    aoa.push(cells);
  });
  _themChanKy(aoa, head.length);
  return aoa;
}

function _aoaTongHop(r, dv1, dv2) {
  const aoa = [];
  aoa.push([dv1]);
  aoa.push([dv2]);
  aoa.push(['']);
  aoa.push(['BẢNG TỔNG HỢP CHẤM CÔNG KỲ ' + r.ky + ' (' + r.tuNgay + ' đến ' + r.denNgay + ')']);
  aoa.push(['']);
  const head = ['STT', 'Mã NV', 'Đơn vị', 'Họ và tên', 'Công ngày', 'Công đêm', 'Tổng giờ',
    'Nghỉ phép (P)', 'Việc riêng (R)', 'Nghỉ bệnh (Ô)', 'Thai sản (TS)', 'Không lương (KL)', 'Bỏ việc'];
  aoa.push(head);
  r.rows.forEach((row, i) => {
    const t = row.tongHop;
    aoa.push([i + 1, row.maNV, row.donVi, row.hoTen,
      t.congNgay, t.congDem, (t.tongGioCong != null ? t.tongGioCong : ''),
      t.nghiP, t.nghiR, t.nghiOm, t.nghiTS, t.nghiKL, t.boViec]);
  });
  _themChanKy(aoa, head.length);
  return aoa;
}

function _themChanKy(aoa, width) {
  aoa.push(['']);
  aoa.push(['']);
  const r1 = new Array(width).fill('');
  r1[2] = 'NGƯỜI CHẤM CÔNG';
  r1[Math.max(4, width - 3)] = 'PHÓ TRƯỞNG ĐƠN VỊ';
  aoa.push(r1);
  aoa.push(new Array(width).fill(''));
  aoa.push(new Array(width).fill(''));
  aoa.push(new Array(width).fill(''));   // chỗ ký tên
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
  lines.push(_csvRow(['STT', 'Mã NV', 'Đơn vị', 'Họ và tên', 'Công ngày', 'Công đêm', 'Tổng giờ',
    'Nghỉ phép (P)', 'Việc riêng (R)', 'Nghỉ bệnh (Ô)', 'Thai sản (TS)', 'Không lương (KL)', 'Bỏ việc']));
  r.rows.forEach((row, i) => {
    const t = row.tongHop;
    lines.push(_csvRow([i + 1, row.maNV, row.donVi, row.hoTen,
      t.congNgay, t.congDem, (t.tongGioCong != null ? t.tongGioCong : ''),
      t.nghiP, t.nghiR, t.nghiOm, t.nghiTS, t.nghiKL, t.boViec]));
  });
  return lines.join('\n');
}
