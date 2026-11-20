// ─── AuthApi.gs ───────────────────────────────────────────────────────────────
// Xác thực bằng email + mật khẩu do Admin cấp (lưu trong sheet NhanVien, KHÔNG bao giờ trả về client).
// Session token: HMAC-SHA256 tự ký, hết hạn sau 8 giờ.
// Không dùng Google Identity Services.

// Khóa bí mật ký token — BẮT BUỘC đặt trong Script Properties (SESSION_SECRET).
// Cách nhanh: trong Editor chọn hàm taoSessionSecret → Run (tự sinh khoá ngẫu nhiên).
// v1.0.2: không còn giá trị mặc định — thiếu/ngắn thì từ chối cấp & nhận token.
const SECRET_TOI_THIEU = 32;
const MAT_KHAU_TOI_THIEU = 8;
function _getSecret() {
  const s = PropertiesService.getScriptProperties().getProperty('SESSION_SECRET');
  if (!s || String(s).length < SECRET_TOI_THIEU) {
    // Câu báo cho người dùng không lộ chi tiết; Admin chạy kiemTraAuth để xem nguyên nhân
    // (thiếu SESSION_SECRET ≥ 32 ký tự → chạy taoSessionSecret).
    throw new Error('Hệ thống đang bảo trì. Vui lòng liên hệ Admin.');
  }
  return String(s);
}

// Chạy trong Editor (chọn taoSessionSecret → Run). Sinh khoá mới ngẫu nhiên, lưu vào
// Script Properties. Chạy lại = đổi khoá = MỌI phiên đăng nhập cũ hết hiệu lực.
function taoSessionSecret() {
  const s = (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('SESSION_SECRET', s);
  Logger.log('✓ Đã đặt SESSION_SECRET mới (' + s.length + ' ký tự). Mọi người cần đăng nhập lại.');
}

// Kiểm tra độ mạnh tối thiểu cho mật khẩu mới (dùng chung cho đổi/reset/khởi tạo).
function _kiemTraMatKhauMoi(mk) {
  mk = String(mk || '');
  if (mk.length < MAT_KHAU_TOI_THIEU) throw new Error('Mật khẩu mới phải có ít nhất ' + MAT_KHAU_TOI_THIEU + ' ký tự');
  if (/^(\d)\1+$/.test(mk) || mk === '12345678' || mk === '123456789') throw new Error('Mật khẩu quá dễ đoán');
  return mk;
}

// Sinh mật khẩu tạm ngẫu nhiên (bỏ ký tự dễ nhầm 0/O, 1/l/I).
function taoMatKhauTam() {
  const kt = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + Utilities.getUuid() + Date.now(), Utilities.Charset.UTF_8);
  let s = '';
  for (let i = 0; i < 10; i++) s += kt[(b[i] & 0xff) % kt.length];
  return s + '#' + (2 + (b[10] & 0xff) % 8);
}

// ── Đăng nhập ────────────────────────────────────────────────────────────────
// Gọi từ Code.gs với action='login' (không cần token trước)
function apiLogin(body) {
  _getSecret();   // kiểm cấu hình trước — không để lộ email/mật khẩu đúng sai khi đang lỗi cấu hình
  const { email, matKhau } = body;
  if (!email || !matKhau) throw new Error('Vui lòng nhập email và mật khẩu');
  const em = email.trim().toLowerCase();

  _resetNVMemo();   // luôn đọc tươi từ sheet khi đăng nhập
  const nv = getNVByEmail(em);
  if (!nv) throw new Error('Email không tồn tại trong hệ thống');
  if (nv.trangThai === 'Nghỉ việc') throw new Error('Tài khoản đã bị vô hiệu hoá');
  if (!nv.matKhau) throw new Error('Tài khoản chưa được cấp mật khẩu. Liên hệ Admin/HR.');
  if (!kiemTraMatKhau(nv, matKhau)) throw new Error('Mật khẩu không đúng');
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
  _kiemTraMatKhauMoi(matKhauMoi);
  if (String(matKhauMoi) === String(matKhauCu)) throw new Error('Mật khẩu mới phải khác mật khẩu cũ');

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
  _kiemTraMatKhauMoi(matKhauMoi);
  const nvDich = getNVByMa(maNV);
  if (!nvDich) throw new Error('Không tìm thấy NV: ' + maNV);
  kiemTraTacDongTaiKhoan(user, nvDich.vaiTro, '');
  datMatKhau(maNV, matKhauMoi);   // bật cờ phaiDoiMK: NV phải tự đổi khi đăng nhập
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
  const expires = Number(payload.split('|')[1]);
  if (!(expires > Date.now())) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');

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
