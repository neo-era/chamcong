// ─── datepicker.js ────────────────────────────────────────────────────────────
// Hiển thị mọi <input type="date"> theo định dạng DD/MM/YYYY (dùng flatpickr).
// Giá trị thực của input vẫn là yyyy-MM-dd → KHÔNG phải sửa backend hay payload.
// flatpickr self-host trong web/vendor (pin bản) → tự rơi về input ngày gốc nếu lỗi.

(function () {
  function injectCss(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
  function injectJs(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb; s.onerror = function () { cb && cb(); };
    document.head.appendChild(s);
  }

  function apply() {
    if (!window.flatpickr) return;
    try { if (flatpickr.l10ns && flatpickr.l10ns.vn) flatpickr.localize(flatpickr.l10ns.vn); } catch (e) {}
    document.querySelectorAll('input[type="date"]').forEach(initOne);
  }

  function initOne(el) {
    if (el._flatpickr) return;
    flatpickr(el, {
      dateFormat: 'Y-m-d',          // giá trị gửi đi
      altInput: true,
      altFormat: 'd/m/Y',           // hiển thị DD/MM/YYYY
      altInputClass: 'form-control',
      allowInput: true,
      onChange: function (sel, str, inst) {
        // Đồng bộ với Alpine x-model (lắng nghe sự kiện input)
        inst.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  // Cho các trang gọi sau khi gán giá trị ngày bằng JS (vd mở modal sửa)
  window.syncDates = function () {
    document.querySelectorAll('input[type="date"]').forEach(function (el) {
      if (el._flatpickr) el._flatpickr.setDate(el.value || null, false);
    });
  };

  function boot() {
    injectCss('vendor/flatpickr.min.css');
    injectJs('vendor/flatpickr.min.js', function () {
      injectJs('vendor/flatpickr-vn.js', apply);
    });
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
