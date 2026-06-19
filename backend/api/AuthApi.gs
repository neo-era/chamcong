// ─── AuthApi.gs ───────────────────────────────────────────────────────────────
// Xác minh Google ID token và lấy thông tin user hiện tại.
// Token được gửi từ frontend trong mỗi request (body.idToken hoặc params.idToken).

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';

/**
 * Xác minh ID token của Google Identity Services.
 * Gọi hàm này ĐẦU TIÊN trong mọi handler GET/POST.
 * Ném lỗi nếu token không hợp lệ hoặc email không có trong hệ thống.
 *
 * @param {string} idToken - JWT ID token từ GIS
 * @returns {object} thông tin NV từ sheet NhanVien
 */
function verifyAndGetUser(idToken) {
  if (!idToken) throw new Error('Chưa đăng nhập — thiếu idToken');

  const resp = UrlFetchApp.fetch(GOOGLE_TOKENINFO_URL + encodeURIComponent(idToken), {
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('Token Google không hợp lệ hoặc đã hết hạn');
  }

  const info = JSON.parse(resp.getContentText());
  if (!info.email) throw new Error('Không lấy được email từ token');
  if (!info.email_verified || info.email_verified === 'false') {
    throw new Error('Email chưa được xác minh bởi Google');
  }

  const nv = getNVByEmail(info.email);
  if (!nv) throw new Error('Email không được cấp quyền truy cập: ' + info.email);
  if (nv.trangThai === 'Nghỉ việc') throw new Error('Tài khoản đã ngừng hoạt động');

  return nv; // { maNV, hoTen, email, vaiTro, donVi, khoi, ... }
}

// GET action=getProfile
function apiGetProfile(user) {
  return {
    ok: true,
    data: {
      maNV:      user.maNV,
      hoTen:     user.hoTen,
      donVi:     user.donVi,
      chucDanh:  user.chucDanh,
      vaiTro:    user.vaiTro,
      email:     user.email
    }
  };
}
