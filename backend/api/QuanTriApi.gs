// ─── QuanTriApi.gs ────────────────────────────────────────────────────────────
// Quản trị hệ thống (GĐ4): sửa CauHinh + xem AuditLog.

// GET action=getCauHinh — v1.0.2: Admin xem toàn bộ; vai trò khác chỉ nhận các khoá
// giao diện cần (tránh lộ ngưỡng kỷ luật, địa bàn, email kỹ thuật…).
const CAU_HINH_CONG_KHAI = ['dinh_muc_viec_rieng', 'ngay_le_tet', 'app_version', 'timezone'];
function apiGetCauHinh(user) {
  const tatCa = getAllConfig();
  if (hasQuyen(user, 'QUAN_TRI')) return { ok: true, data: tatCa };
  return { ok: true, data: tatCa.filter(c => CAU_HINH_CONG_KHAI.indexOf(c.key) !== -1) };
}

// POST action=setCauHinh  body {key, value, moTa?}  — Admin only
function apiSetCauHinh(user, body) {
  requireQuyen(user, 'QUAN_TRI');
  if (!body.key) throw new Error('Thiếu key');
  const cu = getConfig(body.key);
  setConfig(body.key, body.value, body.moTa);
  appendLog(user.maNV, user.email, 'SUA_CAU_HINH', 'CauHinh', { key: body.key, cu: cu, moi: body.value });
  return { ok: true, data: { key: body.key, value: body.value } };
}

// POST action=saoLuuNgay  — Admin only. Tạo bản sao lưu spreadsheet ngay.
function apiSaoLuuNgay(user, body) {
  requireQuyen(user, 'QUAN_TRI');
  const url = backupSpreadsheet();
  return { ok: true, data: { url: url, message: 'Đã tạo bản sao lưu' } };
}

// GET action=getAuditLog&tuNgay=&denNgay=&action=&maNV=&page=&size=  — HR/Admin
function apiGetAuditLog(user, params) {
  if (!['HR', 'Admin'].includes(user.vaiTro)) throw new Error('Chỉ HR/Admin được xem nhật ký hệ thống');
  const sh = getSheet('AuditLog');
  let list = sheetToObjects(sh);

  if (params.action) list = list.filter(o => String(o.action) === params.action);
  if (params.maNV)   list = list.filter(o => String(o.maNV) === params.maNV);
  if (params.tuNgay) list = list.filter(o => vnDateStr(o.thoiDiem) >= params.tuNgay);
  if (params.denNgay) list = list.filter(o => vnDateStr(o.thoiDiem) <= params.denNgay);

  list.sort((a, b) => tsMs(b.thoiDiem) - tsMs(a.thoiDiem));

  const page = Math.max(1, Number(params.page) || 1);
  const size = Math.min(200, Number(params.size) || 50);
  const total = list.length;
  const start = (page - 1) * size;
  return { ok: true, data: { total, page, size, items: list.slice(start, start + size) } };
}
