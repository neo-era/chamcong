// ─── chamcong.js ──────────────────────────────────────────────────────────────
// Alpine.js data function cho trang chamcong.html
// Hỗ trợ ĐA CA/ngày: chọn ca khi chấm vào, chấm ra ca đang mở (kể cả ca đêm vắt nửa đêm),
// và cảnh báo trần giờ (>12h/ngày, nghỉ tuần <24h).

function chamCongApp() {
  return {
    // State
    loading:     true,
    submitting:  false,
    refreshing:  false,
    ngay:        '',
    user:        null,

    caList:      [],     // ca được phân hôm nay
    tatCaCa:     [],     // toàn bộ ca (cho phép chọn khi không có lịch — vd tăng cường)
    records:     [],     // các bản ghi đã chấm trong ngày (đa ca)
    moDang:      null,   // ca đang mở (đã vào chưa ra) — có thể là ca đêm hôm qua
    selectedCa:  '',     // maCa người dùng chọn để chấm vào

    danhSachCC:  [],     // lịch sử (7 ngày)
    canhBaoList: [],     // cảnh báo trần giờ sau khi chấm ra

    // GPS
    gpsEnabled:  false,
    gpsLoading:  false,
    toaDo:       null,
    viTri:       null,     // kết quả xác minh địa bàn { trongDiaBan, diaChi, loi, canhBao }
    checkingVT:  false,

    // Messages
    errorMsg:    '',
    successMsg:  '',

    // ── Computed ─────────────────────────────────────────────────────────────
    // Danh sách ca chọn được khi chấm vào: ưu tiên ca phân hôm nay, không có → toàn bộ ca.
    get caOptions() {
      return (this.caList && this.caList.length) ? this.caList : (this.tatCaCa || []);
    },
    // Ngoài địa bàn (đã xác minh được, không phải lỗi) → chặn chấm
    get ngoaiDiaBan() { return !!(this.gpsEnabled && this.viTri && this.viTri.kiemTra && !this.viTri.loi && !this.viTri.trongDiaBan); },
    get coTheVao() { return !this.moDang && !this.submitting && this.caOptions.length > 0 && !this.ngoaiDiaBan && !this.checkingVT; },
    get coTheRa()  { return !!this.moDang && !this.submitting && !this.ngoaiDiaBan && !this.checkingVT; },
    get caDangMo() { return this.moDang ? (this.moDang.ca || null) : null; },

    // ── Khởi tạo ─────────────────────────────────────────────────────────────
    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      try {
        const r = await Api.getProfile();
        Object.assign(this.user, r.data);
        sessionStorage.setItem('cc_user', JSON.stringify(this.user));
      } catch (_) { /* dùng thông tin lưu trong sessionStorage */ }

      renderHeader('chamcong');
      await this.loadHomNay();
      await this.loadLichSu();
      this.loading = false;
    },

    async loadHomNay() {
      try {
        const r = await Api.getChamCongHomNay();
        this.ngay    = r.data.ngay;
        this.caList  = r.data.caList  || [];
        this.tatCaCa = r.data.tatCaCa || [];
        this.records = r.data.records || [];
        this.moDang  = r.data.moDang  || null;
        // Mặc định chọn ca đầu tiên còn chưa chấm (nếu có)
        if (!this.selectedCa && this.caOptions.length) {
          const chuaCham = this.caOptions.find(c => !this._daChamCa(c.maCa));
          this.selectedCa = (chuaCham || this.caOptions[0]).maCa;
        }
      } catch (e) { this.errorMsg = e.message; }
    },

    async loadLichSu() {
      try {
        const den = this.ngay || _todayStr();
        const tu  = _subtractDays(den, 6);
        const r   = await Api.getChamCongKhoang({ tuNgay: tu, denNgay: den });
        this.danhSachCC = r.data.sort((a, b) =>
          (b.ngay.localeCompare(a.ngay)) || (this._ts(b.gioVao) - this._ts(a.gioVao)));
      } catch (_) { /* lịch sử không quan trọng */ }
    },

    // Đã có bản ghi đã-vào cho ca này trong ngày chưa
    _daChamCa(maCa) {
      return this.records.some(r => String(r.maCa) === String(maCa) && r.gioVao);
    },

    // ── GPS ──────────────────────────────────────────────────────────────────
    async toggleGPS() {
      if (this.gpsEnabled) { this.gpsEnabled = false; this.toaDo = null; this.viTri = null; return; }
      if (!navigator.geolocation) { this.errorMsg = 'Trình duyệt không hỗ trợ GPS'; return; }
      this.gpsLoading = true;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true })
        );
        this.toaDo      = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.gpsEnabled = true;
        this.errorMsg   = '';
        await this.xacMinhViTri();
      } catch (e) {
        this.errorMsg = 'Không lấy được vị trí GPS: ' + (e.message || 'Bị từ chối');
      } finally { this.gpsLoading = false; }
    },

    // Gọi backend đổi toạ độ → địa chỉ + kiểm tra địa bàn
    async xacMinhViTri() {
      if (!this.toaDo) return;
      this.checkingVT = true; this.viTri = null;
      try {
        const r = await Api.kiemTraViTri({ toaDo: this.toaDo.lat + ',' + this.toaDo.lng });
        this.viTri = r.data;
      } catch (e) {
        this.viTri = { kiemTra: true, loi: true, trongDiaBan: true, canhBao: 'Không kiểm tra được khu vực: ' + e.message };
      } finally { this.checkingVT = false; }
    },

    // ── Chấm vào ─────────────────────────────────────────────────────────────
    async chamVao() {
      this._clearMsg(); this.canhBaoList = [];
      let maCa = this.selectedCa;
      if (!maCa && this.caOptions.length === 1) maCa = this.caOptions[0].maCa;
      if (!maCa) { this.errorMsg = 'Vui lòng chọn ca trước khi chấm vào'; return; }

      this.submitting = true;
      try {
        const data = { maCa };
        if (this.gpsEnabled && this.toaDo) data.toaDo = this.toaDo.lat + ',' + this.toaDo.lng;
        const r = await Api.chamVao(data);
        this.successMsg = '✓ Đã chấm vào ca ' + (r.data.tenCa || '') + ' lúc ' + this._fmtGio(r.data.gioVao);
        if (r.data.laCanhBao) {
          this.errorMsg = '⚠ Đi trễ — bị đánh dấu mất công ngày này (Điều 7.3 NQLĐ)';
        }
        if (r.data.canhBao && r.data.canhBao.length) this.canhBaoList = r.data.canhBao;
        await this.loadHomNay();
        await this.loadLichSu();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Chấm ra ──────────────────────────────────────────────────────────────
    async chamRa() {
      this._clearMsg(); this.canhBaoList = [];
      this.submitting = true;
      try {
        const data = {};
        if (this.gpsEnabled && this.toaDo) data.toaDo = this.toaDo.lat + ',' + this.toaDo.lng;
        const r = await Api.chamRa(data);
        this.successMsg = '✓ Đã chấm ra lúc ' + this._fmtGio(r.data.gioRa) +
          (r.data.soGioCong ? ' — ' + r.data.soGioCong + 'h công' : '');
        if (r.data.laCanhBao) {
          this.errorMsg = '⚠ Về sớm — bị đánh dấu mất công ngày này (Điều 7.3 NQLĐ)';
        }
        if (r.data.canhBao && r.data.canhBao.length) this.canhBaoList = r.data.canhBao;
        await this.loadHomNay();
        await this.loadLichSu();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    async refresh() {
      if (this.refreshing) return;
      this.refreshing = true;
      this._clearMsg(); this.canhBaoList = [];
      await this.loadHomNay();
      await this.loadLichSu();
      this.refreshing = false;
    },

    // ── Utilities ─────────────────────────────────────────────────────────────
    caLabel(ca) {
      if (!ca) return '—';
      return ca.tenCa + ' (' + ca.gioBatDau + '–' + ca.gioKetThuc + ')' + (this._laDem(ca) ? ' 🌙' : '');
    },
    _laDem(ca) {
      return ca && (ca.banDem === true || String(ca.banDem).toUpperCase() === 'TRUE');
    },
    // Ca mở quá lâu (>18h) → nhiều khả năng quên chấm ra
    _quaHan(r) {
      if (!r || !r.gioVao) return false;
      return (Date.now() - new Date(r.gioVao).getTime()) / 3600000 > 18;
    },
    // Epoch ms để sắp xếp theo instant (bền với chuỗi UTC cũ + giờ VN mới)
    _ts(v) { if (!v) return 0; const t = new Date(v).getTime(); return isNaN(t) ? 0 : t; },
    _fmtGio(iso) {
      if (!iso) return '—';
      try {
        return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
      } catch (_) { return iso; }
    },
    _fmtNgay(str) {
      if (!str) return '';
      try { const [y,m,d] = str.substring(0,10).split('-'); return d + '/' + m + '/' + y; }
      catch (_) { return str; }
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; },

    // Địa chỉ hiển thị: ưu tiên diaChi đã geocode, không có → nguồn (Trụ sở), cuối cùng '—'
    diaChiText(r) { return (r && (r.diaChi || r.nguon)) || '—'; },

    badgeCls(tt) { return _ttBadge(tt); },
    ttLabel(tt)  { return _ttLabel(tt); }
  };
}

function _todayStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}
function _subtractDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('sv-SE');
}

const _TT_LABEL = {
  DU_CONG:'Đủ công', TRE:'Đi trễ', SOM:'Về sớm',
  MAT_CONG:'Mất công', VANG_PHEP:'Vắng có phép', VANG_KHONG_PHEP:'Vắng không phép'
};
const _TT_BADGE = {
  DU_CONG:'badge-success', TRE:'badge-warning', SOM:'badge-warning',
  MAT_CONG:'badge-danger', VANG_PHEP:'badge-info', VANG_KHONG_PHEP:'badge-danger'
};
function _ttLabel(tt) { return _TT_LABEL[tt] || tt || '—'; }
function _ttBadge(tt) { return _TT_BADGE[tt] || 'badge-gray'; }
