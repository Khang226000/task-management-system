// Utility để hiển thị hộp thoại xác nhận ở giữa màn hình
// Thay thế window.confirm() mặc định của trình duyệt

let _showFn = null;

export function _registerConfirm(fn) {
  _showFn = fn;
}

/**
 * Hiển thị hộp thoại xác nhận ở giữa màn hình
 * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function showConfirm(opts) {
  if (_showFn) return _showFn(opts);
  // Fallback nếu chưa đăng ký (không nên xảy ra)
  return Promise.resolve(window.confirm(opts.message));
}
