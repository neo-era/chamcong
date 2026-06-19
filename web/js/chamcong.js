// ─── chamcong.js ──────────────────────────────────────────────────────────────
// Alpine.js data function cho trang chamcong.html

function chamCongApp() {
  return {
    // State
    loading:     true,
    submitting:  false,
    chamCong:    null,   // bản ghi ChamCong hôm nay (null nếu chưa có)
    ca:          null,   // ca làm việc hôm nay
    ngay:        '',
    user:        null,
    danhSachCC:  [],     // lịch sử (7 ngày)

    // GPS
    gpsEnabled:  false,
    gpsLoading:  false,
    toaDo:       null,   // { lat, lng } hoặc null

    // Messages
    errorMsg:    '',
    successMsg:  '',

    // ── Computed ─────────────────────────────────────────────────────────────
    get daVao()    { return !!(this.chamCong && this.chamCong.gioVao); },
    get daRa()     { return !!(this.chamCong && this.chamCong.gioRa); },
    get coTheVao() { return !this.daVao && !this.submitting; },
    get coTheRa()  { return this.daVao && !this.daRa && !this.submitting; },

    get trangThaiLabel() {
      const map = {
        'Đủ công': 'badge-success', 'Đi trễ': 'badge-warning',
        'Về sớm': 'badge-warning',  'Mất công': 'badge-danger',
        'Vắng có phép': 'badge-info','Vắng không phép': 'badge-danger'
      };
      const tt = this.chamCong ? this.chamCong.trangThai : '';
      return { label: tt || '—', cls: map[tt] || 'badge-gray' };
    },

    get gioVaoFmt() { return this._fmtGio(this.chamCong && this.chamCong.gioVao); },
    get gioRaFmt()  { return this._fmtGio(this.chamCong && this.chamCong.gioRa); },

    // ── Khởi tạo ─────────────────────────────────────────────────────────────
    async init() {
      if (!requireLogin('index.html')) return;
      this.user = getCurrentUser();
      // Lấy thông tin NV đầy đủ từ backend (có vaiTro)
      try {
        const r = await Api.getProfile();
        Object.assign(this.user, r.data);
        sessionStorage.setItem('cc_user', JSON.stringify(this.user));
      } catch (_) { /* dùng thông tin GIS token */ }

      renderHeader('chamcong');
      await this.loadHomNay();
      await this.loadLichSu();
      this.loading = false;
    },

    async loadHomNay() {
      try {
        const r     = await Api.getChamCongHomNay();
        this.chamCong = r.data.chamCong;
        this.ca       = r.data.ca;
        this.ngay     = r.data.ngay;
      } catch (e) { this.errorMsg = e.message; }
    },

    async loadLichSu() {
      try {
        const den = this.ngay || _todayStr();
        const tu  = _subtractDays(den, 6);
        const r   = await Api.getChamCongKhoang({ tuNgay: tu, denNgay: den });
        this.danhSachCC = r.data.sort((a, b) => b.ngay.localeCompare(a.ngay));
      } catch (_) { /* lịch sử không quan trọng */ }
    },

    // ── GPS ──────────────────────────────────────────────────────────────────
    async toggleGPS() {
      if (this.gpsEnabled) {
        this.gpsEnabled = false; this.toaDo = null; return;
      }
      if (!navigator.geolocation) {
        this.errorMsg = 'Trình duyệt không hỗ trợ GPS'; return;
      }
      this.gpsLoading = true;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        );
        this.toaDo     = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.gpsEnabled = true;
        this.errorMsg  = '';
      } catch (e) {
        this.errorMsg = 'Không lấy được vị trí GPS: ' + (e.message || 'Bị từ chối');
      } finally { this.gpsLoading = false; }
    },

    // ── Chấm vào ─────────────────────────────────────────────────────────────
    async chamVao() {
      this._clearMsg(); this.submitting = true;
      try {
        const data = {};
        if (this.gpsEnabled && this.toaDo) {
          data.toaDo = this.toaDo.lat + ',' + this.toaDo.lng;
        }
        const r = await Api.chamVao(data);
        this.chamCong = { ...this.chamCong, ...r.data, gioVao: r.data.gioVao, trangThai: r.data.trangThai };
        this.successMsg = '✓ Đã chấm công vào lúc ' + this._fmtGio(r.data.gioVao);
        if (r.data.laCanhBao) {
          this.errorMsg = '⚠ Đi trễ — bị đánh dấu mất công ngày này (Điều 7.3 NQLĐ)';
        }
        await this.loadLichSu();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Chấm ra ──────────────────────────────────────────────────────────────
    async chamRa() {
      this._clearMsg(); this.submitting = true;
      try {
        const data = {};
        if (this.gpsEnabled && this.toaDo) {
          data.toaDo = this.toaDo.lat + ',' + this.toaDo.lng;
        }
        const r = await Api.chamRa(data);
        this.chamCong = { ...this.chamCong, gioRa: r.data.gioRa, trangThai: r.data.trangThai };
        this.successMsg = '✓ Đã chấm công ra lúc ' + this._fmtGio(r.data.gioRa);
        if (r.data.laCanhBao) {
          this.errorMsg = '⚠ Về sớm — bị đánh dấu mất công ngày này (Điều 7.3 NQLĐ)';
        }
        await this.loadLichSu();
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    },

    // ── Utilities ─────────────────────────────────────────────────────────────
    _fmtGio(iso) {
      if (!iso) return '—';
      try {
        const d = new Date(iso);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
      } catch (_) { return iso; }
    },
    _fmtNgay(str) {
      if (!str) return '';
      try {
        const [y,m,d] = str.substring(0,10).split('-');
        return d + '/' + m + '/' + y;
      } catch (_) { return str; }
    },
    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; },

    badgeCls(tt) {
      return { 'Đủ công': 'badge-success','Đi trễ':'badge-warning','Về sớm':'badge-warning',
               'Mất công':'badge-danger','Vắng có phép':'badge-info','Vắng không phép':'badge-danger' }[tt] || 'badge-gray';
    }
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
