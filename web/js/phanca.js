// ─── phanca.js ────────────────────────────────────────────────────────────────
// Alpine.js data function cho trang phanca.html

function phanCaApp() {
  return {
    loading:    true,
    submitting: false,
    errorMsg:   '',
    successMsg: '',
    canhBaos:   [],

    // Dữ liệu
    danhSachNV: [],
    danhSachCa: [],
    lichTruc:   {}, // { 'maNV_ngay': maCa }

    // Tuần hiện tại
    tuanBatDau:  '',
    tuanKetThuc: '',
    ngaysTuan:   [], // ['2026-06-15', ..., '2026-06-21']
    thuLabels:   ['T2','T3','T4','T5','T6','T7','CN'],

    // Modal phân ca nhanh
    showModal:   false,
    modalMaNV:   '',
    modalNgay:   '',
    modalMaCa:   '',

    // ── Init ──────────────────────────────────────────────────────────────────
    async init() {
      if (!requireLogin('index.html')) return;
      const user = getCurrentUser();
      if (!['ToTruong','TruongDonVi','HR','Admin','BGD'].includes(user && user.vaiTro)) {
        window.location.href = 'chamcong.html'; return;
      }
      renderHeader('phanca');
      this._setTuanHienTai();
      await Promise.all([ this.loadNhanVien(), this.loadCa() ]);
      await this.loadLichTruc();
      this.loading = false;
    },

    _setTuanHienTai() {
      const hom_nay = new Date();
      const thu = hom_nay.getDay(); // 0=CN
      const batDau = new Date(hom_nay);
      batDau.setDate(hom_nay.getDate() - (thu === 0 ? 6 : thu - 1));
      this.tuanBatDau  = _fmt(batDau);
      this.tuanKetThuc = _fmt(new Date(batDau.getTime() + 6 * 86400000));
      this.ngaysTuan   = Array.from({ length: 7 }, (_, i) => _fmt(new Date(batDau.getTime() + i * 86400000)));
    },

    async tuanTruoc() {
      const d = new Date(this.tuanBatDau + 'T00:00:00');
      d.setDate(d.getDate() - 7);
      this.tuanBatDau  = _fmt(d);
      this.tuanKetThuc = _fmt(new Date(d.getTime() + 6 * 86400000));
      this.ngaysTuan   = Array.from({ length: 7 }, (_, i) => _fmt(new Date(d.getTime() + i * 86400000)));
      await this.loadLichTruc();
    },

    async tuanSau() {
      const d = new Date(this.tuanBatDau + 'T00:00:00');
      d.setDate(d.getDate() + 7);
      this.tuanBatDau  = _fmt(d);
      this.tuanKetThuc = _fmt(new Date(d.getTime() + 6 * 86400000));
      this.ngaysTuan   = Array.from({ length: 7 }, (_, i) => _fmt(new Date(d.getTime() + i * 86400000)));
      await this.loadLichTruc();
    },

    // ── Load dữ liệu ─────────────────────────────────────────────────────────
    async loadNhanVien() {
      try {
        const r = await Api.getNhanVienList({ trangThai: 'Đang làm' });
        this.danhSachNV = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },

    async loadCa() {
      try {
        const r = await Api.getCaList();
        this.danhSachCa = r.data;
      } catch (e) { this.errorMsg = e.message; }
    },

    async loadLichTruc() {
      this.lichTruc = {};
      if (!this.danhSachNV.length) return;
      try {
        for (const nv of this.danhSachNV) {
          const r = await Api.getLichTrucTuan({
            maNV: nv.maNV, tuanBatDau: this.tuanBatDau, tuanKetThuc: this.tuanKetThuc
          });
          r.data.forEach(lt => {
            this.lichTruc[nv.maNV + '_' + lt.ngay.substring(0,10)] = lt.maCa;
          });
        }
      } catch (e) { this.errorMsg = e.message; }
    },

    // ── Lấy ca của ô ─────────────────────────────────────────────────────────
    getMaCa(maNV, ngay) { return this.lichTruc[maNV + '_' + ngay] || ''; },
    getTenCa(maNV, ngay) {
      const maCa = this.getMaCa(maNV, ngay);
      if (!maCa) return '';
      const ca = this.danhSachCa.find(c => c.maCa === maCa);
      return ca ? ca.tenCa : maCa;
    },

    // ── Click ô → mở modal ───────────────────────────────────────────────────
    moModalPhanCa(maNV, ngay) {
      this.modalMaNV = maNV;
      this.modalNgay = ngay;
      this.modalMaCa = this.getMaCa(maNV, ngay) || '';
      this.showModal = true;
      this.canhBaos  = [];
      this._clearMsg();
    },

    // ── Lưu phân ca ──────────────────────────────────────────────────────────
    async luuPhanCa() {
      if (!this.modalMaCa) { await this.xoaPhanCa(); return; }
      this.submitting = true; this._clearMsg();
      try {
        const r = await Api.setLichTruc({ maNV: this.modalMaNV, ngay: this.modalNgay, maCa: this.modalMaCa });
        this.lichTruc[this.modalMaNV + '_' + this.modalNgay] = this.modalMaCa;
        this.canhBaos  = r.canhBaos || [];
        if (!this.canhBaos.length) { this.showModal = false; this.successMsg = 'Đã lưu lịch trực'; }
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    async xoaPhanCa() {
      this.submitting = true;
      try {
        await Api.deleteLichTruc({ maNV: this.modalMaNV, ngay: this.modalNgay });
        delete this.lichTruc[this.modalMaNV + '_' + this.modalNgay];
        this.showModal = false;
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Utilities ─────────────────────────────────────────────────────────────
    fmtNgayNgan(str) {
      if (!str) return '';
      const [,m,d] = str.split('-');
      return d + '/' + m;
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}

function _fmt(d) { return d.toLocaleDateString('sv-SE'); }
