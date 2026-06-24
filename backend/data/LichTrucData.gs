// ─── LichTrucData.gs ──────────────────────────────────────────────────────────

const LT_SHEET   = 'LichTruc';
const LT_HEADERS = ['maLT','maNV','ngay','maCa'];

function getLichTrucNgay(maNV, ngayStr) {
  const sh = getOrCreateSheet(LT_SHEET, LT_HEADERS);
  const list = sheetToObjects(sh);
  return list.find(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr) || null;
}

// Tất cả ca được phân cho 1 NV trong 1 ngày (đa ca). Trả về mảng bản ghi LichTruc.
function getLichTrucNgayList(maNV, ngayStr) {
  const sh = getOrCreateSheet(LT_SHEET, LT_HEADERS);
  return sheetToObjects(sh).filter(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr);
}

// Lịch trực của 1 NV trong 1 tuần (mảng ngày liên tiếp)
function getLichTrucTuan(maNV, tuanBatDau, tuanKetThuc) {
  const sh = getOrCreateSheet(LT_SHEET, LT_HEADERS);
  const list = sheetToObjects(sh);
  return list.filter(o => {
    if (o.maNV !== maNV) return false;
    const ngay = toDateStr(o.ngay);
    return ngay >= tuanBatDau && ngay <= tuanKetThuc;
  });
}

// Lịch trực của 1 đơn vị/tổ trong khoảng ngày
function getLichTrucDonVi(maNVList, tuBatDau, tuKetThuc) {
  const sh = getOrCreateSheet(LT_SHEET, LT_HEADERS);
  const list = sheetToObjects(sh);
  return list.filter(o => {
    if (!maNVList.includes(o.maNV)) return false;
    const ngay = toDateStr(o.ngay);
    return ngay >= tuBatDau && ngay <= tuKetThuc;
  });
}

// Gán ca cho 1 NV trong 1 ngày (ghi đè nếu đã có)
function setLichTruc(maNV, ngayStr, maCa) {
  const sh = getOrCreateSheet(LT_SHEET, LT_HEADERS);
  const list = sheetToObjects(sh);
  const idx = list.findIndex(o => o.maNV === maNV && toDateStr(o.ngay) === ngayStr);

  if (idx >= 0) {
    // Hàng trong sheet = idx + 2 (1 header + 0-based)
    const found = findRow(sh, 'maLT', list[idx].maLT);
    if (found) {
      found.obj.maCa = maCa;
      updateRow(sh, found.row, found.obj, LT_HEADERS);
      return;
    }
  }
  const maLT = 'LT_' + maNV + '_' + ngayStr.replace(/-/g, '');
  appendRow(sh, { maLT, maNV, ngay: ngayStr, maCa }, LT_HEADERS);
}

// Xoá lịch trực của 1 NV trong 1 ngày
function deleteLichTruc(maNV, ngayStr) {
  const sh = getSheet(LT_SHEET);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const nvIdx  = headers.indexOf('maNV');
  const ngayIdx = headers.indexOf('ngay');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][nvIdx]) === maNV && toDateStr(data[i][ngayIdx]) === ngayStr) {
      sh.deleteRow(i + 1);
      return;
    }
  }
}
