// ─── duyetdon.js ──────────────────────────────────────────────────────────────
// Alpine.js cho trang duyet-don.html — danh sách đơn chờ duyệt của cấp quản lý.

function duyetDonApp() {
  return {
    loading:    true,
    submitting: false,
    danhSach:   [],
    filterLoai: '',
    errorMsg:   '',
    successMsg: '',

    // Modal chi tiết + duyệt
    showModal: false,
    don:       null,
    ketQua:    'Duyệt',
    yKien:     '',

    async init() {
      if (!requireLogin('index.html')) return;
      const user = getCurrentUser();
      if (!['ToTruong', 'TruongDonVi', 'BGD', 'Admin'].includes(user && user.vaiTro)) {
        window.location.href = 'chamcong.html'; return;
      }
      renderHeader('duyetdon');
      await this.load();
      this.loading = false;
    },

    async load() {
      this._clearMsg();
      try {
        const p = this.filterLoai ? { loaiDon: this.filterLoai } : {};
        const r = await Api.donChoDuyet(p);
        this.danhSach = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },

    get loaiDonOptions() {
      return [...new Set(this.danhSach.map(d => d.loaiDon))].sort();
    },

    moModal(don) {
      this.don = don;
      this.ketQua = 'Duyệt';
      this.yKien = '';
      this._clearMsg();
      this.showModal = true;
    },
    dongModal() { this.showModal = false; this.don = null; },

    async duyet() {
      this._clearMsg();
      if (this.ketQua !== 'Duyệt' && !this.yKien.trim()) {
        this.errorMsg = 'Phải nhập ý kiến khi từ chối hoặc yêu cầu bổ sung'; return;
      }
      this.submitting = true;
      try {
        const r = await Api.duyetDon({ maDon: this.don.maDon, ketQua: this.ketQua, yKien: this.yKien.trim() });
        this.successMsg = 'Đã xử lý đơn ' + this.don.maDon + ' → ' + r.data.trangThai;
        this.showModal = false;
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Utilities ───────────────────────────────────────────────────────────────
    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch (_) { return str; }
    },
    moTaBuoc(b) {
      const nguoi = (b.nguoiDuyetTen || b.nguoiDuyet || '?') +
                    (b.nguoiDuyetTen ? ' (' + b.nguoiDuyet + ')' : '');
      return 'Cấp ' + b.capDuyet + ' · ' + nguoi + ': ' + b.ketQua +
             (b.yKien ? ' — ' + b.yKien : '') + ' (' + this.fmtNgay(b.thoiDiem) + ')';
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}
