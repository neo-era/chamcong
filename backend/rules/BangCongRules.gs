// ─── BangCongRules.gs ─────────────────────────────────────────────────────────
// Logic THUẦN cho bảng công tháng (docs/06-bang-cong-template.md). KHÔNG truy cập Sheets.

const THU_VN = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];

/**
 * Khoảng ngày của kỳ công. Kỳ `thang` = từ ngày `ngayCat` tháng trước → (ngayCat-1) tháng này.
 * @param {string} thang 'yyyy-MM'
 * @param {number} ngayCat  mặc định 21
 * @returns {{tuNgay:string, denNgay:string}}  'yyyy-MM-dd'
 */
function khoangKyCong(thang, ngayCat) {
  const parts = String(thang).split('-');
  const y = Number(parts[0]), m = Number(parts[1]);   // m: 1-12
  const cat = Number(ngayCat) || 21;
  const tu  = new Date(y, m - 2, cat);                 // ngày cat tháng trước
  const den = new Date(y, m - 1, cat - 1);             // ngày (cat-1) tháng này
  return { tuNgay: _bcIso(tu), denNgay: _bcIso(den) };
}

// Liệt kê các ngày trong kỳ kèm thứ.
function lietKeNgay(tuNgay, denNgay) {
  const out = [];
  const d = new Date(tuNgay + 'T00:00:00');
  const end = new Date(denNgay + 'T00:00:00');
  while (d <= end) {
    out.push({ ngay: _bcIso(d), thu: THU_VN[d.getDay()], dow: d.getDay() });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Mã ký hiệu của một ô ngày. Ưu tiên: đơn nghỉ đã duyệt → chấm công → lịch (lễ/nghỉ tuần).
 * @param {object|null} cc   bản ghi ChamCong của ngày
 * @param {object|null} ca   ca tương ứng (để phân biệt công đêm)
 * @param {object|null} don  đơn ĐÃ DUYỆT phủ ngày đó (nếu có)
 * @param {string} ngayStr   'yyyy-MM-dd'
 * @param {object} ngayLeSet { 'yyyy-MM-dd': true }
 * @returns {string} N/D/P/R/Ô/TS/KL/L/0/'' (xem docs/06)
 */
function maNgay(cc, ca, don, ngayStr, ngayLeSet) {
  if (don) {
    switch (don.loaiDon) {
      case 'Phép năm':    return 'P';
      case 'Việc riêng':  return 'R';
      case 'Ốm đau':
      case 'Chăm con ốm': return 'Ô';
      case 'Thai sản nữ':
      case 'Thai sản nam':
      case 'Khám thai':   return 'TS';
      case 'Không lương': return 'KL';
      // Công tác / Ra ngoài / OT: vẫn đi làm → rơi xuống xét chấm công
      default: break;
    }
  }
  if (cc && cc.trangThai) {
    if (cc.trangThai === 'DU_CONG') {
      const dem = ca && (ca.banDem === true || String(ca.banDem).toUpperCase() === 'TRUE');
      return dem ? 'D' : 'N';
    }
    if (cc.trangThai === 'VANG_PHEP') return 'P';
    return '0';   // TRE/SOM/MAT_CONG/VANG_KHONG_PHEP → bỏ việc, không công
  }
  if (ngayLeSet && ngayLeSet[ngayStr]) return 'L';
  return '';      // nghỉ tuần / không có dữ liệu
}

// Tổng hợp số đếm các mã trong kỳ của 1 NV.
function tongHopNV(maList) {
  const t = { congNgay:0, congDem:0, nghiP:0, nghiR:0, nghiOm:0, nghiTS:0, nghiKL:0, nghiL:0, boViec:0 };
  maList.forEach(function (m) {
    switch (m) {
      case 'N':  t.congNgay++; break;
      case 'D':  t.congDem++;  break;
      case 'P':  t.nghiP++;    break;
      case 'R':  t.nghiR++;    break;
      case 'Ô':  t.nghiOm++;   break;
      case 'TS': t.nghiTS++;   break;
      case 'KL': t.nghiKL++;   break;
      case 'L':  t.nghiL++;    break;
      case '0':  t.boViec++;   break;
    }
  });
  t.tongCong = t.congNgay + t.congDem;   // ngày công thực
  return t;
}

function _bcIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
