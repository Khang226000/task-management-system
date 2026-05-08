/**
 * Hook bảo vệ thao tác write khi offline
 * Dùng trong các component cần thêm/sửa/xóa
 */
import { useOfflineStore } from '../store/offlineStore';

export function useOfflineGuard() {
  const { isOnline } = useOfflineStore();

  /**
   * Bọc action — nếu offline thì throw lỗi với message rõ ràng
   * @param {Function} action - async function cần bảo vệ
   * @param {string} actionName - tên thao tác để hiển thị trong lỗi
   */
  const guardAction = async (action, actionName = 'thao tác này') => {
    if (!isOnline) {
      throw new Error(`Không thể ${actionName} khi đang offline. Vui lòng kết nối mạng và thử lại.`);
    }
    return action();
  };

  return { isOnline, guardAction };
}
