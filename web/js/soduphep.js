// ─── soduphep.js ──────────────────────────────────────────────────────────────
// Alpine.js cho so-du-phep.html — số dư phép năm.

function soDuPhepApp() {
  return {
    loading:    true,
    submitting: false,
    user:       null,
    isQuanLy:   false,
    nam:        new Date().getFullYear(),
    danhSach:   [],
    lichSu:     [],   // đơn phép đã duyệt của chính mình
    errorMsg:   '',
    successMsg: '',

    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      this.isQuanLy = ['HR', 'Admin', 'BGD', 'ToTruong', 'TruongDonVi'].includes(this.user.vaiTro);
      renderHeader('soduphep');
      await this.load();
      this.loading = false;
    },

    async load() {
      this._clearMsg();
      try {
        const r = await Api.getSoDuPhep({ nam: this.nam });
        this.danhSach = Array.isArray(r.data) ? r.data.filter(Boolean) : (r.data ? [r.data] : []);
      } catch (e) { this.errorMsg = e.message; }
      // Lịch sử trừ phép của chính mình
      try {
        const r2 = await Api.danhSachDonCuaToi({ loaiDon: 'Phép năm' });
        this.lichSu = (r2.data || []).filter(d => d.trangThai === 'Đã duyệt');
      } catch (_) { /* không quan trọng */ }
    },

    async tinhQuota() {
      if (!confirm('Tính lại quota phép năm ' + this.nam + ' cho toàn bộ NV đang làm? (giữ nguyên số đã dùng)')) return;
      this.submitting = true; this._clearMsg();
      try {
        const r = await Api.tinhQuotaDauNam({ nam: this.nam });
        this.successMsg = 'Đã tính quota cho ' + r.data.soNV + ' nhân viên (năm ' + r.data.nam + ')';
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch (_) { return str; }
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}
