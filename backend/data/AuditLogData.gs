// ─── AuditLogData.gs ──────────────────────────────────────────────────────────
// Ghi nhật ký mọi thao tác quan trọng (sửa chấm công, mở khóa, duyệt đơn…).
// BẮT BUỘC gọi sau mỗi thao tác ghi/sửa dữ liệu.

const AL_HEADERS = ['maLog','thoiDiem','maNV','email','action','doiTuong','chiTiet'];

function appendLog(maNV, email, action, doiTuong, chiTiet) {
  const sh = getOrCreateSheet('AuditLog', AL_HEADERS);
  const maLog = 'LOG_' + new Date().getTime();
  const thoiDiem = new Date();
  appendRow(sh, {
    maLog,
    thoiDiem: thoiDiem.toISOString(),
    maNV: maNV || '',
    email: email || '',
    action,
    doiTuong: doiTuong || '',
    chiTiet: typeof chiTiet === 'object' ? JSON.stringify(chiTiet) : String(chiTiet || '')
  }, AL_HEADERS);
}
