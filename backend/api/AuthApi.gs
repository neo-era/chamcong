// ─── AuthApi.gs ───────────────────────────────────────────────────────────────
// Xác thực bằng email + mật khẩu do Admin cấp (lưu hash SHA-256 trong sheet NhanVien).
// Session token: HMAC-SHA256 tự ký, hết hạn sau 8 giờ.
// Không dùng Google Identity Services.

// Khóa bí mật ký token — Admin đặt 1 lần trong Apps Script:
// Project Settings → Script Properties → SESSION_SECRET = 'chuỗi-bí-mật-dài'
function _getSecret() {
  return PropertiesService.getScriptProperties().getProperty('SESSION_SECRET')
    || 'CSCC_CHAMCONG_DEFAULT_2026'; // thay trong Script Properties khi deploy thật
}

// ── Đăng nhập ────────────────────────────────────────────────────────────────
// Gọi từ Code.gs với action='login' (không cần token trước)
function apiLogin(body) {
  const { email, matKhau } = body;
  if (!email || !matKhau) throw new Error('Vui lòng nhập email và mật khẩu');
  const em = email.trim().toLowerCase();

  // NC-B: chống dò mật khẩu — khoá tạm sau N lần sai
  const cache    = CacheService.getScriptCache();
  const keyFail  = 'login_fail_' + em;
  const max      = getConfigNumber('dang_nhap_toi_da', 5);
  const khoaPhut = getConfigNumber('dang_nhap_khoa_phut', 15);
  const soSai    = Number(cache.get(keyFail)) || 0;
  if (soSai >= max) {
    throw new Error('Tài khoản tạm khoá do nhập sai nhiều lần. Thử lại sau ' + khoaPhut + ' phút.');
  }
  const nv = getNVByEmail(em);
  function ghiSai(msg) {
    cache.put(keyFail, String(soSai + 1), khoaPhut * 60);
    if (soSai + 1 >= max) appendLog(nv ? nv.maNV : '', em, 'KHOA_DANG_NHAP', 'Auth', { soSai: soSai + 1 });
    throw new Error(msg);
  }

  if (!nv) ghiSai('Email không tồn tại trong hệ thống');
  if (nv.trangThai === 'Nghỉ việc') throw new Error('Tài khoản đã bị vô hiệu hoá');
  if (!nv.matKhau) throw new Error('Tài khoản chưa được cấp mật khẩu. Liên hệ Admin/HR.');
  if (!kiemTraMatKhau(nv, matKhau)) ghiSai('Mật khẩu không đúng');

  cache.remove(keyFail);
  const token = _createToken(nv.email);
  appendLog(nv.maNV, nv.email, 'DANG_NHAP', 'Auth', {});

  return {
    ok: true,
    token,
    user: {
      maNV:     nv.maNV,
      hoTen:    nv.hoTen,
      email:    nv.email,
      vaiTro:   nv.vaiTro,
      donVi:    nv.donVi,
      chucDanh: nv.chucDanh,
      phaiDoiMK: nv.phaiDoiMK || ''     // NC-A: ép đổi mật khẩu lần đầu
    }
  };
}

// ── Xác minh token cho mọi request cần auth ──────────────────────────────────
function verifyAndGetUser(token) {
  if (!token) throw new Error('Chưa đăng nhập');
  return _verifyToken(token);
}

// ── Đổi mật khẩu (user tự đổi) ───────────────────────────────────────────────
function apiDoiMatKhau(user, body) {
  const { matKhauCu, matKhauMoi } = body;
  if (!matKhauCu || !matKhauMoi) throw new Error('Thiếu matKhauCu hoặc matKhauMoi');
  if (matKhauMoi.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');

  const nv = getNVByMa(user.maNV);
  if (!kiemTraMatKhau(nv, matKhauCu)) throw new Error('Mật khẩu cũ không đúng');

  datMatKhau(user.maNV, matKhauMoi, false);   // NC-A: xoá cờ phaiDoiMK sau khi user tự đổi
  appendLog(user.maNV, user.email, 'DOI_MAT_KHAU', 'Auth', {});
  return { ok: true, message: 'Đã đổi mật khẩu thành công' };
}

// ── Admin reset mật khẩu cho NV khác ─────────────────────────────────────────
function apiResetMatKhau(user, body) {
  requireQuyen(user, 'QUAN_LY_NV');
  const { maNV, matKhauMoi } = body;
  if (!maNV || !matKhauMoi) throw new Error('Thiếu maNV hoặc matKhauMoi');
  datMatKhau(maNV, matKhauMoi);
  appendLog(user.maNV, user.email, 'RESET_MAT_KHAU', 'NhanVien', { maNV });
  return { ok: true, message: 'Đã reset mật khẩu cho ' + maNV };
}

// GET action=getProfile
function apiGetProfile(user) {
  return {
    ok: true,
    data: {
      maNV:     user.maNV,
      hoTen:    user.hoTen,
      donVi:    user.donVi,
      chucDanh: user.chucDanh,
      vaiTro:   user.vaiTro,
      email:    user.email
    }
  };
}

// ── Nội bộ ───────────────────────────────────────────────────────────────────
function _createToken(email) {
  const expires = Date.now() + 8 * 3600 * 1000; // 8 giờ
  const payload = email + '|' + expires;
  const sig     = _hmac(payload, _getSecret());
  return Utilities.base64EncodeWebSafe(payload + '|' + sig);
}

function _verifyToken(token) {
  let decoded;
  try {
    decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
  } catch (_) { throw new Error('Token không hợp lệ'); }

  const lastPipe = decoded.lastIndexOf('|');
  const payload  = decoded.substring(0, lastPipe);
  const sig      = decoded.substring(lastPipe + 1);

  // Kiểm tra chữ ký
  if (sig !== _hmac(payload, _getSecret())) throw new Error('Token không hợp lệ');

  // Kiểm tra hạn
  const expires = parseInt(payload.split('|')[1]);
  if (Date.now() > expires) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');

  const email = payload.split('|')[0];
  const nv    = getNVByEmail(email);
  if (!nv) throw new Error('Tài khoản không tồn tại');
  if (nv.trangThai === 'Nghỉ việc') throw new Error('Tài khoản đã bị vô hiệu hoá');
  return nv;
}

function _hmac(data, secret) {
  const sig = Utilities.computeHmacSha256Signature(data, secret, Utilities.Charset.UTF_8);
  return sig.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function _hashSHA256(str) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return d.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
