// ─── auth.js ──────────────────────────────────────────────────────────────────
// Xác thực bằng email + mật khẩu do Admin cấp.
// Session token (HMAC, 8h) lưu trong sessionStorage — không dùng Google GIS.

const TOKEN_KEY = 'cc_token';
const USER_KEY  = 'cc_user';

// ── Lấy token / user hiện tại ────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || null;
}

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch (_) { return null; }
}

function isLoggedIn() { return !!getToken(); }

// ── Đăng nhập ────────────────────────────────────────────────────────────────
// Trả về { ok, user } hoặc ném Error
async function login(email, matKhau) {
  const res = await fetch(CONFIG.BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'login', email: email.trim().toLowerCase(), matKhau })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Đăng nhập thất bại');

  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

// ── Đăng xuất ────────────────────────────────────────────────────────────────
function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}

// ── Bảo vệ trang — redirect về login nếu chưa đăng nhập ─────────────────────
function requireLogin(redirectTo) {
  if (!isLoggedIn()) {
    sessionStorage.setItem('cc_redirect', window.location.href);
    window.location.href = redirectTo || 'index.html';
    return false;
  }
  return true;
}

// ── Render header (tên, vai trò, nav phân quyền) ─────────────────────────────
function renderHeader(activePage) {
  const user = getCurrentUser();
  if (!user) return;

  const nameEl = document.getElementById('header-name');
  const roleEl = document.getElementById('header-role');
  if (nameEl) {
    // Tên người dùng = link tới trang đổi mật khẩu
    nameEl.innerHTML = '';
    const a = document.createElement('a');
    a.href = 'doi-mat-khau.html';
    a.textContent = '🔑 ' + (user.hoTen || user.email);
    a.title = 'Đổi mật khẩu';
    a.style.color = 'inherit';
    a.style.textDecoration = 'none';
    nameEl.appendChild(a);
  }
  if (roleEl) roleEl.textContent = _vaiTroLabel(user.vaiTro);

  if (activePage) {
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === activePage);
    });
  }

  const vaiTro = user.vaiTro;
  document.querySelectorAll('[data-roles]').forEach(el => {
    const roles = el.dataset.roles.split(',');
    el.style.display = roles.includes(vaiTro) ? '' : 'none';
  });
}

function _vaiTroLabel(vaiTro) {
  return { NV:'Nhân viên', ToTruong:'Tổ trưởng', TruongDonVi:'Trưởng đơn vị',
           BGD:'Ban giám đốc', HR:'Nhân sự', Admin:'Quản trị' }[vaiTro] || vaiTro;
}
