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

  // NC-A: ép đổi mật khẩu lần đầu (mật khẩu mặc định)
  if (user.phaiDoiMK && !location.pathname.endsWith('doi-mat-khau.html')) {
    location.href = 'doi-mat-khau.html'; return;
  }

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

  _setupMenuMobile();

  const vaiTro = user.vaiTro;
  document.querySelectorAll('[data-roles]').forEach(el => {
    const roles = el.dataset.roles.split(',');
    el.style.display = roles.includes(vaiTro) ? '' : 'none';
  });

  // Badge số đơn đang chờ chính mình duyệt (số màu đỏ) trên menu "Duyệt đơn".
  // Bỏ qua khi đang ở chính trang Duyệt đơn (trang đó tự tải danh sách rồi).
  if (['ToTruong', 'TruongDonVi', 'BGD', 'Admin'].includes(vaiTro) && activePage !== 'duyetdon') {
    _capNhatBadgeDuyet();
  }

  _setupThongBao();
}

// NC-E: chuông thông báo trên header
async function _setupThongBao() {
  if (typeof Api === 'undefined' || !Api.getThongBao) return;
  const userInfo = document.querySelector('.app-header .user-info');
  if (!userInfo || document.querySelector('.tb-bell')) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;';
  wrap.innerHTML =
    '<button class="tb-bell" type="button" aria-label="Thông báo" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;position:relative;padding:0 .3rem;">🔔' +
    '<span class="tb-count" style="display:none;position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;border-radius:999px;font-size:.6rem;line-height:1;padding:2px 4px;font-weight:700;"></span></button>' +
    '<div class="tb-drop" style="display:none;position:absolute;top:130%;right:0;width:300px;max-height:380px;overflow:auto;background:#fff;color:#111;border-radius:.5rem;box-shadow:0 12px 32px rgba(0,0,0,.3);z-index:500;"></div>';
  userInfo.insertBefore(wrap, userInfo.firstChild);

  const bell = wrap.querySelector('.tb-bell');
  const drop = wrap.querySelector('.tb-drop');
  const countEl = wrap.querySelector('.tb-count');

  function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function fmt(iso) { try { return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); } catch (_) { return ''; } }
  function render(items) {
    if (!items.length) return '<div style="padding:1rem;color:#666;font-size:.85rem;text-align:center;">Không có thông báo</div>';
    const head = '<div style="display:flex;justify-content:space-between;padding:.5rem .75rem;border-bottom:1px solid #eee;font-size:.8rem;"><b>Thông báo</b><a href="#" class="tb-readall" style="color:#1a56db;">Đã đọc hết</a></div>';
    return head + items.map(it =>
      '<a href="' + (it.link || '#') + '" style="display:block;padding:.55rem .75rem;border-bottom:1px solid #f1f1f1;font-size:.82rem;color:#111;' +
      (it.daDoc ? '' : 'background:#eff6ff;font-weight:600;') + '">' + esc(it.noiDung) +
      '<div style="font-size:.7rem;color:#888;font-weight:400;">' + fmt(it.thoiDiem) + '</div></a>'
    ).join('');
  }
  async function load() {
    try {
      const r = await Api.getThongBao();
      const n = (r.data && r.data.soChuaDoc) || 0;
      countEl.textContent = n; countEl.style.display = n > 0 ? '' : 'none';
      drop.innerHTML = render((r.data && r.data.items) || []);
    } catch (_) {}
  }
  bell.addEventListener('click', (e) => { e.stopPropagation(); drop.style.display = drop.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { drop.style.display = 'none'; });
  drop.addEventListener('click', (e) => {
    if (e.target.classList.contains('tb-readall')) { e.preventDefault(); Api.danhDauThongBao({}).then(load); }
  });
  load();
}

async function _capNhatBadgeDuyet() {
  if (typeof Api === 'undefined' || !Api.donChoDuyet) return;
  const link = document.querySelector('.nav-links a[data-page="duyetdon"]');
  if (!link) return;
  try {
    const r = await Api.donChoDuyet();
    const n = (r && r.data) ? r.data.length : 0;
    link.textContent = 'Duyệt đơn';
    if (n > 0) {
      const b = document.createElement('span');
      b.textContent = ' (' + n + ')';
      b.style.cssText = 'color:#ef4444;font-weight:800;';
      link.appendChild(b);
    }
  } catch (_) { /* im lặng nếu lỗi mạng */ }
}

// Thêm nút ☰ mở/đóng menu trên mobile (1 lần)
function _setupMenuMobile() {
  const nav = document.querySelector('.nav-links');
  const userInfo = document.querySelector('.app-header .user-info');
  if (!nav || !userInfo || document.querySelector('.menu-toggle')) return;

  const btn = document.createElement('button');
  btn.className = 'menu-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Menu');
  btn.textContent = '☰';
  btn.addEventListener('click', (e) => { e.stopPropagation(); nav.classList.toggle('nav-open'); });
  userInfo.insertBefore(btn, userInfo.firstChild);

  // Đóng menu khi bấm ra ngoài hoặc chọn 1 mục
  document.addEventListener('click', () => nav.classList.remove('nav-open'));
  nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') nav.classList.remove('nav-open'); });
}

function _vaiTroLabel(vaiTro) {
  return { NV:'Nhân viên', ToTruong:'Tổ trưởng', TruongDonVi:'Trưởng đơn vị',
           BGD:'Ban giám đốc', HR:'Nhân sự', Admin:'Quản trị' }[vaiTro] || vaiTro;
}
