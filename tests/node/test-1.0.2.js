// Test bản vá khẩn 1.0.2 — chạy: node tests/node/run.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createEnv } = require('./gas-mock');

const ROOT = path.join(__dirname, '..', '..');
// Các chuỗi bí mật/mật khẩu cũ đã lộ — chỉ lưu SHA-256 (không giữ nguyên văn hay mảnh ghép).
const HASH_CU = ["2db86ccda307d056171e02139043777b91103a88715a746e7523b653d481aae4", "1aa2747195905f6a87d42779682c1af98163c75075fd8a1365616910404fd960", "0246c3970100558ed013f7ad9b5c2d880e6f7341e9a21a507e99b8e47924bf58", "1b96ea7a30260d61179873743e8a8b9996f005c0fa839437bd54feb914b04502", "2e24f0e43e246ef684bd730acadd06e0d3433061625732d6dbe37c2d02cb585b"];
const sha = t => require('crypto').createHash('sha256').update(t).digest('hex');
const timChuoiCu = text => [...new Set(String(text).split(/[^A-Za-z0-9@._#!-]+/))].filter(w => w && HASH_CU.includes(sha(w)));
const tatCaFileVanBan = () => execSync('git -C "' + ROOT + '" ls-files').toString().trim().split('\n')
  .filter(f => f && !/\.(png|jpg|ico|docx|xlsx|min\.js)$/i.test(f) && fs.existsSync(path.join(ROOT, f)));
const SECRET = 'test-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
const NV_HEADERS = ['maNV', 'hoTen', 'donVi', 'khoi', 'chucDanh', 'dieuKienCV', 'ngayVaoLam', 'quanLyTrucTiep',
  'trangThai', 'email', 'vaiTro', 'matKhau', 'salt', 'phaiDoiMK', 'diaBan'];

function moiTruong(props) {
  const env = createEnv({ props: props === undefined ? { SESSION_SECRET: SECRET } : props });
  env.g.setupGD1();
  env.seedSheet('NhanVien', NV_HEADERS, [
    { maNV: 'AD1', hoTen: 'Quản trị', donVi: 'VP', khoi: 'Gián tiếp', trangThai: 'Đang làm', email: 'admin@x.vn', vaiTro: 'Admin', matKhau: 'MatKhauAdmin#1' },
    { maNV: 'TT1', hoTen: 'Tổ trưởng', donVi: 'Đội 1', khoi: 'Trực tiếp', trangThai: 'Đang làm', email: 'tt@x.vn', vaiTro: 'ToTruong', matKhau: 'MatKhauTT#1' },
    { maNV: 'NV1', hoTen: 'Nhân viên', donVi: 'Đội 1', khoi: 'Trực tiếp', trangThai: 'Đang làm', email: 'nv@x.vn', vaiTro: 'NV', matKhau: 'MatKhauNV#1' },
    { maNV: 'NV2', hoTen: 'NV mới', donVi: 'Đội 1', khoi: 'Trực tiếp', trangThai: 'Đang làm', email: 'nv2@x.vn', vaiTro: 'NV', matKhau: 'TamThoi#9', phaiDoiMK: 'TRUE' },
    { maNV: 'HR1', hoTen: 'Nhân sự', donVi: 'VP', khoi: 'Gián tiếp', trangThai: 'Đang làm', email: 'hr@x.vn', vaiTro: 'HR', matKhau: 'MatKhauHR#1' }
  ]);
  env.resetCache();
  return env;
}
function dangNhap(env, email, mk) {
  const r = env.post({ action: 'login', email, matKhau: mk });
  if (!r.json.ok) throw new Error('Đăng nhập lỗi: ' + r.json.error);
  return r.json.token;
}
function matKhauCua(env, maNV) {
  const sh = env.sheet('NhanVien'); const h = sh.data[0];
  return sh.data.find(r => r[0] === maNV)[h.indexOf('matKhau')];
}
const coKhoaMatKhau = raw => /"(matKhau|salt)"\s*:/.test(raw);

const T = [];
const test = (ten, fn) => T.push({ ten, fn });
const eq = (a, b, m) => { if (a !== b) throw new Error((m || '') + ` — mong đợi ${JSON.stringify(b)}, nhận ${JSON.stringify(a)}`); };
const ok = (v, m) => { if (!v) throw new Error(m || 'điều kiện sai'); };

// ── K1: không còn đặt lại mật khẩu khi chưa đăng nhập ──
test('K1 datLaiMatKhau không có token → bị từ chối, mật khẩu Admin giữ nguyên', () => {
  const env = moiTruong();
  const r = env.post({ action: 'datLaiMatKhau', email: 'admin@x.vn', matKhauMoi: 'abcd' });
  eq(r.json.ok, false, 'phải trả lỗi');
  eq(matKhauCua(env, 'AD1'), 'MatKhauAdmin#1', 'mật khẩu Admin không được đổi');
  ok(!env.post({ action: 'login', email: 'admin@x.vn', matKhau: 'abcd' }).json.ok, 'không đăng nhập được bằng mật khẩu kẻ gian đặt');
});
test('K1 datLaiMatKhau kèm token hợp lệ cũng không tồn tại', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'nv@x.vn', 'MatKhauNV#1');
  const r = env.post({ action: 'datLaiMatKhau', token: tk, email: 'admin@x.vn', matKhauMoi: 'abcd' });
  eq(r.json.ok, false);
  eq(matKhauCua(env, 'AD1'), 'MatKhauAdmin#1');
});
test('K1 không còn hàm apiDatLaiMatKhau trong backend', () => {
  const env = moiTruong();
  eq(typeof env.g.apiDatLaiMatKhau, 'undefined');
});

// ── K4: khoá ký token bắt buộc, không còn giá trị mặc định ──
test('K4 thiếu SESSION_SECRET → đăng nhập báo lỗi bảo trì, không cấp token; Admin chạy kiemTraAuth thấy rõ nguyên nhân', () => {
  const env = moiTruong({});
  const r = env.post({ action: 'login', email: 'nv@x.vn', matKhau: 'MatKhauNV#1' });
  eq(r.json.ok, false);
  ok(!r.json.token, 'không được có token');
  ok(/bảo trì|Admin/i.test(r.json.error), 'thông báo: ' + r.json.error);
  env.g.kiemTraAuth();
  ok(/SESSION_SECRET/.test(env.logs.join('\n')), 'kiemTraAuth phải nêu SESSION_SECRET');
});
test('K4 SESSION_SECRET quá ngắn (< 32 ký tự) → từ chối', () => {
  const env = moiTruong({ SESSION_SECRET: 'ngan-qua' });
  eq(env.post({ action: 'login', email: 'nv@x.vn', matKhau: 'MatKhauNV#1' }).json.ok, false);
});
test('K4 token ký bằng khoá khác (vd khoá mặc định cũ) bị từ chối', () => {
  const env = moiTruong();
  const crypto = require('crypto');
  const p = 'admin@x.vn|' + (Date.now() + 3600e3);
  const sig = crypto.createHmac('sha256', 'khoa-cu-khong-con-hop-le-0123456789').update(p).digest('hex');
  const gia = Buffer.from(p + '|' + sig).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  const r = env.get({ action: 'getProfile', token: gia });
  eq(r.json.ok, false, 'token giả phải bị từ chối');
});
test('K4/K3 không còn chuỗi bí mật/mật khẩu cũ nào trong toàn bộ file của repo', () => {
  const hits = tatCaFileVanBan().map(f => [f, timChuoiCu(fs.readFileSync(path.join(ROOT, f), 'utf8'))]).filter(x => x[1].length);
  eq(hits.map(x => x[0]).join(','), '', 'còn chuỗi cũ');
});
test('K4 có hàm taoSessionSecret() sinh khoá ngẫu nhiên ≥ 48 ký tự và lưu vào Script Properties', () => {
  const env = moiTruong({});
  env.g.taoSessionSecret();
  ok(String(env.props.SESSION_SECRET || '').length >= 48, 'khoá quá ngắn');
  const cu = env.props.SESSION_SECRET;
  env.g.taoSessionSecret();
  ok(env.props.SESSION_SECRET !== cu, 'chạy lại phải ra khoá mới (để thu hồi mọi phiên)');
});

// ── K5: không bao giờ trả mật khẩu về trình duyệt ──
test('K5 đăng nhập không trả matKhau/salt', () => {
  const env = moiTruong();
  const r = env.post({ action: 'login', email: 'tt@x.vn', matKhau: 'MatKhauTT#1' });
  ok(r.json.ok); ok(!coKhoaMatKhau(r.raw), r.raw);
});
test('K5 getNhanVien (Tổ trưởng xem NV cùng đơn vị) không trả matKhau', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'tt@x.vn', 'MatKhauTT#1');
  const r = env.get({ action: 'getNhanVien', token: tk, maNV: 'NV1' });
  ok(r.json.ok, r.raw); ok(!coKhoaMatKhau(r.raw), 'lộ mật khẩu: ' + r.raw);
  ok(!r.raw.includes('MatKhauNV#1'), 'lộ giá trị mật khẩu');
});
test('K5 getNhanVienList (HR) không trả matKhau của bất kỳ ai', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'hr@x.vn', 'MatKhauHR#1');
  const r = env.get({ action: 'getNhanVienList', token: tk });
  ok(r.json.ok, r.raw); ok(!coKhoaMatKhau(r.raw), 'lộ mật khẩu');
  ['MatKhauAdmin#1', 'MatKhauTT#1', 'MatKhauNV#1'].forEach(m => ok(!r.raw.includes(m), 'lộ ' + m));
});
test('K5 lớp chặn chung: mọi phản hồi JSON đều được lọc matKhau/salt (kể cả lồng sâu)', () => {
  const env = moiTruong();
  const out = env.g._jsonOk({ ok: true, data: [{ a: 1, matKhau: 'x', salt: 'y', con: { matKhau: 'z' } }] }).getContent();
  ok(!coKhoaMatKhau(out), out);
  ok(out.includes('"a":1'));
});

// ── K3: ép đổi mật khẩu được kiểm ở máy chủ ──
test('K3 tài khoản phaiDoiMK=TRUE bị chặn mọi thao tác khác ngoài đổi mật khẩu', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'nv2@x.vn', 'TamThoi#9');
  const r = env.post({ action: 'chamVao', token: tk, toaDo: '10.77,106.70' });
  eq(r.json.ok, false);
  ok(/đổi mật khẩu/i.test(r.json.error), r.json.error);
  eq(env.get({ action: 'getNhanVienList', token: tk }).json.ok, false);
});
test('K3 tài khoản phaiDoiMK=TRUE vẫn đổi được mật khẩu, sau đó dùng bình thường', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'nv2@x.vn', 'TamThoi#9');
  ok(env.get({ action: 'getProfile', token: tk }).json.ok, 'getProfile phải được phép');
  const r = env.post({ action: 'doiMatKhau', token: tk, matKhauCu: 'TamThoi#9', matKhauMoi: 'MoiHon#2026' });
  ok(r.json.ok, r.raw);
  env.resetCache();
  const tk2 = dangNhap(env, 'nv2@x.vn', 'MoiHon#2026');
  eq(env.get({ action: 'getChamCongHomNay', token: tk2 }).json.ok, true, 'sau khi đổi phải dùng được');
  const r2 = env.get({ action: 'getProfile', token: tk2 });
  ok(r2.json.ok);
});
test('K3 không cho đặt mật khẩu mới trùng mật khẩu cũ hoặc dưới 8 ký tự', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'nv2@x.vn', 'TamThoi#9');
  eq(env.post({ action: 'doiMatKhau', token: tk, matKhauCu: 'TamThoi#9', matKhauMoi: 'TamThoi#9' }).json.ok, false);
  eq(env.post({ action: 'doiMatKhau', token: tk, matKhauCu: 'TamThoi#9', matKhauMoi: 'abc1234' }).json.ok, false);
});
test('K3 Admin reset mật khẩu: tối thiểu 8 ký tự, bật cờ phải đổi', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'admin@x.vn', 'MatKhauAdmin#1');
  eq(env.post({ action: 'resetMatKhau', token: tk, maNV: 'NV1', matKhauMoi: '1234' }).json.ok, false);
  ok(env.post({ action: 'resetMatKhau', token: tk, maNV: 'NV1', matKhauMoi: 'TamMoi#123' }).json.ok);
  const sh = env.sheet('NhanVien'); const h = sh.data[0];
  eq(String(sh.data.find(r => r[0] === 'NV1')[h.indexOf('phaiDoiMK')]).toUpperCase(), 'TRUE');
});
test('K3 Bootstrap.gs không chứa email/mật khẩu cố định; mã backend không chứa 123456', () => {
  const b = fs.readFileSync(path.join(ROOT, 'backend/Bootstrap.gs'), 'utf8');
  eq(timChuoiCu(b).length, 0, 'còn email/mật khẩu Admin cũ');
  const files = execSync('git -C "' + ROOT + '" ls-files backend').toString().trim().split('\n');
  const hits = files.filter(f => /['"]123456['"]/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  eq(hits.join(','), '', 'còn mật khẩu mặc định 123456');
});
test('K3 bootstrapAdmin đọc thông tin từ Script Properties và xoá mật khẩu tạm sau khi dùng', () => {
  const env = createEnv({ props: { SESSION_SECRET: SECRET, BOOTSTRAP_EMAIL: 'Boss@X.vn', BOOTSTRAP_MATKHAU: 'KhoiTao#2026' } });
  env.g.bootstrapAdmin();
  ok(!('BOOTSTRAP_MATKHAU' in env.props), 'phải xoá BOOTSTRAP_MATKHAU');
  ok(!env.logs.join('\n').includes('KhoiTao#2026'), 'không được in mật khẩu ra log');
  env.resetCache();
  ok(env.post({ action: 'login', email: 'boss@x.vn', matKhau: 'KhoiTao#2026' }).json.ok);
});
test('K3 bootstrapAdmin thiếu Script Properties → báo lỗi rõ, không tạo tài khoản', () => {
  const env = createEnv({ props: { SESSION_SECRET: SECRET } });
  let loi = '';
  try { env.g.bootstrapAdmin(); } catch (e) { loi = e.message; }
  ok(/BOOTSTRAP_EMAIL/.test(loi), 'phải nêu BOOTSTRAP_EMAIL: ' + loi);
});

// ── K2: không còn dữ liệu cá nhân trong repo ──
test('K2 không còn file Excel dữ liệu thật trong cây mã', () => {
  const files = execSync('git -C "' + ROOT + '" ls-files').toString().split('\n');
  const xlsx = files.filter(f => /\.(xlsx|xls|csv)$/i.test(f) || /^"?docs\/.*(Bang tong hop|Ch.*m c.*ng th)/i.test(f));
  eq(xlsx.join(','), '', 'còn file');
});
test('K2 NhanSuImport.gs không còn danh sách nhân sự nhúng trong mã', () => {
  const s = fs.readFileSync(path.join(ROOT, 'backend/NhanSuImport.gs'), 'utf8');
  ok(!/@cscc\.vn"/.test(s), 'còn email nhân sự');
  ok(!/"hoTen"\s*:/.test(s), 'còn họ tên nhân sự');
});
test('K2 importNhanSu đọc từ sheet NhanSuImport, chỉ đặt mật khẩu cho người MỚI, không reset người cũ', () => {
  const env = moiTruong();
  env.seedSheet('NhanSuImport', ['maNV', 'hoTen', 'donVi', 'khoi', 'chucDanh', 'vaiTro', 'email'], [
    { maNV: 'NV1', hoTen: 'Nhân viên', donVi: 'Đội 1', khoi: 'Trực tiếp', chucDanh: 'CN', vaiTro: 'NV', email: 'nv@x.vn' },
    { maNV: 'NV9', hoTen: 'Người mới', donVi: 'Đội 1', khoi: 'Trực tiếp', chucDanh: 'CN', vaiTro: 'NV', email: 'nv9@x.vn' }
  ]);
  env.g.importNhanSu();
  env.resetCache();
  eq(matKhauCua(env, 'NV1'), 'MatKhauNV#1', 'không được reset mật khẩu người đã có');
  const mk9 = String(matKhauCua(env, 'NV9'));
  ok(mk9.length >= 10 && mk9 !== '123456', 'mật khẩu tạm của người mới phải ngẫu nhiên ≥ 10 ký tự');
  const imp = env.sheet('NhanSuImport'); const h = imp.data[0];
  ok(h.includes('matKhauTam'), 'phải ghi mật khẩu tạm ra cột matKhauTam để HR phát');
  const sh = env.sheet('NhanVien'); const hh = sh.data[0];
  eq(String(sh.data.find(r => r[0] === 'NV9')[hh.indexOf('phaiDoiMK')]).toUpperCase(), 'TRUE');
});
test('K2 taoNVMau không dùng mật khẩu cố định', () => {
  const env = moiTruong();
  env.g.taoNVMau();
  env.resetCache();
  ['GD01', 'TDV01', 'TT01', 'NV01'].forEach(m => {
    const mk = String(matKhauCua(env, m));
    ok(mk.length >= 10, m + ' mật khẩu yếu: ' + mk);
  });
});

// ── getCauHinh: chỉ Admin xem toàn bộ ──
test('getCauHinh: NV chỉ nhận các khoá công khai cần cho giao diện', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'nv@x.vn', 'MatKhauNV#1');
  const r = env.get({ action: 'getCauHinh', token: tk });
  ok(r.json.ok, r.raw);
  const keys = r.json.data.map(x => x.key);
  ok(keys.includes('dinh_muc_viec_rieng'), 'thiếu dinh_muc_viec_rieng (trang Đơn từ cần)');
  ok(!keys.includes('geocode_email') && !keys.includes('dia_ban_cho_phep') && !keys.includes('nguong_ky_luat_30_sa'), 'lộ cấu hình nội bộ: ' + keys.join(','));
});
test('getCauHinh: Admin nhận toàn bộ', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'admin@x.vn', 'MatKhauAdmin#1');
  const r = env.get({ action: 'getCauHinh', token: tk });
  ok(r.json.data.length > 15, 'Admin phải thấy đủ cấu hình');
});

// ── K6: lịch lễ mặc định 2026 ──
test('K6 ngày lễ mặc định có 27/4 và 24/11/2026, không có 26/4', () => {
  const env = moiTruong();
  const v = env.g.getConfig('ngay_le_tet');
  ok(v.includes('2026-04-27'), 'thiếu 27/4'); ok(v.includes('2026-11-24'), 'thiếu 24/11');
  ok(!v.includes('2026-04-26'), 'còn 26/4');
});
test('K6 seedNgayLe2026 ghi đè đúng 12 ngày', () => {
  const env = moiTruong();
  env.g.seedNgayLe2026();
  env.resetCache();
  const ds = String(env.g.getConfig('ngay_le_tet')).split(',');
  eq(ds.length, 12);
  ok(ds.includes('2026-11-24') && ds.includes('2026-04-27') && !ds.includes('2026-04-26'));
});

// ── Giao diện ──
test('Giao diện: trang đăng nhập không còn form/đường gọi đặt lại mật khẩu', () => {
  const h = fs.readFileSync(path.join(ROOT, 'web/index.html'), 'utf8');
  ok(!/datLaiMatKhau/.test(h), 'còn gọi datLaiMatKhau');
  ok(!/Đặt lại mật khẩu/.test(h), 'còn nút Đặt lại mật khẩu');
  ok(/Admin|HR/.test(h), 'phải hướng dẫn liên hệ Admin/HR khi quên mật khẩu');
});
test('Phiên bản 1.0.2 đồng bộ config.js, sw.js', () => {
  ok(/APP_VERSION\s*:\s*'1\.0\.2'/.test(fs.readFileSync(path.join(ROOT, 'web/js/config.js'), 'utf8')), 'config.js');
  ok(/cscc-v1\.0\.2/.test(fs.readFileSync(path.join(ROOT, 'web/sw.js'), 'utf8')), 'sw.js');
});

// ── Không hồi quy: luồng đăng nhập/đổi mật khẩu thường ──
test('Hồi quy: đăng nhập đúng/sai mật khẩu, getProfile', () => {
  const env = moiTruong();
  eq(env.post({ action: 'login', email: 'nv@x.vn', matKhau: 'sai' }).json.ok, false);
  const tk = dangNhap(env, 'NV@x.vn ', 'MatKhauNV#1');
  const p = env.get({ action: 'getProfile', token: tk });
  ok(p.json.ok); eq(p.json.data.maNV, 'NV1');
});

// ── Chống leo thang quyền qua quản lý nhân viên ──
test('HR không reset được mật khẩu tài khoản Admin/BGĐ', () => {
  const env = moiTruong();
  env.seedSheet('NhanVien', NV_HEADERS, env.sheet('NhanVien').data.slice(1).map(r => Object.fromEntries(NV_HEADERS.map((h, i) => [h, r[i]])))
    .concat([{ maNV: 'GD1', hoTen: 'Giám đốc', donVi: 'BGĐ', trangThai: 'Đang làm', email: 'gd@x.vn', vaiTro: 'BGD', matKhau: 'MatKhauGD#1' }]));
  env.resetCache();
  const tk = dangNhap(env, 'hr@x.vn', 'MatKhauHR#1');
  eq(env.post({ action: 'resetMatKhau', token: tk, maNV: 'GD1', matKhauMoi: 'ChiemQuyen#1' }).json.ok, false);
  eq(env.post({ action: 'resetMatKhau', token: tk, maNV: 'AD1', matKhauMoi: 'ChiemQuyen#1' }).json.ok, false);
  eq(matKhauCua(env, 'GD1'), 'MatKhauGD#1');
  ok(env.post({ action: 'resetMatKhau', token: tk, maNV: 'NV1', matKhauMoi: 'TamMoi#123' }).json.ok, 'HR vẫn reset được NV thường');
});
test('HR không tự nâng mình/người khác lên Admin, không tạo tài khoản Admin', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'hr@x.vn', 'MatKhauHR#1');
  eq(env.post({ action: 'updateNhanVien', token: tk, maNV: 'HR1', vaiTro: 'Admin' }).json.ok, false);
  eq(env.post({ action: 'updateNhanVien', token: tk, maNV: 'NV1', vaiTro: 'BGD' }).json.ok, false);
  eq(env.post({ action: 'createNhanVien', token: tk, maNV: 'X1', hoTen: 'X', email: 'x@x.vn', vaiTro: 'Admin' }).json.ok, false);
  ok(env.post({ action: 'updateNhanVien', token: tk, maNV: 'NV1', chucDanh: 'Công nhân bậc 3' }).json.ok, 'sửa hồ sơ thường vẫn được');
});
test('Sửa hồ sơ NV không đổi/xoá được mật khẩu và không ghi mật khẩu vào AuditLog', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'hr@x.vn', 'MatKhauHR#1');
  ok(env.post({ action: 'updateNhanVien', token: tk, maNV: 'NV1', matKhau: 'DoTay#999', phaiDoiMK: '', chucDanh: 'CN' }).json.ok);
  env.resetCache();
  eq(matKhauCua(env, 'NV1'), 'MatKhauNV#1');
  const log = JSON.stringify(env.sheet('AuditLog').data);
  ok(!log.includes('DoTay#999'), 'AuditLog chứa mật khẩu');
});

test('Đổi mật khẩu xong dùng tiếp token cũ ngay (không cần đăng nhập lại, không kẹt cache)', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'nv2@x.vn', 'TamThoi#9');
  ok(env.post({ action: 'doiMatKhau', token: tk, matKhauCu: 'TamThoi#9', matKhauMoi: 'MoiHon#2026' }).json.ok);
  eq(env.get({ action: 'getChamCongHomNay', token: tk }).json.ok, true);
});
test('Người đang có mật khẩu 6 ký tự (đặt trước 1.0.2) vẫn đăng nhập được', () => {
  const env = moiTruong();
  const sh = env.sheet('NhanVien'); const h = sh.data[0];
  sh.data.find(r => r[0] === 'NV1')[h.indexOf('matKhau')] = 654321;   // Sheets lưu thành số
  env.resetCache();
  ok(env.post({ action: 'login', email: 'nv@x.vn', matKhau: '654321' }).json.ok);
});
test('Reset mật khẩu NV có mã NV dạng số trong sheet (gửi lên dạng chuỗi)', () => {
  const env = moiTruong();
  const sh = env.sheet('NhanVien'); const h = sh.data[0];
  sh.data.find(r => r[0] === 'NV1')[0] = 1001;
  env.resetCache();
  const tk = dangNhap(env, 'admin@x.vn', 'MatKhauAdmin#1');
  ok(env.post({ action: 'resetMatKhau', token: tk, maNV: '1001', matKhauMoi: 'TamMoi#123' }).json.ok);
});
test('Vai trò gửi lên dạng mảng/đối tượng/có khoảng trắng bị từ chối (chống leo thang)', () => {
  const env = moiTruong();
  const tk = dangNhap(env, 'hr@x.vn', 'MatKhauHR#1');
  [['Admin'], 'Admin ', {}, { a: 'Admin' }, 'admin'].forEach(v => {
    eq(env.post({ action: 'updateNhanVien', token: tk, maNV: 'NV1', vaiTro: v }).json.ok, false, JSON.stringify(v));
    eq(env.post({ action: 'createNhanVien', token: tk, maNV: 'Z' + Math.random(), hoTen: 'Z', email: Math.random() + '@x.vn', vaiTro: v }).json.ok, false, 'tạo ' + JSON.stringify(v));
  });
  const sh = env.sheet('NhanVien'); const hh = sh.data[0];
  eq(sh.data.find(r => r[0] === 'NV1')[hh.indexOf('vaiTro')], 'NV');
});
test('Cờ phaiDoiMK nhập tay có khoảng trắng / kiểu boolean vẫn bị chặn', () => {
  [' TRUE ', true, 'true'].forEach(v => {
    const env = moiTruong();
    const sh = env.sheet('NhanVien'); const h = sh.data[0];
    sh.data.find(r => r[0] === 'NV1')[h.indexOf('phaiDoiMK')] = v;
    env.resetCache();
    const tk = dangNhap(env, 'nv@x.vn', 'MatKhauNV#1');
    eq(env.get({ action: 'getChamCongHomNay', token: tk }).json.ok, false, JSON.stringify(v));
  });
});
test('Token có hạn không phải số bị coi là hết hạn', () => {
  const env = moiTruong();
  const crypto = require('crypto');
  const p = 'admin@x.vn|abc';
  const sig = crypto.createHmac('sha256', SECRET).update(p).digest('hex');
  const tk = Buffer.from(p + '|' + sig).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  eq(env.get({ action: 'getProfile', token: tk }).json.ok, false);
});
test('Thiếu SESSION_SECRET: báo bảo trì ngay, không tiết lộ email/mật khẩu đúng hay sai', () => {
  const env = moiTruong({});
  const a = env.post({ action: 'login', email: 'nv@x.vn', matKhau: 'MatKhauNV#1' }).json.error;
  const b = env.post({ action: 'login', email: 'khongco@x.vn', matKhau: 'sai' }).json.error;
  eq(a, b, 'hai câu lỗi phải giống nhau');
});
test('lamSachMatKhauAuditLog xoá mật khẩu đã lỡ ghi trong cột chiTiet', () => {
  const env = moiTruong();
  env.g.appendLog('HR1', 'hr@x.vn', 'SUA_NV', 'NhanVien', { maNV: 'NV1', updates: { matKhau: 'LoGhi#1', salt: 's', chucDanh: 'CN' } });
  env.g.appendLog('HR1', 'hr@x.vn', 'SUA_NV', 'NhanVien', 'chuoi thuong khong JSON');
  env.g.lamSachMatKhauAuditLog();
  const log = JSON.stringify(env.sheet('AuditLog').data);
  ok(!log.includes('LoGhi#1'), 'còn mật khẩu'); ok(log.includes('chucDanh'), 'mất dữ liệu khác');
  ok(log.includes('chuoi thuong khong JSON'));
});

module.exports = T;
