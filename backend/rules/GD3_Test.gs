// ─── GD3_Test.gs ──────────────────────────────────────────────────────────────
// Test thuần PhepRules + BangCongRules. Chạy trong Editor: chọn chayTest_GD3 → Run.

function chayTest_GD3() {
  let pass = 0, fail = 0;
  function eq(ten, a, e) {
    const x = JSON.stringify(a), y = JSON.stringify(e);
    if (x === y) { pass++; Logger.log('PASS · ' + ten); }
    else { fail++; Logger.log('FAIL · ' + ten + ' → ' + x + ' (kỳ vọng ' + y + ')'); }
  }
  const base = { 'Bình thường': 12, 'Nặng nhọc': 14, 'Đặc biệt nặng nhọc': 16 };

  // PhepRules.tinhQuota
  eq('Quota 16 năm TN → 15',  tinhQuota('Bình thường', '2010-01-01', 2026, base), 15);
  eq('Nặng nhọc đủ năm → 14', tinhQuota('Nặng nhọc', '2024-07-01', 2026, base), 14);
  eq('Vào 04/2026 → 9',       tinhQuota('Bình thường', '2026-04-01', 2026, base), 9);
  eq('Vào sau năm → 0',       tinhQuota('Bình thường', '2027-01-01', 2026, base), 0);
  eq('kiemTraDuPhep(2,3)',    kiemTraDuPhep(2, 3), { du: false, thieu: 1 });
  eq('kiemTraDuPhep(5,3)',    kiemTraDuPhep(5, 3), { du: true, thieu: 0 });

  // BangCongRules.khoangKyCong
  eq('Kỳ 2026-05 (cắt 21)', khoangKyCong('2026-05', 21), { tuNgay: '2026-04-21', denNgay: '2026-05-20' });
  eq('Kỳ 2026-01 (cắt 21)', khoangKyCong('2026-01', 21), { tuNgay: '2025-12-21', denNgay: '2026-01-20' });

  // BangCongRules.maNgay
  const caNgay = { banDem: false }, caDem = { banDem: true };
  eq('DU_CONG ca ngày → N', maNgay({ trangThai: 'DU_CONG' }, caNgay, null, '2026-05-04', {}), 'N');
  eq('DU_CONG ca đêm → D',  maNgay({ trangThai: 'DU_CONG' }, caDem, null, '2026-05-04', {}), 'D');
  eq('TRE → 0 (bỏ việc)',   maNgay({ trangThai: 'TRE' }, caNgay, null, '2026-05-04', {}), '0');
  eq('Đơn phép → P',        maNgay(null, null, { loaiDon: 'Phép năm' }, '2026-05-04', {}), 'P');
  eq('Đơn ốm → Ô',          maNgay(null, null, { loaiDon: 'Ốm đau' }, '2026-05-04', {}), 'Ô');
  eq('Không có gì + lễ → L', maNgay(null, null, null, '2026-04-30', { '2026-04-30': true }), 'L');
  eq('Không có gì → trống',  maNgay(null, null, null, '2026-05-04', {}), '');

  // BangCongRules.tongHopNV
  eq('Tổng hợp đếm mã', tongHopNV(['N', 'N', 'D', 'P', '0', 'Ô']),
     { congNgay: 2, congDem: 1, nghiP: 1, nghiR: 0, nghiOm: 1, nghiTS: 0, nghiKL: 0, nghiL: 0, boViec: 1, tongCong: 3 });

  Logger.log('──────────────────────────────');
  Logger.log('KẾT QUẢ GĐ3: ' + pass + ' PASS / ' + fail + ' FAIL');
}
