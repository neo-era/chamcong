// ─── dashboard.js ─────────────────────────────────────────────────────────────
// Alpine.js cho dashboard.html — tổng quan kỳ + ai đang nghỉ (NC-F).

function dashboardApp() {
  return {
    loading:  true,
    user:     null,
    ky:       '',
    donVi:    '',
    data:     null,
    errorMsg: '',

    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      if (!['ToTruong', 'TruongDonVi', 'BGD', 'HR', 'Admin'].includes(this.user.vaiTro)) {
        window.location.href = 'chamcong.html'; return;
      }
      renderHeader('dashboard');
      await this.load();
      this.loading = false;
    },

    get laQuanLy() { return ['HR', 'Admin', 'BGD'].includes(this.user && this.user.vaiTro); },

    async load() {
      this.errorMsg = '';
      try {
        const p = {};
        if (this.ky)    p.ky = this.ky;
        if (this.donVi) p.donVi = this.donVi;
        const r = await Api.getDashboard(p);
        this.data = r.data;
        this.ky = r.data.ky;
      } catch (e) { this.errorMsg = e.message; }
    },

    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch (_) { return str; }
    }
  };
}
