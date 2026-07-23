// ─── GeoData.gs ───────────────────────────────────────────────────────────────
// Reverse geocoding qua Nominatim (OSM) + xác minh địa bàn làm việc.
// Có cache (CacheService) theo toạ độ làm tròn để tránh gọi lặp & vượt rate-limit.

// Đọc cấu hình địa bàn cho phép (JSON). Fallback an toàn nếu cấu hình hỏng.
function _diaBanConfig() {
  const raw = getConfig('dia_ban_cho_phep');
  if (raw) { try { return JSON.parse(raw); } catch (_) { /* dùng mặc định */ } }
  return { quan: ['1','3','5','8','10','11','Phú Nhuận','Bình Thạnh'], khuVuc: ['Bến Cát'], loaiTru: ['Văn Thố','Bàu Bàng'] };
}

// Đổi toạ độ → địa chỉ (Nominatim). Trả { ok, address, duong, phuong, quan, diaChi } hoặc { ok:false }.
function reverseGeocode(lat, lng) {
  const cache = CacheService.getScriptCache();
  const key   = 'geo_' + lat.toFixed(4) + '_' + lng.toFixed(4);   // ~11m
  const hit   = cache.get(key);
  if (hit) { try { return JSON.parse(hit); } catch (_) {} }

  const email = getConfig('geocode_email') || 'admin@cscc.vn';
  const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2'
    + '&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng)
    + '&zoom=18&addressdetails=1&accept-language=vi&email=' + encodeURIComponent(email);

  try {
    const resp = UrlFetchApp.fetch(url, {
      method: 'get', muteHttpExceptions: true,
      headers: { 'User-Agent': 'CSCC-ChamCong/1.0 (' + email + ')' }
    });
    if (resp.getResponseCode() !== 200) return { ok: false };
    const data = JSON.parse(resp.getContentText());
    const a = data.address || {};
    a.display_name = data.display_name || '';

    const duong  = a.road || a.pedestrian || '';
    const phuong = a.suburb || a.quarter || a.neighbourhood || a.village || a.hamlet || '';
    const quan   = a.city_district || a.district || a.county || a.town || a.municipality || '';
    const diaChi = [duong, phuong, quan, a.state].filter(Boolean).join(', ') || a.display_name || '';

    const result = { ok: true, address: a, duong: duong, phuong: phuong, quan: quan, diaChi: diaChi };
    cache.put(key, JSON.stringify(result), 21600);   // 6 giờ
    return result;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Xác minh vị trí chấm công.
 * @param {string} toaDoStr - 'lat,lng'
 * @param {string} [diaBanNV] - Địa bàn riêng của NV (chuỗi phường cách nhau bằng dấu phẩy).
 *   Nếu có → ưu tiên dùng thay cho cấu hình global. Nếu không có → dùng dia_ban_cho_phep.
 * @returns {object} { kiemTra, loi, trongDiaBan, diaChi, duong, phuong, quan, khop, lyDo, canhBao }
 *  - kiemTra=false: hệ thống tắt kiểm tra địa bàn → luôn cho qua.
 *  - loi=true: không xác minh được (toạ độ sai / dịch vụ lỗi) → fail-open: cho qua + cảnh báo.
 */
function xacMinhViTri(toaDoStr, diaBanNV) {
  if (getConfig('kiem_tra_dia_ban') !== 'TRUE') {
    return { kiemTra: false, loi: false, trongDiaBan: true, diaChi: '' };
  }
  const parts = String(toaDoStr || '').split(',');
  const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) {
    return { kiemTra: true, loi: true, trongDiaBan: true, diaChi: '', canhBao: 'Toạ độ không hợp lệ — chưa xác minh được khu vực' };
  }

  const geo = reverseGeocode(lat, lng);
  if (!geo.ok) {
    return { kiemTra: true, loi: true, trongDiaBan: true, diaChi: '', canhBao: 'Không xác minh được khu vực (lỗi dịch vụ bản đồ) — đã ghi nhận tạm, HR rà soát sau' };
  }

  // Dùng địa bàn riêng của NV nếu có; không có → dùng config global
  const cfg = (diaBanNV && diaBanNV.trim())
    ? { khuVuc: diaBanNV.split(',').map(function(s) { return s.trim(); }).filter(Boolean) }
    : _diaBanConfig();
  const kq = kiemTraDiaBan(geo.address, cfg);
  return {
    kiemTra: true, loi: false,
    trongDiaBan: kq.trongDiaBan,
    diaChi: geo.diaChi, duong: geo.duong, phuong: geo.phuong, quan: geo.quan,
    khop: kq.khop, lyDo: kq.lyDo
  };
}
