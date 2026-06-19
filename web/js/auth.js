// ─── auth.js ──────────────────────────────────────────────────────────────────
// Quản lý Google Identity Services (GIS) login.
// ID token được lưu sessionStorage; mỗi tab phải đăng nhập lại khi đóng browser.

const TOKEN_KEY = 'cc_id_token';
const USER_KEY  = 'cc_user';

// ── Lấy token hiện tại (null nếu chưa login hoặc hết hạn) ───────────────────
function getIdToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = _decodeJwt(token);
    // exp là Unix timestamp (giây); còn ít nhất 30 giây thì dùng được
    if (Date.now() / 1000 < payload.exp - 30) return token;
  } catch (_) { /* token bị lỗi */ }
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  return null;
}

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch (_) { return null; }
}

function isLoggedIn() { return !!getIdToken(); }

// ── Đăng xuất ───────────────────────────────────────────────────────────────
function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
  window.location.href = 'index.html';
}

// ── Khởi tạo GIS trên trang login ───────────────────────────────────────────
function initGISLogin(onSuccess) {
  google.accounts.id.initialize({
    client_id:  CONFIG.GIS_CLIENT_ID,
    callback:   (response) => _handleCredential(response, onSuccess),
    auto_select: false
  });

  // Render nút Sign In
  google.accounts.id.renderButton(
    document.getElementById('g-signin-btn'),
    { theme: 'outline', size: 'large', text: 'signin_with', locale: 'vi' }
  );

  // Thử One Tap (tuỳ chọn, có thể tắt)
  google.accounts.id.prompt();
}

// ── Bảo vệ trang — redirect về login nếu chưa đăng nhập ────────────────────
function requireLogin(redirectTo) {
  if (!isLoggedIn()) {
    // Lưu URL hiện tại để redirect lại sau khi login
    sessionStorage.setItem('cc_redirect', window.location.href);
    window.location.href = redirectTo || 'index.html';
    return false;
  }
  return true;
}

// ── Render header ────────────────────────────────────────────────────────────
function renderHeader(activePage) {
  const user = getCurrentUser();
  if (!user) return;

  const nameEl = document.getElementById('header-name');
  const roleEl = document.getElementById('header-role');
  if (nameEl) nameEl.textContent = user.hoTen || user.email;
  if (roleEl) roleEl.textContent = _vaiTroLabel(user.vaiTro);

  // Highlight nav link active
  if (activePage) {
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === activePage);
    });
  }

  // Hiện/ẩn nav theo vai trò
  const vaiTro = user.vaiTro;
  document.querySelectorAll('[data-roles]').forEach(el => {
    const roles = el.dataset.roles.split(',');
    el.style.display = roles.includes(vaiTro) ? '' : 'none';
  });
}

// ── Nội bộ ──────────────────────────────────────────────────────────────────
function _handleCredential(response, onSuccess) {
  const token   = response.credential;
  const payload = _decodeJwt(token);
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify({
    email: payload.email,
    name:  payload.name,
    picture: payload.picture
  }));
  if (typeof onSuccess === 'function') onSuccess(payload);
}

function _decodeJwt(token) {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(
    atob(b64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join('')
  ));
}

function _vaiTroLabel(vaiTro) {
  return { NV:'Nhân viên', ToTruong:'Tổ trưởng', TruongDonVi:'Trưởng đơn vị',
           BGD:'Ban giám đốc', HR:'Nhân sự', Admin:'Quản trị' }[vaiTro] || vaiTro;
}
