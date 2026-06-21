// ─── indon.js ─────────────────────────────────────────────────────────────────
// Trang in đơn (in-don.html). Lấy maDon từ URL, tải chi tiết, render tờ đơn để in/ký sống.

const DON_TITLE = {
  'Phép năm':     'ĐƠN XIN NGHỈ PHÉP',
  'Việc riêng':   'ĐƠN XIN NGHỈ VIỆC RIÊNG',
  'Không lương':  'ĐƠN XIN NGHỈ KHÔNG HƯỞNG LƯƠNG',
  'OT':           'ĐƠN ĐĂNG KÝ LÀM THÊM GIỜ',
  'Công tác':     'GIẤY ĐỀ NGHỊ ĐI CÔNG TÁC',
  'Ra ngoài':     'GIẤY XIN RA NGOÀI TRONG GIỜ',
  'Ốm đau':       'ĐƠN XIN NGHỈ ỐM',
  'Chăm con ốm':  'ĐƠN XIN NGHỈ CHĂM CON ỐM',
  'Thai sản nữ':  'ĐƠN XIN NGHỈ THAI SẢN',
  'Thai sản nam': 'ĐƠN XIN NGHỈ (VỢ SINH CON)',
  'TNLĐ-BNN':     'ĐƠN ĐỀ NGHỊ CHẾ ĐỘ TNLĐ - BNN',
  'Khám thai':    'ĐƠN XIN NGHỈ KHÁM THAI'
};
const CAP_TEN = { 1: 'Tổ trưởng', 2: 'Trưởng đơn vị', 3: 'Giám đốc' };

function _fn(s) { if (!s) return '…'; const p = String(s).substring(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function _esc(s) { const d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }

async function initInDon() {
  if (!requireLogin('index.html')) return;
  const box = document.getElementById('don-content');
  const maDon = new URLSearchParams(location.search).get('maDon');
  if (!maDon) { box.innerHTML = '<p>Thiếu mã đơn.</p>'; return; }
  try {
    const r = await Api.getDonChiTiet(maDon);
    renderDon(r.data);
  } catch (e) { box.innerHTML = '<p style="color:#c00">Lỗi: ' + _esc(e.message) + '</p>'; }
}

function renderDon(d) {
  const tieuDe = DON_TITLE[d.loaiDon] || ('ĐƠN ĐỀ NGHỊ — ' + d.loaiDon);
  const daDuyet = (d.buoc || []).filter(b => b.ketQua === 'Duyệt');

  const kyDuyet = daDuyet.map(b =>
    '<div class="sig">' +
      '<div class="sig-role">' + (CAP_TEN[b.capDuyet] || ('Cấp ' + b.capDuyet)) + '</div>' +
      '<div class="sig-note">(Đã duyệt ' + _fn(b.thoiDiem) + ')</div>' +
      '<div class="sig-space"></div>' +
      '<div class="sig-name">' + _esc(b.nguoiDuyetTen || b.nguoiDuyet || '') + '</div>' +
    '</div>'
  ).join('');

  const kyNguoiLam =
    '<div class="sig">' +
      '<div class="sig-role">Người làm đơn</div>' +
      '<div class="sig-note">(Ký, ghi rõ họ tên)</div>' +
      '<div class="sig-space"></div>' +
      '<div class="sig-name">' + _esc(d.hoTenNV || '') + '</div>' +
    '</div>';

  document.getElementById('don-content').innerHTML =
    '<div class="header2">' +
      '<div class="org"><div>' + _esc(d.donVi1) + '</div><div class="b">' + _esc(d.donVi2) + '</div></div>' +
      '<div class="quoc"><div class="b">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>' +
        '<div class="u">Độc lập - Tự do - Hạnh phúc</div></div>' +
    '</div>' +
    '<h1>' + tieuDe + '</h1>' +
    '<p class="kg">Kính gửi: Ban Giám đốc ' + _esc(d.donVi2) + '</p>' +
    '<table class="info">' +
      '<tr><td class="lbl">Họ và tên:</td><td>' + _esc(d.hoTenNV) + '</td><td class="lbl">Mã NV:</td><td>' + _esc(d.maNV) + '</td></tr>' +
      '<tr><td class="lbl">Đơn vị:</td><td>' + _esc(d.donViNV) + '</td><td class="lbl">Chức danh:</td><td>' + _esc(d.chucDanhNV || '') + '</td></tr>' +
      '<tr><td class="lbl">Loại đơn:</td><td colspan="3">' + _esc(d.loaiDon) + ' — đơn vị tính: ' + _esc(d.donViTinh) + '</td></tr>' +
      '<tr><td class="lbl">Thời gian:</td><td colspan="3">Từ <b>' + _fn(d.tuNgay) + '</b> đến <b>' + _fn(d.denNgay) + '</b> &nbsp;(' + _esc(d.soNgay) + ' ngày)</td></tr>' +
      '<tr><td class="lbl">Lý do:</td><td colspan="3">' + _esc(d.lyDo) + '</td></tr>' +
    '</table>' +
    '<p class="cam">Kính đề nghị Quý lãnh đạo xem xét, chấp thuận. Tôi xin chân thành cảm ơn.</p>' +
    '<div class="ngay">TP. Hồ Chí Minh, ngày … tháng … năm ' + (new Date().getFullYear()) + '</div>' +
    '<div class="sigs">' + kyDuyet + kyNguoiLam + '</div>';
}

document.addEventListener('DOMContentLoaded', initInDon);
