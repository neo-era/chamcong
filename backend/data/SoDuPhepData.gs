// ─── SoDuPhepData.gs ──────────────────────────────────────────────────────────
// Truy cập sheet SoDuPhep (PK kép: maNV + nam).

const SDP_SHEET   = 'SoDuPhep';
const SDP_HEADERS = ['maNV','nam','quota','daDung','conLai'];

function getSoDu(maNV, nam) {
  const sh = getOrCreateSheet(SDP_SHEET, SDP_HEADERS);
  return sheetToObjects(sh).find(o =>
    o.maNV === maNV && Number(o.nam) === Number(nam)) || null;
}

// Ghi đè hoặc tạo mới bản ghi số dư.
function upsertSoDu(maNV, nam, vals) {
  const sh = getOrCreateSheet(SDP_SHEET, SDP_HEADERS);
  const data = sh.getDataRange().getValues();
  const obj = {
    maNV, nam,
    quota:  Number(vals.quota)  || 0,
    daDung: Number(vals.daDung) || 0,
    conLai: vals.conLai != null ? Number(vals.conLai) : (Number(vals.quota) || 0) - (Number(vals.daDung) || 0)
  };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(maNV) && Number(data[i][1]) === Number(nam)) {
      updateRow(sh, i + 1, obj, SDP_HEADERS);
      return obj;
    }
  }
  appendRow(sh, obj, SDP_HEADERS);
  return obj;
}

// Trừ phép khi đơn phép năm được duyệt cuối. Ném lỗi nếu vượt số dư.
function truPhep(maNV, nam, soNgay) {
  const sd = getSoDu(maNV, nam);
  if (!sd) throw new Error('Chưa có số dư phép năm ' + nam + ' cho ' + maNV + ' — chạy tính quota đầu năm trước');
  const daDung = Number(sd.daDung) + Number(soNgay);
  const conLai = Number(sd.quota) - daDung;
  if (conLai < 0) {
    throw new Error('Vượt số dư phép: còn ' + (Number(sd.quota) - Number(sd.daDung)) + ' ngày, xin ' + soNgay + ' ngày');
  }
  return upsertSoDu(maNV, nam, { quota: Number(sd.quota), daDung, conLai });
}

// Hoàn lại phép khi đơn bị huỷ/thu hồi sau duyệt.
function hoanPhep(maNV, nam, soNgay) {
  const sd = getSoDu(maNV, nam);
  if (!sd) return null;
  const daDung = Math.max(0, Number(sd.daDung) - Number(soNgay));
  return upsertSoDu(maNV, nam, { quota: Number(sd.quota), daDung, conLai: Number(sd.quota) - daDung });
}
