// ─── suachamcong.js ───────────────────────────────────────────────────────────
// Alpine.js data function cho trang sua-cham-cong.html (HR/Admin)
// Sửa thủ công bản ghi chấm công (bắt buộc lý do, ghi AuditLog) + khoá/mở khoá.

// Nhãn tiếng Việt của trạng thái (key lưu trong sheet là DU_CONG/TRE/...)
const TT_LABEL = {
  DU_CONG: 'Đủ công', TRE: 'Đi trễ', SOM: 'Về sớm',
  MAT_CONG: 'Mất công', VANG_PHEP: 'Vắng có phép', VANG_KHONG_PHEP: 'Vắng không phép'
};
const TT_BADGE = {
  DU_CONG: 'badge-success', TRE: 'badge-warning', SOM: 'badge-warning',
  MAT_CONG: 'badge-danger', VANG_PHEP: 'badge-info', VANG_KHONG_PHEP: 'badge-danger'
};

function suaChamCongApp() {
  return {
    loading:    true,
    submitting: false,
    danhSachNV: [],
    danhSach:   [],        // bản ghi chấm công đang xem
    errorMsg:   '',
    successMsg: '',

    // Bộ lọc
    maNV:    '',
    tuNgay:  '',
    denNgay: '',

    // Modal sửa
    showModal: false,
    form: { maCC: '', ngay: '', gioVao: '', gioRa: '', trangThai: '', lyDo: '' },

    ttOptions: ['DU_CONG','TRE','SOM','MAT_CONG','VANG_PHEP','VANG_KHONG_PHEP'],

    // ── Init ────────────────────────────────────────────────────────────────────
    async init() {
      if (!requireLogin('index.html')) return;
      const user = getCurrentUser();
      if (!['HR','Admin'].includes(user && user.vaiTro)) {
        window.location.href = 'chamcong.html'; return;
      }
      renderHeader('suachamcong');
      const den = this._todayStr();
      this.denNgay = den;
      this.tuNgay  = this._subtractDays(den, 6);
      await this.loadNhanVien();
      this.loading = false;
    },

    async loadNhanVien() {
      try {
        const r = await Api.getNhanVienList({ trangThai: '' });
        this.danhSachNV = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },

    // ── Tải bản ghi chấm công ───────────────────────────────────────────────────
    async timKiem() {
      this._clearMsg();
      if (!this.maNV)   { this.errorMsg = 'Chọn nhân viên trước'; return; }
      if (!this.tuNgay || !this.denNgay) { this.errorMsg = 'Chọn khoảng ngày'; return; }
      this.loading = true;
      try {
        const r = await Api.getChamCongKhoang({ maNV: this.maNV, tuNgay: this.tuNgay, denNgay: this.denNgay });
        this.danhSach = r.data.sort((a, b) => String(b.ngay).localeCompare(String(a.ngay)));
        if (!this.danhSach.length) this.successMsg = 'Không có bản ghi nào trong khoảng này';
      } catch (e) { this.errorMsg = e.message; }
      finally { this.loading = false; }
    },

    // ── Modal sửa ───────────────────────────────────────────────────────────────
    moModalSua(cc) {
      if (this.laKhoa(cc)) { this.errorMsg = 'Bản ghi đã khoá — mở khoá trước khi sửa'; return; }
      this.form = {
        maCC:      cc.maCC,
        ngay:      this._fmtNgayISO(cc.ngay),
        gioVao:    this._isoToTime(cc.gioVao),
        gioRa:     this._isoToTime(cc.gioRa),
        trangThai: '',          // rỗng = tự tính lại từ giờ
        lyDo:      ''
      };
      this._clearMsg();
      this.showModal = true;
    },

    dongModal() { this.showModal = false; },

    async luu() {
      this._clearMsg();
      if (!this.form.lyDo.trim()) { this.errorMsg = 'Phải nhập lý do sửa'; return; }
      this.submitting = true;
      try {
        const payload = { maCC: this.form.maCC, lyDo: this.form.lyDo.trim() };
        if (this.form.gioVao) payload.gioVao = this._timeToIso(this.form.ngay, this.form.gioVao);
        if (this.form.gioRa)  payload.gioRa  = this._timeToIso(this.form.ngay, this.form.gioRa);
        if (this.form.trangThai) payload.trangThai = this.form.trangThai;
        await Api.suaChamCong(payload);
        this.successMsg = 'Đã cập nhật bản ghi ' + this.form.maCC;
        this.showModal = false;
        await this.timKiem();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Khoá / mở khoá ──────────────────────────────────────────────────────────
    async khoa(cc) {
      this._clearMsg();
      if (!confirm('Khoá bản ghi ngày ' + this.fmtNgay(cc.ngay) + '? Sau khi khoá không sửa được cho tới khi mở khoá.')) return;
      try {
        await Api.khoaChamCong({ maCC: cc.maCC });
        this.successMsg = 'Đã khoá bản ghi ' + cc.maCC;
        await this.timKiem();
      } catch (e) { this.errorMsg = e.message; }
    },

    async moKhoa(cc) {
      this._clearMsg();
      const lyDo = prompt('Nhập lý do mở khoá bản ghi ngày ' + this.fmtNgay(cc.ngay) + ':');
      if (lyDo === null) return;
      if (!lyDo.trim()) { this.errorMsg = 'Phải nhập lý do mở khoá'; return; }
      try {
        await Api.moKhoaChamCong({ maCC: cc.maCC, lyDo: lyDo.trim() });
        this.successMsg = 'Đã mở khoá bản ghi ' + cc.maCC;
        await this.timKiem();
      } catch (e) { this.errorMsg = e.message; }
    },

    // ── Utilities ───────────────────────────────────────────────────────────────
    laKhoa(cc) { return cc.isLocked === true || String(cc.isLocked).toUpperCase() === 'TRUE'; },
    ttLabel(key) { return TT_LABEL[key] || key || '—'; },
    ttBadge(key) { return TT_BADGE[key] || 'badge-gray'; },
    nvLabel(maNV) {
      const nv = this.danhSachNV.find(n => n.maNV === maNV);
      return nv ? (nv.hoTen + ' (' + nv.maNV + ')') : maNV;
    },

    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch (_) { return str; }
    },
    fmtGio(iso) { return this._isoToTime(iso) || '—'; },

    _isoToTime(iso) {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleTimeString('vi-VN',
          { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
      } catch (_) { return ''; }
    },
    // Ghép ngày (yyyy-MM-dd) + giờ (HH:mm) thành ISO có offset VN (+07:00)
    _timeToIso(ngayISO, hhmm) {
      return ngayISO + 'T' + (hhmm.length === 5 ? hhmm : hhmm.substring(0,5)) + ':00+07:00';
    },
    _fmtNgayISO(str) { return String(str).substring(0, 10); },
    _todayStr() { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); },
    _subtractDays(dateStr, days) {
      const d = new Date(dateStr + 'T00:00:00');
      d.setDate(d.getDate() - days);
      return d.toLocaleDateString('sv-SE');
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}
