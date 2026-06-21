// ─── doimatkhau.js ────────────────────────────────────────────────────────────
// Alpine.js cho doi-mat-khau.html — người dùng tự đổi mật khẩu.

function doiMatKhauApp() {
  return {
    submitting: false,
    matKhauCu:  '',
    matKhauMoi: '',
    xacNhan:    '',
    errorMsg:   '',
    successMsg: '',

    init() {
      if (!requireLogin('index.html')) return;
      renderHeader('');
    },

    async doiMatKhau() {
      this.errorMsg = ''; this.successMsg = '';
      if (!this.matKhauCu)            { this.errorMsg = 'Nhập mật khẩu hiện tại'; return; }
      if (this.matKhauMoi.length < 6) { this.errorMsg = 'Mật khẩu mới phải có ít nhất 6 ký tự'; return; }
      if (this.matKhauMoi !== this.xacNhan) { this.errorMsg = 'Xác nhận mật khẩu không khớp'; return; }
      if (this.matKhauMoi === this.matKhauCu) { this.errorMsg = 'Mật khẩu mới phải khác mật khẩu cũ'; return; }

      this.submitting = true;
      try {
        await Api.doiMatKhau({ matKhauCu: this.matKhauCu, matKhauMoi: this.matKhauMoi });
        this.successMsg = 'Đã đổi mật khẩu thành công.';
        this.matKhauCu = ''; this.matKhauMoi = ''; this.xacNhan = '';
        // NC-A: xoá cờ ép đổi + về trang chấm công
        try {
          const u = getCurrentUser(); if (u) { u.phaiDoiMK = ''; sessionStorage.setItem('cc_user', JSON.stringify(u)); }
        } catch (_) {}
        setTimeout(() => { location.href = 'chamcong.html'; }, 1200);
      } catch (e) { this.errorMsg = e.message; }
      finally { this.submitting = false; }
    }
  };
}
