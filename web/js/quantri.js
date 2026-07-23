// ─── quantri.js ───────────────────────────────────────────────────────────────
// Alpine.js cho quan-tri.html — Admin: sửa CauHinh + xem AuditLog.

function quanTriApp() {
  return {
    loading:    true,
    user:       null,
    tab:        'cauhinh',
    errorMsg:   '',
    successMsg: '',

    // CauHinh
    cauHinh:    [],
    savingKey:  '',

    // Bảo trì
    backingUp:  false,
    backupUrl:  '',

    // Reset mật khẩu
    danhSachNV:  [],
    mkMaNV:      '',
    mkMoi:       '',
    mkSubmitting: false,

    // AuditLog
    logs:       [],
    logTotal:   0,
    logPage:    1,
    logSize:    50,
    fAction:    '',
    fMaNV:      '',
    fTu:        '',
    fDen:       '',

    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      if ((this.user && this.user.vaiTro) !== 'Admin') { window.location.href = 'chamcong.html'; return; }
      renderHeader('quantri');
      await this.loadCauHinh();
      this.loading = false;
    },

    async doiTab(t) {
      this.tab = t; this._clearMsg();
      if (t === 'audit'    && !this.logs.length)     await this.loadLog();
      if (t === 'matkhau'  && !this.danhSachNV.length) await this.loadNV();
    },

    // ── CauHinh ──────────────────────────────────────────────────────────────
    async loadCauHinh() {
      this._clearMsg();
      try { const r = await Api.getCauHinh(); this.cauHinh = r.data; }
      catch (e) { this.errorMsg = e.message; }
    },
    async luu(c) {
      if (!confirm('Lưu cấu hình "' + c.key + '" = ' + c.value + ' ?')) return;
      this.savingKey = c.key; this._clearMsg();
      try {
        await Api.setCauHinh({ key: c.key, value: c.value, moTa: c.moTa });
        this.successMsg = 'Đã lưu ' + c.key;
      } catch (e) { this.errorMsg = e.message; }
      finally { this.savingKey = ''; }
    },

    // ── Reset mật khẩu ───────────────────────────────────────────────────────
    async loadNV() {
      try {
        const r = await Api.getNhanVienList({ trangThai: 'Đang làm' });
        this.danhSachNV = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },
    async resetMK() {
      if (!this.mkMaNV)  { this.errorMsg = 'Chọn nhân viên'; return; }
      if (!this.mkMoi.trim()) { this.errorMsg = 'Nhập mật khẩu mới'; return; }
      if (this.mkMoi.length < 6) { this.errorMsg = 'Mật khẩu tối thiểu 6 ký tự'; return; }
      const nv = this.danhSachNV.find(n => n.maNV === this.mkMaNV);
      if (!confirm('Reset mật khẩu cho ' + (nv ? nv.hoTen : this.mkMaNV) + '?\nNV sẽ phải đổi mật khẩu khi đăng nhập lần sau.')) return;
      this.mkSubmitting = true; this._clearMsg();
      try {
        await Api.resetMatKhau({ maNV: this.mkMaNV, matKhauMoi: this.mkMoi });
        this.successMsg = 'Đã reset mật khẩu cho ' + (nv ? nv.hoTen + ' (' + this.mkMaNV + ')' : this.mkMaNV);
        this.mkMoi = '';
      } catch (e) { this.errorMsg = e.message; }
      finally { this.mkSubmitting = false; }
    },

    // ── Bảo trì ──────────────────────────────────────────────────────────────
    async saoLuu() {
      if (!confirm('Tạo bản sao lưu toàn bộ dữ liệu ngay bây giờ?')) return;
      this.backingUp = true; this.backupUrl = ''; this._clearMsg();
      try {
        const r = await Api.saoLuuNgay();
        this.backupUrl = (r.data && r.data.url) || '';
        this.successMsg = 'Đã tạo bản sao lưu thành công';
      } catch (e) { this.errorMsg = e.message; }
      finally { this.backingUp = false; }
    },

    // ── AuditLog ─────────────────────────────────────────────────────────────
    async loadLog() {
      this._clearMsg();
      try {
        const p = { page: this.logPage, size: this.logSize };
        if (this.fAction) p.action = this.fAction;
        if (this.fMaNV)   p.maNV = this.fMaNV;
        if (this.fTu)     p.tuNgay = this.fTu;
        if (this.fDen)    p.denNgay = this.fDen;
        const r = await Api.getAuditLog(p);
        this.logs = r.data.items;
        this.logTotal = r.data.total;
      } catch (e) { this.errorMsg = e.message; }
    },
    timLog() { this.logPage = 1; this.loadLog(); },
    get soTrang() { return Math.max(1, Math.ceil(this.logTotal / this.logSize)); },
    trang(d) {
      const p = this.logPage + d;
      if (p < 1 || p > this.soTrang) return;
      this.logPage = p; this.loadLog();
    },

    fmtNgayGio(iso) {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); }
      catch (_) { return iso; }
    },
    chiTietStr(v) {
      if (v == null) return '';
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v); } catch (_) { return String(v); }
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}
