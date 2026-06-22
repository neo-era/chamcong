// ─── bienban.js ───────────────────────────────────────────────────────────────
// Trang bien-ban-ky-luat.html (NC-J). Lấy maNV từ URL → biên bản để in.

const MUC_DIEU = {
  'Khiển trách':         'Khiển trách (Điều 33 NQLĐ)',
  'Kéo dài nâng lương':  'Kéo dài thời hạn nâng lương ≤ 6 tháng (Điều 34 NQLĐ)',
  'Sa thải':             'Sa thải (Điều 35 NQLĐ)'
};

function _fnB(s) { if (!s) return '…'; const p = String(s).substring(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function _escB(s) { const d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }

async function initBienBan() {
  if (!requireLogin('index.html')) return;
  const box = document.getElementById('bb-content');
  const maNV = new URLSearchParams(location.search).get('maNV');
  if (!maNV) { box.innerHTML = '<p>Thiếu mã nhân viên.</p>'; return; }
  try {
    const r = await Api.getChiTietViPham({ maNV: maNV });
    renderBienBan(r.data);
  } catch (e) { box.innerHTML = '<p style="color:#c00">Lỗi: ' + _escB(e.message) + '</p>'; }
}

function renderBienBan(d) {
  const rows = (d.viPham || []).map((v, i) =>
    '<tr><td style="text-align:center">' + (i + 1) + '</td><td>' + _fnB(v.ngay) + '</td><td>' + _escB(v.label) + '</td></tr>'
  ).join('') || '<tr><td colspan="3" style="text-align:center;color:#666">Không có ngày bỏ việc trong kỳ</td></tr>';

  const mucDe = MUC_DIEU[d.mucCanhBao] || d.mucCanhBao;

  document.getElementById('bb-content').innerHTML =
    '<div class="header2">' +
      '<div class="org"><div>' + _escB(d.donVi1) + '</div><div class="b">' + _escB(d.donVi2) + '</div></div>' +
      '<div class="quoc"><div class="b">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="u">Độc lập - Tự do - Hạnh phúc</div></div>' +
    '</div>' +
    '<h1>BIÊN BẢN XEM XÉT XỬ LÝ KỶ LUẬT LAO ĐỘNG</h1>' +
    '<p class="cam">(Về hành vi tự ý bỏ việc không có lý do chính đáng — Điều 28, 33–35 Nội quy lao động)</p>' +
    '<table class="info">' +
      '<tr><td class="lbl">Họ và tên:</td><td>' + _escB(d.hoTen) + '</td><td class="lbl">Mã NV:</td><td>' + _escB(d.maNV) + '</td></tr>' +
      '<tr><td class="lbl">Đơn vị:</td><td>' + _escB(d.donVi) + '</td><td class="lbl">Chức danh:</td><td>' + _escB(d.chucDanh || '') + '</td></tr>' +
      '<tr><td class="lbl">Kỳ xét:</td><td colspan="3">' + _fnB(d.tuNgay) + ' đến ' + _fnB(d.denNgay) + '</td></tr>' +
    '</table>' +
    '<p><b>Số ngày bỏ việc:</b> ' + d.soNgayBoViec30 + ' ngày / 30 ngày · ' + d.soNgayBoViec365 + ' ngày / 365 ngày.</p>' +
    '<p><b>Mức đề nghị xử lý:</b> ' + _escB(mucDe) + '</p>' +
    '<p style="margin-top:.4rem;font-weight:700;">Chi tiết các ngày bỏ việc:</p>' +
    '<table class="info" style="border-collapse:collapse;width:100%;">' +
      '<thead><tr><th style="border:1px solid #999;width:40px;">STT</th><th style="border:1px solid #999;">Ngày</th><th style="border:1px solid #999;">Tình trạng</th></tr></thead>' +
      '<tbody>' + rows.replace(/<td/g, '<td style="border:1px solid #999;padding:3px 6px"') + '</tbody>' +
    '</table>' +
    '<p class="cam" style="margin-top:.8rem;">Biên bản đã được đọc lại cho người lao động cùng nghe và xác nhận. Hệ thống chỉ cảnh báo — quyết định kỷ luật do người có thẩm quyền ban hành theo trình tự luật định.</p>' +
    '<div class="ngay">TP. Hồ Chí Minh, ngày … tháng … năm ' + (new Date().getFullYear()) + '</div>' +
    '<div class="sigs">' +
      '<div class="sig"><div class="sig-role">Người lao động</div><div class="sig-note">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div></div>' +
      '<div class="sig"><div class="sig-role">Người lập biên bản</div><div class="sig-note">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div></div>' +
      '<div class="sig"><div class="sig-role">Trưởng đơn vị</div><div class="sig-note">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div></div>' +
    '</div>';
}

document.addEventListener('DOMContentLoaded', initBienBan);
