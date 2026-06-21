// ─── kyluat.js ────────────────────────────────────────────────────────────────
// Alpine.js cho ky-luat.html — bảng cảnh báo kỷ luật (HR/quản lý/BGĐ).

function kyLuatApp() {
  return {
    loading:    true,
    submitting: false,
    user:       null,
    danhSach:   [],
    filterDonVi: '',
    filterMuc:   '',
    errorMsg:   '',
    successMsg: '',

    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      if (!['ToTruong', 'TruongDonVi', 'BGD', 'HR', 'Admin'].includes(this.user.vaiTro)) {
        window.location.href = 'chamcong.html'; return;
      }
      renderHeader('kyluat');
      await this.load();
      this.loading = false;
    },

    async load() {
      this._clearMsg();
      try {
        const p = {};
        if (this.filterDonVi) p.donVi = this.filterDonVi;
        if (this.filterMuc)   p.mucCanhBao = this.filterMuc;
        const r = await Api.getCanhBao(p);
        this.danhSach = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },

    get donViOptions() {
      return [...new Set(this.danhSach.map(c => c.donVi).filter(Boolean))].sort();
    },

    async quet() {
      if (!confirm('Quét lại cảnh báo kỷ luật cho toàn bộ NV đang làm?')) return;
      this.submitting = true; this._clearMsg();
      try {
        const r = await Api.quetCanhBao();
        this.successMsg = 'Đã quét xong — ' + r.data.soMoi + ' cảnh báo mới';
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    mucBadge(muc) {
      return { 'Khiển trách': 'badge-warning', 'Kéo dài nâng lương': 'badge-warning', 'Sa thải': 'badge-danger' }[muc] || 'badge-gray';
    },
    fmtNgayGio(iso) {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); }
      catch (_) { return iso; }
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}
