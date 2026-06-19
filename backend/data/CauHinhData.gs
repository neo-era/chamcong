// ─── CauHinhData.gs ───────────────────────────────────────────────────────────
// Đọc tham số từ sheet CauHinh. KHÔNG hardcode hằng số pháp lý.

function getConfig(key) {
  const sh = getSheet('CauHinh');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) return String(data[i][1]);
  }
  return null;
}

function getConfigNumber(key, fallback) {
  const v = getConfig(key);
  return v !== null ? parseFloat(v) : fallback;
}

// Trả về object toàn bộ config (dùng cho admin xem)
function getAllConfig() {
  const sh = getSheet('CauHinh');
  return sheetToObjects(sh);
}

// Cập nhật 1 key (Admin only — quyền kiểm tra ở api layer)
function setConfig(key, value, moTa) {
  const sh = getSheet('CauHinh');
  const found = findRow(sh, 'key', key);
  if (found) {
    found.obj.value = value;
    if (moTa) found.obj.moTa = moTa;
    updateRow(sh, found.row, found.obj, ['key','value','moTa']);
  } else {
    appendRow(sh, { key, value, moTa: moTa || '' }, ['key','value','moTa']);
  }
}
