// ─── CaData.gs ────────────────────────────────────────────────────────────────

const CA_SHEET   = 'Ca';
const CA_HEADERS = ['maCa','tenCa','gioBatDau','gioKetThuc','banDem'];

function getCaByMa(maCa) {
  const sh = getSheet(CA_SHEET);
  const found = findRow(sh, 'maCa', maCa);
  return found ? found.obj : null;
}

function listCa() {
  const sh = getSheet(CA_SHEET);
  return sheetToObjects(sh);
}

function createCa(ca) {
  if (!ca.maCa) throw new Error('maCa là bắt buộc');
  if (getCaByMa(ca.maCa)) throw new Error('maCa đã tồn tại: ' + ca.maCa);
  ca.banDem = ca.banDem === true || ca.banDem === 'true' || ca.banDem === 1;
  const sh = getOrCreateSheet(CA_SHEET, CA_HEADERS);
  appendRow(sh, ca, CA_HEADERS);
}

function updateCa(maCa, updates) {
  const sh = getSheet(CA_SHEET);
  const found = findRow(sh, 'maCa', maCa);
  if (!found) throw new Error('Không tìm thấy ca: ' + maCa);
  delete updates.maCa;
  if (updates.banDem !== undefined) {
    updates.banDem = updates.banDem === true || updates.banDem === 'true' || updates.banDem === 1;
  }
  Object.assign(found.obj, updates);
  updateRow(sh, found.row, found.obj, CA_HEADERS);
}

// Lấy ca mặc định (khối gián tiếp / khi chưa phân ca)
function getCaMacDinh() {
  const maCaMacDinh = getConfig('ma_ca_mac_dinh') || 'CA_HC';
  return getCaByMa(maCaMacDinh);
}
