// ─── ThongBaoData.gs ──────────────────────────────────────────────────────────
// Thông báo trong app (NC-E). Sheet ThongBao.

const TB_SHEET   = 'ThongBao';
const TB_HEADERS = ['maTB','maNV','noiDung','link','daDoc','thoiDiem'];

function themThongBao(maNV, noiDung, link) {
  if (!maNV) return;
  const sh = getOrCreateSheet(TB_SHEET, TB_HEADERS);
  appendRow(sh, {
    maTB:    'TB_' + maNV + '_' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd_HHmmss') + '_' + Math.floor(Math.random() * 1000),
    maNV:    maNV,
    noiDung: noiDung,
    link:    link || '',
    daDoc:   '',
    thoiDiem: toIsoVN(new Date())
  }, TB_HEADERS);
}

// Danh sách thông báo của 1 NV (mới nhất trước), giới hạn n
function listThongBao(maNV, n) {
  const sh = getOrCreateSheet(TB_SHEET, TB_HEADERS);
  const ds = sheetToObjects(sh).filter(o => o.maNV === maNV)
    .sort((a, b) => tsMs(b.thoiDiem) - tsMs(a.thoiDiem));
  return n ? ds.slice(0, n) : ds;
}

function demChuaDoc(maNV) {
  return listThongBao(maNV).filter(o => !o.daDoc).length;
}

// Đánh dấu đã đọc: 1 maTB cụ thể hoặc tất cả của maNV
function danhDauDaDoc(maNV, maTB) {
  const sh = getOrCreateSheet(TB_SHEET, TB_HEADERS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const iTB = headers.indexOf('maTB'), iNV = headers.indexOf('maNV'), iDoc = headers.indexOf('daDoc');
  for (let i = 1; i < data.length; i++) {
    if (data[i][iNV] === maNV && (!maTB || data[i][iTB] === maTB) && !data[i][iDoc]) {
      sh.getRange(i + 1, iDoc + 1).setValue('TRUE');
    }
  }
}
