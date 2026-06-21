// ─── donton.js ────────────────────────────────────────────────────────────────
// Alpine.js cho trang don-tu.html — tạo đơn + theo dõi đơn của mình.

const LOAI_DON_LIST = [
  'Phép năm', 'Việc riêng', 'Không lương', 'OT', 'Công tác', 'Ra ngoài',
  'Ốm đau', 'Chăm con ốm', 'Thai sản nữ', 'Thai sản nam', 'TNLĐ-BNN', 'Khám thai'
];

function donTuApp() {
  return {
    loading:    true,
    submitting: false,
    danhSach:   [],
    loaiDonList: LOAI_DON_LIST,
    errorMsg:   '',
    successMsg: '',
    canhBao:    '',

    // Form tạo / sửa-bổ-sung
    showModal: false,
    isBoSung:  false,
    form: _emptyDon(),

    async init() {
      if (!requireLogin('index.html')) return;
      renderHeader('dontu');
      await this.load();
      this.loading = false;
    },

    async load() {
      try {
        const r = await Api.danhSachDonCuaToi();
        this.danhSach = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },

    // Số ngày ước tính phía client (loại T7/CN; ngày lễ do backend chốt)
    get soNgayPreview() {
      if (this.form.donViTinh === 'Nửa ngày') return 0.5;
      if (!this.form.tuNgay || !this.form.denNgay) return 0;
      let count = 0;
      const d = new Date(this.form.tuNgay + 'T00:00:00');
      const end = new Date(this.form.denNgay + 'T00:00:00');
      if (end < d) return 0;
      while (d <= end) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) count++;
        d.setDate(d.getDate() + 1);
      }
      return count;
    },

    moModalTao() {
      this.form = _emptyDon();
      this.isBoSung = false;
      this._clearMsg();
      this.showModal = true;
    },

    moModalBoSung(don) {
      this.form = {
        maDon: don.maDon, loaiDon: don.loaiDon, donViTinh: don.donViTinh,
        tuNgay: String(don.tuNgay).substring(0, 10),
        denNgay: String(don.denNgay).substring(0, 10),
        lyDo: don.lyDo, dinhKem: don.dinhKem || ''
      };
      this.isBoSung = true;
      this._clearMsg();
      this.showModal = true;
    },

    dongModal() { this.showModal = false; },

    async luu() {
      this._clearMsg();
      if (!this.form.loaiDon) { this.errorMsg = 'Chọn loại đơn'; return; }
      if (!this.form.tuNgay)  { this.errorMsg = 'Chọn từ ngày'; return; }
      if (!this.form.lyDo.trim()) { this.errorMsg = 'Nhập lý do'; return; }
      this.submitting = true;
      try {
        const payload = {
          loaiDon: this.form.loaiDon,
          donViTinh: this.form.donViTinh,
          tuNgay: this.form.tuNgay,
          denNgay: this.form.denNgay || this.form.tuNgay,
          lyDo: this.form.lyDo.trim(),
          dinhKem: this.form.dinhKem
        };
        let r;
        if (this.isBoSung) {
          payload.maDon = this.form.maDon;
          r = await Api.suaDonBoSung(payload);
          this.successMsg = 'Đã nộp lại đơn ' + this.form.maDon;
        } else {
          r = await Api.taoDon(payload);
          this.successMsg = 'Đã gửi đơn (' + r.data.soNgay + ' ngày)';
          if (r.data.canhBao) this.canhBao = r.data.canhBao;
        }
        this.showModal = false;
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    async thuHoi(don) {
      this._clearMsg();
      if (!confirm('Thu hồi đơn ' + don.maDon + '?')) return;
      try {
        await Api.thuHoiDon(don.maDon);
        this.successMsg = 'Đã thu hồi đơn ' + don.maDon;
        await this.load();
      } catch (e) { this.errorMsg = e.message; }
    },

    // ── Utilities ───────────────────────────────────────────────────────────────
    coTheThuHoi(don) { return ['Chờ duyệt', 'Bổ sung'].includes(don.trangThai); },
    coTheBoSung(don) { return don.trangThai === 'Bổ sung'; },
    fmtNgay(str) {
      if (!str) return '—';
      try { const [y,m,d] = String(str).substring(0,10).split('-'); return d+'/'+m+'/'+y; }
      catch (_) { return str; }
    },
    badgeDon(tt) {
      return { 'Chờ duyệt':'badge-warning', 'Đã duyệt':'badge-success', 'Từ chối':'badge-danger',
               'Bổ sung':'badge-info', 'Thu hồi':'badge-gray' }[tt] || 'badge-gray';
    },
    moTaBuoc(b) {
      const nguoi = (b.nguoiDuyetTen || b.nguoiDuyet || '?') +
                    (b.nguoiDuyetTen ? ' (' + b.nguoiDuyet + ')' : '');
      return 'Cấp ' + b.capDuyet + ' · ' + nguoi + ': ' + b.ketQua +
             (b.yKien ? ' — ' + b.yKien : '') + ' (' + this.fmtNgay(b.thoiDiem) + ')';
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; this.canhBao = ''; }
  };
}

function _emptyDon() {
  return { maDon: '', loaiDon: '', donViTinh: 'Ngày', tuNgay: '', denNgay: '', lyDo: '', dinhKem: '' };
}
