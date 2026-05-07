/**
 * Hook xử lý thao tác write khi offline
 * Hiển thị toast thông báo thay vì crash
 */
import { useOfflineStore } from '../store/offlineStore';

export function useOfflineAction() {
  const { isOnline } = useOfflineStore();

  /**
   * Kiểm tra có thể thực hiện thao tác không
   * @returns {{ allowed: boolean, message: string }}
   */
  const checkOnline = () => {
    if (!isOnline) {
      return {
        allowed: false,
        message: 'Không thể thực hiện khi đang offline.\nVui lòng kết nối mạng và thử lại.',
      };
    }
    return { allowed: true, message: '' };
  };

  /**
   * Bọc async action — tự động kiểm tra online trước khi chạy
   * @param {Function} action
   * @param {Function} onOffline - callback khi offline (nhận message)
   */
  const withOnlineCheck = async (action, onOffline) => {
    const { allowed, message } = checkOnline();
    if (!allowed) {
      if (onOffline) onOffline(message);
      return null;
    }
    return action();
  };

  return { isOnline, checkOnline, withOnlineCheck };
}
