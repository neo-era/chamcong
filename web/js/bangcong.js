// ─── bangcong.js ──────────────────────────────────────────────────────────────
// Alpine.js cho bang-cong.html — bảng công kỳ (chi tiết / tổng hợp) + khoá + xuất CSV.

function bangCongApp() {
  return {
    loading:    true,
    submitting: false,
    user:       null,
    data:       null,       // { ky, tuNgay, denNgay, ngayList, rows }
    ky:         '',         // 'yyyy-MM'
    donVi:      '',
    cheDo:      'chi_tiet', // 'chi_tiet' | 'tong_hop'
    errorMsg:   '',
    successMsg: '',

    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      renderHeader('bangcong');
      await this.load();
      this.loading = false;
    },

    get laQuanLy() { return ['HR', 'Admin'].includes(this.user && this.user.vaiTro); },
    get donViOptions() {
      if (!this.data) return [];
      return [...new Set(this.data.rows.map(r => r.donVi).filter(Boolean))].sort();
    },
    get moiKhoa() {   // có ít nhất 1 dòng chưa khoá
      return this.data && this.data.rows.some(r => !r.isLocked);
    },

    async load() {
      this._clearMsg(); this.loading = true;
      try {
        const p = {};
        if (this.ky)    p.ky = this.ky;
        if (this.donVi) p.donVi = this.donVi;
        const r = await Api.getBangCong(p);
        this.data = r.data;
        this.ky = r.data.ky;
      } catch (e) { this.errorMsg = e.message; }
      finally { this.loading = false; }
    },

    async khoa() {
      if (!confirm('Khoá kỳ công ' + this.ky + (this.donVi ? ' — đơn vị ' + this.donVi : ' — TẤT CẢ đơn vị') + '?')) return;
      this.submitting = true; this._clearMsg();
      try {
        const r = await Api.khoaKyCong({ ky: this.ky, donVi: this.donVi || undefined });
        this.successMsg = 'Đã khoá ' + r.data.soNV + ' NV cho kỳ ' + this.ky;
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    async moKhoa() {
      const lyDo = prompt('Lý do mở khoá kỳ ' + this.ky + (this.donVi ? ' (đơn vị ' + this.donVi + ')' : '') + ':');
      if (lyDo === null) return;
      if (!lyDo.trim()) { this.errorMsg = 'Phải nhập lý do mở khoá'; return; }
      this.submitting = true; this._clearMsg();
      try {
        const r = await Api.moKhoaKyCong({ ky: this.ky, donVi: this.donVi || undefined, lyDo: lyDo.trim() });
        this.successMsg = 'Đã mở khoá ' + r.data.soNV + ' NV';
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    async xuat() {
      this._clearMsg();
      try {
        const r = await Api.xuatBangCong({ ky: this.ky, donVi: this.donVi || undefined, loai: this.cheDo });
        const a = document.createElement('a');
        a.href = 'data:' + r.data.mimeType + ';base64,' + r.data.base64;
        a.download = r.data.filename;
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { this.errorMsg = e.message; }
    },

    // ── Hiển thị ô mã ──────────────────────────────────────────────────────────
    maStyle(m) {
      if (m === '0') return 'color:var(--red);font-weight:600;';
      if (['P','R','Ô','TS','KL'].includes(m)) return 'color:var(--blue);';
      if (m === 'L') return 'color:var(--gray-5);';
      if (m === 'D') return 'color:var(--orange);font-weight:600;';
      return '';
    },
    soNgay(ngay) { return String(ngay).substring(8, 10); },
    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch (_) { return str; }
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}
