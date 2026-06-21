// ─── api.js ───────────────────────────────────────────────────────────────────
// Client gọi Google Apps Script Web App.
// QUY TẮC CORS:
//   GET  → token trong query param (request đơn giản, không cần preflight)
//   POST → Content-Type: text/plain;charset=utf-8 (tránh preflight)
//          body JSON có trường token bên trong

async function apiGet(action, params = {}) {
  const token = getToken();
  if (!token) { logout(); throw new Error('Phiên đăng nhập hết hạn'); }

  const qs = new URLSearchParams({ action, token, ...params }).toString();
  const url = CONFIG.BACKEND_URL + '?' + qs;

  const resp = await fetch(url, { method: 'GET', redirect: 'follow' });
  return _parseResp(resp);
}

async function apiPost(action, data = {}) {
  const token = getToken();
  if (!token) { logout(); throw new Error('Phiên đăng nhập hết hạn'); }

  const body = JSON.stringify({ action, token, ...data });
  const resp = await fetch(CONFIG.BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    redirect: 'follow'
  });
  return _parseResp(resp);
}

async function _parseResp(resp) {
  let json;
  try { json = await resp.json(); }
  catch (_) { throw new Error('Phản hồi từ máy chủ không hợp lệ'); }
  if (!json.ok) throw new Error(json.error || 'Lỗi không xác định từ máy chủ');
  return json;
}

// ── Shorthand helpers ─────────────────────────────────────────────────────────
const Api = {
  // Auth
  getProfile:         ()           => apiGet('getProfile'),
  doiMatKhau:         (data)       => apiPost('doiMatKhau', data),
  resetMatKhau:       (data)       => apiPost('resetMatKhau', data),

  // Chấm công
  getChamCongHomNay:  ()           => apiGet('getChamCongHomNay'),
  getChamCongKhoang:  (p)          => apiGet('getChamCongKhoang', p),
  chamVao:            (data)       => apiPost('chamVao', data),
  chamRa:             (data)       => apiPost('chamRa', data),
  suaChamCong:        (data)       => apiPost('suaChamCong', data),
  khoaChamCong:       (data)       => apiPost('khoaChamCong', data),
  moKhoaChamCong:     (data)       => apiPost('moKhoaChamCong', data),

  // Nhân viên
  getNhanVienList:    (p)          => apiGet('getNhanVienList', p || {}),
  getNhanVien:        (maNV)       => apiGet('getNhanVien', { maNV }),
  createNhanVien:     (data)       => apiPost('createNhanVien', data),
  updateNhanVien:     (data)       => apiPost('updateNhanVien', data),

  // Ca
  getCaList:          ()           => apiGet('getCaList'),
  createCa:           (data)       => apiPost('createCa', data),
  updateCa:           (data)       => apiPost('updateCa', data),

  // Lịch trực
  getLichTrucNgay:    (p)          => apiGet('getLichTrucNgay', p),
  getLichTrucTuan:    (p)          => apiGet('getLichTrucTuan', p),
  setLichTruc:        (data)       => apiPost('setLichTruc', data),
  deleteLichTruc:     (data)       => apiPost('deleteLichTruc', data),

  // Đơn từ & duyệt (GĐ2)
  taoDon:             (data)       => apiPost('taoDon', data),
  thuHoiDon:          (maDon)      => apiPost('thuHoiDon', { maDon }),
  suaDonBoSung:       (data)       => apiPost('suaDonBoSung', data),
  duyetDon:           (data)       => apiPost('duyetDon', data),
  danhSachDonCuaToi:  (p)          => apiGet('danhSachDonCuaToi', p || {}),
  donChoDuyet:        (p)          => apiGet('donChoDuyet', p || {}),

  // Phép & Bảng công (GĐ3)
  getSoDuPhep:        (p)          => apiGet('getSoDuPhep', p || {}),
  tinhQuotaDauNam:    (data)       => apiPost('tinhQuotaDauNam', data || {}),
  getBangCong:        (p)          => apiGet('getBangCong', p || {}),
  xuatBangCong:       (p)          => apiGet('xuatBangCong', p || {}),
  khoaKyCong:         (data)       => apiPost('khoaKyCong', data),
  moKhoaKyCong:       (data)       => apiPost('moKhoaKyCong', data),

  // Kỷ luật & Quản trị (GĐ4)
  getCanhBao:         (p)          => apiGet('getCanhBao', p || {}),
  quetCanhBao:        ()           => apiPost('quetCanhBao', {}),
  getAuditLog:        (p)          => apiGet('getAuditLog', p || {}),
  setCauHinh:         (data)       => apiPost('setCauHinh', data),

  // CauHinh
  getCauHinh:         ()           => apiGet('getCauHinh')
};
