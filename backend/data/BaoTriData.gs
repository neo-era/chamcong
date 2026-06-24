// ─── BaoTriData.gs ────────────────────────────────────────────────────────────
// Tác vụ vận hành/bảo trì: sao lưu spreadsheet tự động + lưu trữ (archive) ChamCong cũ.
// Các hàm này CHẠY TỪ TRÌNH SOẠN APPS SCRIPT (hoặc trigger), KHÔNG mở ra web.

const BACKUP_FOLDER = 'CSCC_ChamCong_Backup';   // thư mục Drive chứa bản sao lưu
const BACKUP_KEEP   = 12;                        // số bản sao lưu giữ lại (12 tuần ~ 3 tháng)

// ── SAO LƯU ───────────────────────────────────────────────────────────────────

// Tạo 1 bản sao toàn bộ spreadsheet vào thư mục backup, dọn bớt bản cũ.
// Gọi tự động qua trigger hằng tuần (xem installBackupTrigger) hoặc chạy tay khi cần.
function backupSpreadsheet() {
  const folder = _getBackupFolder();
  const file   = DriveApp.getFileById(SPREADSHEET_ID);
  const stamp  = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd_HHmm');
  const copy   = file.makeCopy('CSCC_ChamCong_' + stamp, folder);
  _pruneBackups(folder);
  try { appendLog('SYSTEM', '', 'BACKUP', 'Spreadsheet', { file: copy.getId(), ten: copy.getName() }); } catch (_) {}
  return copy.getUrl();
}

function _getBackupFolder() {
  const it = DriveApp.getFoldersByName(BACKUP_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP_FOLDER);
}

function _pruneBackups(folder) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
  for (let i = BACKUP_KEEP; i < files.length; i++) files[i].setTrashed(true);
}

// Cài trigger sao lưu hằng tuần (Chủ nhật ~02:00). Chạy 1 lần từ trình soạn.
function installBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'backupSpreadsheet') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('backupSpreadsheet')
    .timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();
  Logger.log('Đã cài trigger sao lưu hằng tuần (Chủ nhật ~02:00).');
}

function removeBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'backupSpreadsheet') ScriptApp.deleteTrigger(t);
  });
  Logger.log('Đã gỡ trigger sao lưu.');
}

// ── LƯU TRỮ (ARCHIVE) CHAMCONG CŨ ─────────────────────────────────────────────

// Chuyển các bản ghi ChamCong có ngày < cutoff sang spreadsheet lưu trữ riêng,
// giữ sheet "nóng" gọn để chấm công luôn nhanh. CHẠY TAY cuối năm.
//   archiveChamCongTruoc('2026-01-01')  → archive toàn bộ trước năm 2026
// An toàn: tự sao lưu trước khi ghi đè; ghi AuditLog.
function archiveChamCongTruoc(cutoffYmd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(cutoffYmd || ''))) {
    throw new Error("Tham số cutoff phải dạng 'yyyy-MM-dd', vd archiveChamCongTruoc('2026-01-01')");
  }
  backupSpreadsheet();   // an toàn: sao lưu trước thao tác xoá/ghi đè

  const sh = ccSheet();
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const iNgay = headers.indexOf('ngay');
  if (iNgay === -1) throw new Error('Sheet ChamCong thiếu cột ngay');

  const keep = [headers], move = [];
  for (let i = 1; i < data.length; i++) {
    const ngay = toDateStr(data[i][iNgay]);
    if (ngay && ngay < cutoffYmd) move.push(data[i]); else keep.push(data[i]);
  }
  if (!move.length) { Logger.log('Không có bản ghi nào trước ' + cutoffYmd); return { soArchive: 0 }; }

  // Ghi vào spreadsheet lưu trữ (sheet "ChamCong")
  const arSS = _getArchiveSpreadsheet();
  let arSh = arSS.getSheetByName('ChamCong');
  if (!arSh) {
    arSh = arSS.insertSheet('ChamCong');
    arSh.getRange(1, 1, 1, headers.length).setValues([headers]);
    arSh.setFrozenRows(1);
  }
  arSh.getRange(arSh.getLastRow() + 1, 1, move.length, headers.length).setValues(move);

  // Ghi lại sheet chính chỉ với phần giữ lại
  sh.clearContents();
  sh.getRange(1, 1, keep.length, headers.length).setValues(keep);

  appendLog('SYSTEM', '', 'ARCHIVE_CHAMCONG', 'ChamCong',
    { cutoff: cutoffYmd, soArchive: move.length, archiveFile: arSS.getId() });
  Logger.log('Đã lưu trữ ' + move.length + ' bản ghi (< ' + cutoffYmd + ') vào: ' + arSS.getUrl());
  return { soArchive: move.length, archiveUrl: arSS.getUrl() };
}

// Spreadsheet lưu trữ dùng lại qua Script Property ARCHIVE_SS_ID (đặt trong thư mục backup).
function _getArchiveSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('ARCHIVE_SS_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (_) { /* tạo mới bên dưới */ } }
  const ss = SpreadsheetApp.create('CSCC_ChamCong_LuuTru');
  // chuyển file vào thư mục backup cho gọn
  try { DriveApp.getFileById(ss.getId()).moveTo(_getBackupFolder()); } catch (_) {}
  props.setProperty('ARCHIVE_SS_ID', ss.getId());
  return ss;
}
