import { useSettingsStore } from '../stores/settings.store';

/**
 * Native Browser Web Notifications API Service.
 * 
 * Manages notification permission prompts and displays system toast
 * notifications when the user receives messages in the background.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
 */
class NotificationService {
  /**
   * Check if browser notifications are supported.
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Request user permission for native desktop notifications.
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      useSettingsStore.getState().setDesktopNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  }

  /**
   * Check if permission is currently granted.
   */
  isPermissionGranted(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Display system notification if window is blurred or in another conversation.
   */
  showNotification(
    title: string,
    options: NotificationOptions & { onClickUrl?: string } = {}
  ) {
    if (!this.isSupported() || !this.isPermissionGranted()) return;
    if (!useSettingsStore.getState().desktopNotificationsEnabled) return;

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        silent: true, // We trigger custom sound chimes via Web Audio API
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClickUrl && typeof window !== 'undefined') {
          window.location.href = options.onClickUrl;
        }
      };
    } catch {
      // Notification creation failed or blocked by policy
    }
  }
}

export const notificationService = new NotificationService();
