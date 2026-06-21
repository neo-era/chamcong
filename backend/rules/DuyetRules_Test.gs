// ─── DuyetRules_Test.gs ───────────────────────────────────────────────────────
// Test thuần cho DuyetRules — chạy trong Apps Script Editor (chọn hàm
// chayTest_DuyetRules → Run → xem Execution log). KHÔNG cần Sheets.

function chayTest_DuyetRules() {
  let pass = 0, fail = 0;
  function eq(ten, thucTe, kyVong) {
    const a = JSON.stringify(thucTe), b = JSON.stringify(kyVong);
    if (a === b) { pass++; Logger.log('PASS · ' + ten); }
    else { fail++; Logger.log('FAIL · ' + ten + ' → ' + a + ' (kỳ vọng ' + b + ')'); }
  }

  // ── capDuyetYeuCau: BS2 — MỌI loại đơn đủ 3 cấp ──────────────────────────────
  const BA = ['DUYET_CAP1','DUYET_CAP2','DUYET_CAP3'];
  eq('Phép năm 1 ngày → 3 cấp',  capDuyetYeuCau('Phép năm', 1, 2), BA);
  eq('Phép năm 3 ngày → 3 cấp',  capDuyetYeuCau('Phép năm', 3, 2), BA);
  eq('Không lương → 3 cấp',      capDuyetYeuCau('Không lương', 1, 2), BA);
  eq('OT → 3 cấp',               capDuyetYeuCau('OT', 5, 2), BA);
  eq('Công tác → 3 cấp',         capDuyetYeuCau('Công tác', 1, 2), BA);
  eq('Ra ngoài → 3 cấp',         capDuyetYeuCau('Ra ngoài', 1, 2), BA);
  eq('Ốm đau → 3 cấp',           capDuyetYeuCau('Ốm đau', 1, 2), BA);

  // ── quyenChoCap ──────────────────────────────────────────────────────────────
  const yc = ['DUYET_CAP1','DUYET_CAP2','DUYET_CAP3'];
  eq('quyenChoCap cấp 1', quyenChoCap(yc, 1), 'DUYET_CAP1');
  eq('quyenChoCap cấp 3', quyenChoCap(yc, 3), 'DUYET_CAP3');
  eq('quyenChoCap vượt',  quyenChoCap(yc, 4), null);

  // ── tinhTrangThaiSauBuoc ─────────────────────────────────────────────────────
  eq('Duyệt cấp 1/2 → Chờ duyệt',  tinhTrangThaiSauBuoc(1, 2, 'Duyệt'), 'Chờ duyệt');
  eq('Duyệt cấp 2/2 → Đã duyệt',   tinhTrangThaiSauBuoc(2, 2, 'Duyệt'), 'Đã duyệt');
  eq('Duyệt cấp 3/3 → Đã duyệt',   tinhTrangThaiSauBuoc(3, 3, 'Duyệt'), 'Đã duyệt');
  eq('Từ chối → Từ chối',          tinhTrangThaiSauBuoc(1, 3, 'Từ chối'), 'Từ chối');
  eq('Yêu cầu bổ sung → Bổ sung',  tinhTrangThaiSauBuoc(2, 3, 'Yêu cầu bổ sung'), 'Bổ sung');

  // ── tinhSoNgay (T2 22/06/2026 .. T6 26/06/2026 đều là ngày thường) ───────────
  eq('5 ngày T2–T6',               tinhSoNgay('2026-06-22', '2026-06-26', 'Ngày', []), 5);
  eq('Loại T7/CN (22→28 → 5)',     tinhSoNgay('2026-06-22', '2026-06-28', 'Ngày', []), 5);
  eq('Loại 1 ngày lễ (23/06)',     tinhSoNgay('2026-06-22', '2026-06-26', 'Ngày', ['2026-06-23']), 4);
  eq('Nửa ngày → 0.5',             tinhSoNgay('2026-06-22', '2026-06-22', 'Nửa ngày', []), 0.5);
  eq('1 ngày T2',                  tinhSoNgay('2026-06-22', '2026-06-22', 'Ngày', []), 1);

  // ── nguonChiTraMacDinh ───────────────────────────────────────────────────────
  eq('Phép năm → Công ty',   nguonChiTraMacDinh('Phép năm'), 'Công ty');
  eq('Ốm đau → BHXH',        nguonChiTraMacDinh('Ốm đau'), 'BHXH');
  eq('Không lương → Không lương', nguonChiTraMacDinh('Không lương'), 'Không lương');

  Logger.log('──────────────────────────────');
  Logger.log('KẾT QUẢ: ' + pass + ' PASS / ' + fail + ' FAIL');
}
