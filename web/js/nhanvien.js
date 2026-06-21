// ─── nhanvien.js ──────────────────────────────────────────────────────────────
// Alpine.js data function cho trang nhanvien.html (HR/Admin)

function nhanVienApp() {
  return {
    loading:    true,
    submitting: false,
    danhSach:   [],
    filtered:   [],
    errorMsg:   '',
    successMsg: '',

    // Filter
    search:      '',
    filterDonVi: '',
    filterTrangThai: 'Đang làm',

    // Modal
    showModal:   false,
    isEdit:      false,
    form: _emptyForm(),

    // ── Init ──────────────────────────────────────────────────────────────────
    async init() {
      if (!requireLogin('index.html')) return;
      const user = getCurrentUser();
      if (!['HR','Admin'].includes(user && user.vaiTro)) {
        window.location.href = 'chamcong.html'; return;
      }
      renderHeader('nhanvien');
      await this.load();
      this.loading = false;
    },

    async load() {
      try {
        const params = {};
        if (this.filterTrangThai) params.trangThai = this.filterTrangThai;
        const r = await Api.getNhanVienList(params);
        this.danhSach = r.data;
        this.applyFilter();
      } catch (e) { this.errorMsg = e.message; }
    },

    applyFilter() {
      const q = this.search.toLowerCase();
      this.filtered = this.danhSach.filter(nv => {
        if (this.filterDonVi && nv.donVi !== this.filterDonVi) return false;
        if (!q) return true;
        return (nv.hoTen || '').toLowerCase().includes(q) ||
               (nv.maNV  || '').toLowerCase().includes(q) ||
               (nv.email || '').toLowerCase().includes(q);
      });
    },

    get donViOptions() {
      return [...new Set(this.danhSach.map(n => n.donVi).filter(Boolean))].sort();
    },

    // ── Mở modal ──────────────────────────────────────────────────────────────
    moModalTao() {
      this.form    = _emptyForm();
      this.isEdit  = false;
      this.showModal = true;
      this._clearMsg();
    },

    moModalSua(nv) {
      this.form    = { ...nv };
      this.isEdit  = true;
      this.showModal = true;
      this._clearMsg();
      this.$nextTick(() => { if (window.syncDates) window.syncDates(); });
    },

    dongModal() { this.showModal = false; },

    // ── Lưu ───────────────────────────────────────────────────────────────────
    async luu() {
      this._clearMsg(); this.submitting = true;
      try {
        if (this.isEdit) {
          await Api.updateNhanVien(this.form);
          this.successMsg = 'Đã cập nhật nhân viên ' + this.form.maNV;
        } else {
          await Api.createNhanVien(this.form);
          this.successMsg = 'Đã tạo nhân viên ' + this.form.maNV;
        }
        this.showModal = false;
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Đổi trạng thái ────────────────────────────────────────────────────────
    async doiTrangThai(maNV, trangThai) {
      if (!confirm(`Xác nhận đổi trạng thái NV ${maNV} thành "${trangThai}"?`)) return;
      this._clearMsg();
      try {
        await Api.updateNhanVien({ maNV, trangThai });
        this.successMsg = 'Đã cập nhật trạng thái';
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
    },

    // ── Utilities ─────────────────────────────────────────────────────────────
    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch(_) { return str; }
    },
    dieuKienLabel(dk) {
      return { 'Bình thường':'Bình thường', 'Nặng nhọc':'Nặng nhọc ★',
               'Đặc biệt nặng nhọc':'Đặc biệt ★★' }[dk] || dk || '—';
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}

function _emptyForm() {
  return {
    maNV: '', hoTen: '', donVi: '', khoi: 'Gián tiếp',
    chucDanh: '', dieuKienCV: 'Bình thường',
    ngayVaoLam: '', quanLyTrucTiep: '',
    trangThai: 'Đang làm', email: '', vaiTro: 'NV'
  };
}
