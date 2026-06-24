// ─── GeoRules.gs ──────────────────────────────────────────────────────────────
// Kiểm tra một địa chỉ (từ reverse geocoding) có nằm trong địa bàn làm việc không.
// THUẦN — không truy cập Sheets / mạng. Nhận address object + cấu hình, trả kết quả.

// Bỏ dấu tiếng Việt + đ→d
function _khongDau(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Chuẩn hoá 1 thành phần địa chỉ: bỏ dấu, thường hoá, gỡ tiền tố hành chính.
function _chuanHoaDiaChi(s) {
  return _khongDau(s).toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(quan|phuong|huyen|thi xa|thi tran|thanh pho|tp|tinh|xa|phuong xa|district|ward|q|p)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Kiểm tra address (Nominatim) có thuộc địa bàn cho phép không.
 * @param {object} addr - address object (road, suburb, city_district, county, town, state, display_name…)
 * @param {object} cfg  - { quan:[...], khuVuc:[...], loaiTru:[...] }
 * @returns {{trongDiaBan:boolean, khop?:string, lyDo?:string}}
 */
function kiemTraDiaBan(addr, cfg) {
  if (!cfg || (!(cfg.quan || []).length && !(cfg.khuVuc || []).length)) {
    return { trongDiaBan: true, khop: '(không cấu hình địa bàn)' };
  }
  addr = addr || {};

  const capQuan = ['city_district', 'district', 'county', 'suburb', 'quarter', 'town', 'municipality'];
  const moiTruong = ['road', 'pedestrian', 'suburb', 'quarter', 'neighbourhood', 'hamlet', 'village',
                     'city_district', 'district', 'county', 'town', 'municipality', 'city', 'state', 'display_name'];

  const valsAll  = moiTruong.map(f => _chuanHoaDiaChi(addr[f])).filter(Boolean);
  const valsQuan = capQuan.map(f => _chuanHoaDiaChi(addr[f])).filter(Boolean);

  // 1) Loại trừ trước (vd Văn Thố, Bàu Bàng)
  for (const ex of (cfg.loaiTru || [])) {
    const ne = _chuanHoaDiaChi(ex);
    if (ne && valsAll.some(v => v.indexOf(ne) !== -1)) {
      return { trongDiaBan: false, lyDo: 'Thuộc khu vực loại trừ: ' + ex };
    }
  }

  // 2) Quận (số → khớp token riêng ở cấp quận; tên → khớp chứa chuỗi)
  for (const q of (cfg.quan || [])) {
    const nq = _chuanHoaDiaChi(q);
    if (!nq) continue;
    if (/^\d+$/.test(nq)) {
      if (valsQuan.some(v => v.split(' ').indexOf(nq) !== -1)) {
        return { trongDiaBan: true, khop: 'Quận ' + q };
      }
    } else if (valsAll.some(v => v.indexOf(nq) !== -1)) {
      return { trongDiaBan: true, khop: q };
    }
  }

  // 3) Khu vực khác (vd Bến Cát)
  for (const k of (cfg.khuVuc || [])) {
    const nk = _chuanHoaDiaChi(k);
    if (nk && valsAll.some(v => v.indexOf(nk) !== -1)) {
      return { trongDiaBan: true, khop: k };
    }
  }

  return { trongDiaBan: false, lyDo: 'Không thuộc địa bàn cho phép' };
}
