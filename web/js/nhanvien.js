// ─── nhanvien.js ──────────────────────────────────────────────────────────────
// Alpine.js data function cho trang nhanvien.html (HR/Admin)

// 168 phường/xã/đặc khu TP.HCM mới (hiệu lực 1/7/2025, Nghị quyết 202/2025/QH15)
// Nguồn: bccgroup.vn, ghtk.vn, tuanvision.com
// { label: hiển thị trong picker (có quận/huyện), value: tên lưu vào sheet }
const PHUONG_TPHCM = [
  // ── Quận 1 (4 phường) ────────────────────────────────────────────────────
  { label:'Phường Sài Gòn — Q.1',        value:'Sài Gòn' },
  { label:'Phường Tân Định — Q.1',        value:'Tân Định' },
  { label:'Phường Bến Thành — Q.1',       value:'Bến Thành' },
  { label:'Phường Cầu Ông Lãnh — Q.1',   value:'Cầu Ông Lãnh' },
  // ── Quận 3 (3 phường) ────────────────────────────────────────────────────
  { label:'Phường Bàn Cờ — Q.3',         value:'Bàn Cờ' },
  { label:'Phường Xuân Hòa — Q.3',       value:'Xuân Hòa' },
  { label:'Phường Nhiêu Lộc — Q.3',      value:'Nhiêu Lộc' },
  // ── Quận 4 (3 phường) ────────────────────────────────────────────────────
  { label:'Phường Xóm Chiếu — Q.4',      value:'Xóm Chiếu' },
  { label:'Phường Khánh Hội — Q.4',      value:'Khánh Hội' },
  { label:'Phường Vĩnh Hội — Q.4',       value:'Vĩnh Hội' },
  // ── Quận 5 (3 phường) ────────────────────────────────────────────────────
  { label:'Phường Chợ Quán — Q.5',       value:'Chợ Quán' },
  { label:'Phường An Đông — Q.5',        value:'An Đông' },
  { label:'Phường Chợ Lớn — Q.5',       value:'Chợ Lớn' },
  // ── Quận 6 (4 phường) ────────────────────────────────────────────────────
  { label:'Phường Bình Tây — Q.6',       value:'Bình Tây' },
  { label:'Phường Bình Tiên — Q.6',      value:'Bình Tiên' },
  { label:'Phường Bình Phú — Q.6',       value:'Bình Phú' },
  { label:'Phường Phú Lâm — Q.6',        value:'Phú Lâm' },
  // ── Quận 7 (4 phường) ────────────────────────────────────────────────────
  { label:'Phường Tân Thuận — Q.7',      value:'Tân Thuận' },
  { label:'Phường Phú Thuận — Q.7',      value:'Phú Thuận' },
  { label:'Phường Tân Mỹ — Q.7',         value:'Tân Mỹ' },
  { label:'Phường Tân Hưng — Q.7',       value:'Tân Hưng' },
  // ── Quận 8 (3 phường) ────────────────────────────────────────────────────
  { label:'Phường Chánh Hưng — Q.8',     value:'Chánh Hưng' },
  { label:'Phường Phú Định — Q.8',       value:'Phú Định' },
  { label:'Phường Bình Đông — Q.8',      value:'Bình Đông' },
  // ── Quận 10 (3 phường) ───────────────────────────────────────────────────
  { label:'Phường Diên Hồng — Q.10',     value:'Diên Hồng' },
  { label:'Phường Vườn Lài — Q.10',      value:'Vườn Lài' },
  { label:'Phường Hòa Hưng — Q.10',      value:'Hòa Hưng' },
  // ── Quận 11 (4 phường) ───────────────────────────────────────────────────
  { label:'Phường Minh Phụng — Q.11',    value:'Minh Phụng' },
  { label:'Phường Bình Thới — Q.11',     value:'Bình Thới' },
  { label:'Phường Hòa Bình — Q.11',      value:'Hòa Bình' },
  { label:'Phường Phú Thọ — Q.11',       value:'Phú Thọ' },
  // ── Quận 12 (5 phường) ───────────────────────────────────────────────────
  { label:'Phường Đông Hưng Thuận — Q.12', value:'Đông Hưng Thuận' },
  { label:'Phường Trung Mỹ Tây — Q.12',   value:'Trung Mỹ Tây' },
  { label:'Phường Tân Thới Hiệp — Q.12',  value:'Tân Thới Hiệp' },
  { label:'Phường Thới An — Q.12',         value:'Thới An' },
  { label:'Phường An Phú Đông — Q.12',     value:'An Phú Đông' },
  // ── Quận Bình Thạnh (5 phường) ───────────────────────────────────────────
  { label:'Phường Gia Định — Bình Thạnh',     value:'Gia Định' },
  { label:'Phường Bình Thạnh — Bình Thạnh',   value:'Bình Thạnh' },
  { label:'Phường Bình Lợi Trung — Bình Thạnh', value:'Bình Lợi Trung' },
  { label:'Phường Thạnh Mỹ Tây — Bình Thạnh', value:'Thạnh Mỹ Tây' },
  { label:'Phường Bình Quới — Bình Thạnh',    value:'Bình Quới' },
  // ── Quận Bình Tân (5 phường) ─────────────────────────────────────────────
  { label:'Phường An Lạc — Bình Tân',         value:'An Lạc' },
  { label:'Phường Bình Tân — Bình Tân',        value:'Bình Tân' },
  { label:'Phường Tân Tạo — Bình Tân',         value:'Tân Tạo' },
  { label:'Phường Bình Trị Đông — Bình Tân',   value:'Bình Trị Đông' },
  { label:'Phường Bình Hưng Hòa — Bình Tân',  value:'Bình Hưng Hòa' },
  // ── Quận Gò Vấp (6 phường) ───────────────────────────────────────────────
  { label:'Phường Hạnh Thông — Gò Vấp',       value:'Hạnh Thông' },
  { label:'Phường An Nhơn — Gò Vấp',          value:'An Nhơn' },
  { label:'Phường Gò Vấp — Gò Vấp',           value:'Gò Vấp' },
  { label:'Phường An Hội Đông — Gò Vấp',      value:'An Hội Đông' },
  { label:'Phường Thông Tây Hội — Gò Vấp',    value:'Thông Tây Hội' },
  { label:'Phường An Hội Tây — Gò Vấp',       value:'An Hội Tây' },
  // ── Quận Phú Nhuận (3 phường) ────────────────────────────────────────────
  { label:'Phường Đức Nhuận — Phú Nhuận',     value:'Đức Nhuận' },
  { label:'Phường Cầu Kiệu — Phú Nhuận',      value:'Cầu Kiệu' },
  { label:'Phường Phú Nhuận — Phú Nhuận',     value:'Phú Nhuận' },
  // ── Quận Tân Bình (6 phường) ─────────────────────────────────────────────
  { label:'Phường Tân Sơn Hòa — Tân Bình',    value:'Tân Sơn Hòa' },
  { label:'Phường Tân Sơn Nhất — Tân Bình',   value:'Tân Sơn Nhất' },
  { label:'Phường Tân Hòa — Tân Bình',         value:'Tân Hòa' },
  { label:'Phường Bảy Hiền — Tân Bình',        value:'Bảy Hiền' },
  { label:'Phường Tân Bình — Tân Bình',         value:'Tân Bình' },
  { label:'Phường Tân Sơn — Tân Bình',          value:'Tân Sơn' },
  // ── Quận Tân Phú (5 phường) ──────────────────────────────────────────────
  { label:'Phường Tây Thạnh — Tân Phú',        value:'Tây Thạnh' },
  { label:'Phường Tân Sơn Nhì — Tân Phú',      value:'Tân Sơn Nhì' },
  { label:'Phường Phú Thọ Hòa — Tân Phú',      value:'Phú Thọ Hòa' },
  { label:'Phường Tân Phú — Tân Phú',           value:'Tân Phú' },
  { label:'Phường Phú Thạnh — Tân Phú',         value:'Phú Thạnh' },
  // ── TP. Thủ Đức (12 phường) ──────────────────────────────────────────────
  { label:'Phường Hiệp Bình — Thủ Đức',        value:'Hiệp Bình' },
  { label:'Phường Thủ Đức — Thủ Đức',           value:'Thủ Đức' },
  { label:'Phường Tam Bình — Thủ Đức',          value:'Tam Bình' },
  { label:'Phường Linh Xuân — Thủ Đức',         value:'Linh Xuân' },
  { label:'Phường Tăng Nhơn Phú — Thủ Đức',    value:'Tăng Nhơn Phú' },
  { label:'Phường Long Bình — Thủ Đức',         value:'Long Bình' },
  { label:'Phường Long Phước — Thủ Đức',        value:'Long Phước' },
  { label:'Phường Long Trường — Thủ Đức',       value:'Long Trường' },
  { label:'Phường Cát Lái — Thủ Đức',           value:'Cát Lái' },
  { label:'Phường Bình Trưng — Thủ Đức',        value:'Bình Trưng' },
  { label:'Phường Phước Long — Thủ Đức',        value:'Phước Long' },
  { label:'Phường An Khánh — Thủ Đức',          value:'An Khánh' },
  // ── Huyện Bình Chánh (7 xã) ──────────────────────────────────────────────
  { label:'Xã Vĩnh Lộc — H.Bình Chánh',        value:'Vĩnh Lộc' },
  { label:'Xã Tân Vĩnh Lộc — H.Bình Chánh',    value:'Tân Vĩnh Lộc' },
  { label:'Xã Bình Lợi — H.Bình Chánh',         value:'Bình Lợi' },
  { label:'Xã Tân Nhựt — H.Bình Chánh',         value:'Tân Nhựt' },
  { label:'Xã Bình Chánh — H.Bình Chánh',       value:'Bình Chánh' },
  { label:'Xã Hưng Long — H.Bình Chánh',        value:'Hưng Long' },
  { label:'Xã Bình Hưng — H.Bình Chánh',        value:'Bình Hưng' },
  // ── Huyện Cần Giờ (4 xã) ────────────────────────────────────────────────
  { label:'Xã Bình Khánh — H.Cần Giờ',          value:'Bình Khánh' },
  { label:'Xã An Thới Đông — H.Cần Giờ',        value:'An Thới Đông' },
  { label:'Xã Cần Giờ — H.Cần Giờ',             value:'Cần Giờ' },
  { label:'Xã Thạnh An — H.Cần Giờ',            value:'Thạnh An' },
  // ── Huyện Củ Chi (7 xã) ─────────────────────────────────────────────────
  { label:'Xã Củ Chi — H.Củ Chi',               value:'Củ Chi' },
  { label:'Xã Tân An Hội — H.Củ Chi',           value:'Tân An Hội' },
  { label:'Xã Thái Mỹ — H.Củ Chi',              value:'Thái Mỹ' },
  { label:'Xã An Nhơn Tây — H.Củ Chi',          value:'An Nhơn Tây' },
  { label:'Xã Nhuận Đức — H.Củ Chi',            value:'Nhuận Đức' },
  { label:'Xã Phú Hòa Đông — H.Củ Chi',         value:'Phú Hòa Đông' },
  { label:'Xã Bình Mỹ — H.Củ Chi',              value:'Bình Mỹ' },
  // ── Huyện Hóc Môn (4 xã) ────────────────────────────────────────────────
  { label:'Xã Đông Thạnh — H.Hóc Môn',          value:'Đông Thạnh' },
  { label:'Xã Hóc Môn — H.Hóc Môn',             value:'Hóc Môn' },
  { label:'Xã Xuân Thới Sơn — H.Hóc Môn',       value:'Xuân Thới Sơn' },
  { label:'Xã Bà Điểm — H.Hóc Môn',             value:'Bà Điểm' },
  // ── Huyện Nhà Bè (2 xã) ─────────────────────────────────────────────────
  { label:'Xã Nhà Bè — H.Nhà Bè',               value:'Nhà Bè' },
  { label:'Xã Hiệp Phước — H.Nhà Bè',           value:'Hiệp Phước' },
  // ── Khu vực Bình Dương (sáp nhập vào TP.HCM, 36 phường/xã) ──────────────
  { label:'Phường Đông Hòa — Dĩ An',            value:'Đông Hòa' },
  { label:'Phường Dĩ An — Dĩ An',               value:'Dĩ An' },
  { label:'Phường Tân Đông Hiệp — Dĩ An',       value:'Tân Đông Hiệp' },
  { label:'Phường An Phú — Thuận An',            value:'An Phú (Thuận An)' },
  { label:'Phường Bình Hòa — Thuận An',          value:'Bình Hòa' },
  { label:'Phường Lái Thiêu — Thuận An',         value:'Lái Thiêu' },
  { label:'Phường Thuận An — Thuận An',           value:'Thuận An' },
  { label:'Phường Thuận Giao — Thuận An',         value:'Thuận Giao' },
  { label:'Phường Thủ Dầu Một — Thủ Dầu Một',   value:'Thủ Dầu Một' },
  { label:'Phường Phú Lợi — Thủ Dầu Một',       value:'Phú Lợi' },
  { label:'Phường Chánh Hiệp — Thủ Dầu Một',    value:'Chánh Hiệp' },
  { label:'Phường Bình Dương — Thủ Dầu Một',    value:'Bình Dương' },
  { label:'Phường Hòa Lợi — Bàu Bàng',          value:'Hòa Lợi' },
  { label:'Phường Phú An — Bàu Bàng',            value:'Phú An' },
  { label:'Phường Tây Nam — Bàu Bàng',           value:'Tây Nam' },
  { label:'Xã Long Nguyên — Bàu Bàng',           value:'Long Nguyên' },
  { label:'Phường Bến Cát — Bến Cát',            value:'Bến Cát' },
  { label:'Xã Chánh Phú Hòa — Bến Cát',         value:'Chánh Phú Hòa' },
  { label:'Xã Vĩnh Tân — Bến Cát',              value:'Vĩnh Tân' },
  { label:'Xã Bình Cơ — Bến Cát',               value:'Bình Cơ' },
  { label:'Phường Tân Uyên — Tân Uyên',          value:'Tân Uyên' },
  { label:'Xã Tân Hiệp — Tân Uyên',             value:'Tân Hiệp (Tân Uyên)' },
  { label:'Phường Tân Khánh — Tân Uyên',         value:'Tân Khánh' },
  { label:'Xã Thường Tân — Tân Uyên',            value:'Thường Tân' },
  { label:'Xã Bắc Tân Uyên — Tân Uyên',         value:'Bắc Tân Uyên' },
  { label:'Xã Phú Giáo — Phú Giáo',             value:'Phú Giáo' },
  { label:'Xã Phước Hòa — Phú Giáo',            value:'Phước Hòa' },
  { label:'Xã Phước Thành — Phú Giáo',          value:'Phước Thành' },
  { label:'Xã An Long — Phú Giáo',              value:'An Long' },
  { label:'Xã Trừ Văn Thố — Bàu Bàng',          value:'Trừ Văn Thố' },
  { label:'Xã Bàu Bàng — Bàu Bàng',             value:'Bàu Bàng' },
  { label:'Xã Long Hòa — Dầu Tiếng',            value:'Long Hòa' },
  { label:'Xã Thanh An — Dầu Tiếng',            value:'Thanh An' },
  { label:'Xã Dầu Tiếng — Dầu Tiếng',           value:'Dầu Tiếng' },
  { label:'Xã Minh Thạnh — Dầu Tiếng',          value:'Minh Thạnh' },
  { label:'Phường Thới Hòa — Bến Cát',           value:'Thới Hòa' },
  // ── Khu vực Bà Rịa - Vũng Tàu (sáp nhập vào TP.HCM, 30 đơn vị) ─────────
  { label:'Phường Vũng Tàu — Vũng Tàu',         value:'Vũng Tàu' },
  { label:'Phường Tam Thắng — Vũng Tàu',        value:'Tam Thắng' },
  { label:'Phường Rạch Dừa — Vũng Tàu',         value:'Rạch Dừa' },
  { label:'Phường Phước Thắng — Vũng Tàu',      value:'Phước Thắng' },
  { label:'Phường Long Hương — Bà Rịa',         value:'Long Hương' },
  { label:'Phường Bà Rịa — Bà Rịa',             value:'Bà Rịa' },
  { label:'Xã Tam Long — Châu Đức',             value:'Tam Long' },
  { label:'Xã Tân Hải — Phú Mỹ',               value:'Tân Hải' },
  { label:'Xã Tân Phước — Phú Mỹ',             value:'Tân Phước' },
  { label:'Phường Phú Mỹ — Phú Mỹ',            value:'Phú Mỹ' },
  { label:'Xã Tân Thành — Phú Mỹ',             value:'Tân Thành' },
  { label:'Xã Châu Pha — Phú Mỹ',              value:'Châu Pha' },
  { label:'Xã Long Hải — Long Điền',            value:'Long Hải' },
  { label:'Xã Long Điền — Long Điền',           value:'Long Điền' },
  { label:'Xã Phước Hải — Đất Đỏ',             value:'Phước Hải' },
  { label:'Xã Đất Đỏ — Đất Đỏ',                value:'Đất Đỏ' },
  { label:'Xã Nghĩa Thành — Châu Đức',          value:'Nghĩa Thành' },
  { label:'Xã Ngãi Giao — Châu Đức',            value:'Ngãi Giao' },
  { label:'Xã Kim Long — Châu Đức',             value:'Kim Long' },
  { label:'Xã Châu Đức — Châu Đức',             value:'Châu Đức' },
  { label:'Xã Bình Giã — Châu Đức',             value:'Bình Giã' },
  { label:'Xã Xuân Sơn — Châu Đức',             value:'Xuân Sơn' },
  { label:'Xã Hồ Tràm — Xuyên Mộc',            value:'Hồ Tràm' },
  { label:'Xã Xuyên Mộc — Xuyên Mộc',          value:'Xuyên Mộc' },
  { label:'Xã Hòa Hội — Xuyên Mộc',            value:'Hòa Hội' },
  { label:'Xã Bàu Lâm — Xuyên Mộc',            value:'Bàu Lâm' },
  { label:'Đặc Khu Côn Đảo',                   value:'Côn Đảo' },
  { label:'Xã Bình Châu — Xuyên Mộc',           value:'Bình Châu' },
  { label:'Xã Hòa Hiệp — Xuyên Mộc',           value:'Hòa Hiệp' },
  { label:'Xã Long Sơn — Vũng Tàu',            value:'Long Sơn' }
];

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

    // Địa bàn picker
    diaBanSearch:  '',   // bộ lọc tìm phường

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
      this.diaBanSearch = '';
      this.showModal = true;
      this._clearMsg();
    },

    moModalSua(nv) {
      this.form    = { ...nv };
      this.isEdit  = true;
      this.diaBanSearch = '';
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
    // ── Địa bàn picker helpers ────────────────────────────────────────────────
    // diaBan lưu dưới dạng các value (tên phường) cách nhau bằng dấu phẩy
    diaBanArr() {
      return (this.form.diaBan || '').split(',').map(s => s.trim()).filter(Boolean);
    },
    // Trả về mảng { label, value } đã lọc theo từ khoá tìm kiếm
    diaBanFiltered() {
      const q = this.diaBanSearch.toLowerCase().trim();
      return q ? PHUONG_TPHCM.filter(p => p.label.toLowerCase().includes(q)) : PHUONG_TPHCM;
    },
    // p là { label, value } từ PHUONG_TPHCM
    isDiaBanSelected(p) { return this.diaBanArr().includes(p.value); },
    toggleDiaBan(p) {
      // Hỗ trợ cả object { label, value } lẫn chuỗi tay (từ manual input)
      const val = (p && typeof p === 'object') ? p.value : String(p);
      const arr = this.diaBanArr();
      const idx = arr.indexOf(val);
      if (idx === -1) arr.push(val); else arr.splice(idx, 1);
      this.form.diaBan = arr.join(', ');
    },
    removeDiaBan(val) {
      this.form.diaBan = this.diaBanArr().filter(s => s !== val).join(', ');
    },

    _clearMsg() { this.errorMsg = ''; this.successMsg = ''; }
  };
}

function _emptyForm() {
  return {
    maNV: '', hoTen: '', donVi: '', khoi: 'Gián tiếp',
    chucDanh: '', dieuKienCV: 'Bình thường',
    ngayVaoLam: '', quanLyTrucTiep: '',
    trangThai: 'Đang làm', email: '', vaiTro: 'NV', diaBan: ''
  };
}
