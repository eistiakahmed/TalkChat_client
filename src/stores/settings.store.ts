import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserSettingsState {
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  enterToSend: boolean;

  // Actions
  toggleSound: () => void;
  toggleDesktopNotifications: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDesktopNotificationsEnabled: (enabled: boolean) => void;
}

/**
 * TalkChat User Preferences & Notification Settings Store.
 * 
 * Persists audio chime preferences and desktop notification toggles
 * in client-side localStorage.
 * 
 * @see https://docs.pmnd.rs/zustand/integrations/persisting-store-data
 */
export const useSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      desktopNotificationsEnabled: true,
      enterToSend: true,

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      toggleDesktopNotifications: () => {
        set((state) => ({
          desktopNotificationsEnabled: !state.desktopNotificationsEnabled,
        }));
      },

      setSoundEnabled: (enabled) => {
        set({ soundEnabled: enabled });
      },

      setDesktopNotificationsEnabled: (enabled) => {
        set({ desktopNotificationsEnabled: enabled });
      },
    }),
    {
      name: 'talkchat_user_preferences',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
