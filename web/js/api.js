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

// ── Cache GET phía client (sessionStorage + TTL) ──────────────────────────────
// Tránh gọi lại Apps Script (~3–6s) cho dữ liệu ít đổi khi chuyển trang.
function _cacheGet(key, ttlMs) {
  try {
    const o = JSON.parse(sessionStorage.getItem('cc_cache_' + key));
    if (!o || Date.now() - o.t > ttlMs) return null;
    return o.v;
  } catch (_) { return null; }
}
function _cacheSet(key, val) {
  try { sessionStorage.setItem('cc_cache_' + key, JSON.stringify({ t: Date.now(), v: val })); } catch (_) {}
}
function _cacheClear(key) { try { sessionStorage.removeItem('cc_cache_' + key); } catch (_) {} }

// ── Shorthand helpers ─────────────────────────────────────────────────────────
const Api = {
  // Auth
  getProfile:         ()           => apiGet('getProfile'),
  doiMatKhau:         (data)       => apiPost('doiMatKhau', data),
  resetMatKhau:       (data)       => apiPost('resetMatKhau', data),

  // Chấm công
  getChamCongHomNay:  ()           => apiGet('getChamCongHomNay'),
  kiemTraViTri:       (p)          => apiGet('kiemTraViTri', p),
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

  // Ca (ít đổi → cache 5 phút)
  getCaList:          async ()     => {
    const c = _cacheGet('calist', 300000); if (c) return { ok: true, data: c };
    const r = await apiGet('getCaList'); _cacheSet('calist', r.data); return r;
  },
  createCa:           (data)       => apiPost('createCa', data).then(r => { _cacheClear('calist'); return r; }),
  updateCa:           (data)       => apiPost('updateCa', data).then(r => { _cacheClear('calist'); return r; }),

  // Lịch trực
  getLichTrucNgay:    (p)          => apiGet('getLichTrucNgay', p),
  getLichTrucTuan:    (p)          => apiGet('getLichTrucTuan', p),
  setLichTruc:        (data)       => apiPost('setLichTruc', data),
  deleteLichTruc:     (data)       => apiPost('deleteLichTruc', data),

  // Đơn từ & duyệt (GĐ2)
  taoDon:             (data)       => apiPost('taoDon', data).then(r => { _cacheClear('header'); return r; }),
  thuHoiDon:          (maDon)      => apiPost('thuHoiDon', { maDon }).then(r => { _cacheClear('header'); return r; }),
  suaDonBoSung:       (data)       => apiPost('suaDonBoSung', data).then(r => { _cacheClear('header'); return r; }),
  duyetDon:           (data)       => apiPost('duyetDon', data).then(r => { _cacheClear('header'); return r; }),
  danhSachDonCuaToi:  (p)          => apiGet('danhSachDonCuaToi', p || {}),
  donChoDuyet:        (p)          => apiGet('donChoDuyet', p || {}),
  getDonChiTiet:      (maDon)      => apiGet('getDonChiTiet', { maDon }),
  getThongBao:        ()           => apiGet('getThongBao'),
  // Gộp chuông + badge duyệt, cache 60s để chuyển trang không gọi lại
  getHeaderInfo:      async (force) => {
    if (!force) { const c = _cacheGet('header', 60000); if (c) return { ok: true, data: c }; }
    const r = await apiGet('getHeaderInfo'); _cacheSet('header', r.data); return r;
  },
  danhDauThongBao:    (data)       => apiPost('danhDauThongBao', data || {}).then(r => { _cacheClear('header'); return r; }),
  getDashboard:       (p)          => apiGet('getDashboard', p || {}),
  uploadDinhKem:      (data)       => apiPost('uploadDinhKem', data),

  // Phép & Bảng công (GĐ3)
  getSoDuPhep:        (p)          => apiGet('getSoDuPhep', p || {}),
  tinhQuotaDauNam:    (data)       => apiPost('tinhQuotaDauNam', data || {}),
  getBangCong:        (p)          => apiGet('getBangCong', p || {}),
  xuatBangCong:       (p)          => apiGet('xuatBangCong', p || {}),
  khoaKyCong:         (data)       => apiPost('khoaKyCong', data),
  moKhoaKyCong:       (data)       => apiPost('moKhoaKyCong', data),

  // Kỷ luật & Quản trị (GĐ4)
  getCanhBao:         (p)          => apiGet('getCanhBao', p || {}),
  getChiTietViPham:   (p)          => apiGet('getChiTietViPham', p || {}),
  quetCanhBao:        ()           => apiPost('quetCanhBao', {}),
  getAuditLog:        (p)          => apiGet('getAuditLog', p || {}),
  saoLuuNgay:         ()           => apiPost('saoLuuNgay', {}),
  setCauHinh:         (data)       => apiPost('setCauHinh', data).then(r => { _cacheClear('cauhinh'); return r; }),

  // CauHinh (ít đổi → cache 5 phút)
  getCauHinh:         async ()     => {
    const c = _cacheGet('cauhinh', 300000); if (c) return { ok: true, data: c };
    const r = await apiGet('getCauHinh'); _cacheSet('cauhinh', r.data); return r;
  }
};
