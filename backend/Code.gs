// ─── Code.gs ──────────────────────────────────────────────────────────────────
// Entry point duy nhất của Google Apps Script Web App.
// doGet / doPost → route → api/ → rules/ + data/

function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || '';
    const user   = verifyAndGetUser(params.token);
    const result = _routeGet(action, user, params);
    return _jsonOk(result);
  } catch (err) {
    return _jsonErr(err.message);
  }
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (_) {
    return _jsonErr('Request body không phải JSON hợp lệ');
  }
  try {
    const action = body.action || '';

    // Route login không cần xác minh token trước
    if (action === 'login') return _jsonOk(apiLogin(body));

    const user   = verifyAndGetUser(body.token);
    const result = _routePost(action, user, body);
    return _jsonOk(result);
  } catch (err) {
    return _jsonErr(err.message);
  }
}

// ── GET routes ────────────────────────────────────────────────────────────────
function _routeGet(action, user, params) {
  switch (action) {
    case 'getProfile':           return apiGetProfile(user);
    case 'getNhanVienList':      return apiGetNhanVienList(user, params);
    case 'getNhanVien':          return apiGetNhanVien(user, params);
    case 'getCaList':            return apiGetCaList(user);
    case 'getCa':                return apiGetCa(user, params);
    case 'getLichTrucNgay':      return apiGetLichTrucNgay(user, params);
    case 'getLichTrucTuan':      return apiGetLichTrucTuan(user, params);
    case 'getChamCongHomNay':    return apiGetChamCongHomNay(user);
    case 'kiemTraViTri':         return apiKiemTraViTri(user, params);
    case 'getChamCongKhoang':    return apiGetChamCongKhoang(user, params);
    case 'danhSachDonCuaToi':    return apiDanhSachDonCuaToi(user, params);
    case 'donChoDuyet':          return apiDonChoDuyet(user, params);
    case 'getDonChiTiet':        return apiGetDonChiTiet(user, params);
    case 'getThongBao':          return apiGetThongBao(user, params);
    case 'getHeaderInfo':        return apiGetHeaderInfo(user);
    case 'getDashboard':         return apiGetDashboard(user, params);
    case 'getChiTietViPham':     return apiGetChiTietViPham(user, params);
    case 'getSoDuPhep':          return apiGetSoDuPhep(user, params);
    case 'getBangCong':          return apiGetBangCong(user, params);
    case 'xuatBangCong':         return apiXuatBangCong(user, params);
    case 'getCanhBao':           return apiGetCanhBao(user, params);
    case 'getAuditLog':          return apiGetAuditLog(user, params);
    case 'getCauHinh':           return { ok: true, data: getAllConfig() };
    default:
      throw new Error('GET action không hợp lệ: ' + action);
  }
}

// ── POST routes ───────────────────────────────────────────────────────────────
function _routePost(action, user, body) {
  switch (action) {
    case 'chamVao':          return apiChamVao(user, body);
    case 'chamRa':           return apiChamRa(user, body);
    case 'suaChamCong':      return apiSuaChamCong(user, body);
    case 'khoaChamCong':     return apiKhoaChamCong(user, body);
    case 'moKhoaChamCong':   return apiMoKhoaChamCong(user, body);
    case 'doiMatKhau':       return apiDoiMatKhau(user, body);
    case 'resetMatKhau':     return apiResetMatKhau(user, body);
    case 'createNhanVien':   return apiCreateNhanVien(user, body);
    case 'updateNhanVien':   return apiUpdateNhanVien(user, body);
    case 'createCa':         return apiCreateCa(user, body);
    case 'updateCa':         return apiUpdateCa(user, body);
    case 'setLichTruc':      return apiSetLichTruc(user, body);
    case 'deleteLichTruc':   return apiDeleteLichTruc(user, body);
    case 'taoDon':           return apiTaoDon(user, body);
    case 'thuHoiDon':        return apiThuHoiDon(user, body);
    case 'suaDonBoSung':     return apiSuaDonBoSung(user, body);
    case 'duyetDon':         return apiDuyetDon(user, body);
    case 'danhDauThongBao':  return apiDanhDauThongBao(user, body);
    case 'uploadDinhKem':    return apiUploadDinhKem(user, body);
    case 'tinhQuotaDauNam':  return apiTinhQuotaDauNam(user, body);
    case 'khoaKyCong':       return apiKhoaKyCong(user, body);
    case 'moKhoaKyCong':     return apiMoKhoaKyCong(user, body);
    case 'quetCanhBao':      return apiQuetCanhBao(user, body);
    case 'setCauHinh':       return apiSetCauHinh(user, body);
    case 'saoLuuNgay':       return apiSaoLuuNgay(user, body);
    default:
      throw new Error('POST action không hợp lệ: ' + action);
  }
}

// ── Response helpers ──────────────────────────────────────────────────────────
function _jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function _jsonErr(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
