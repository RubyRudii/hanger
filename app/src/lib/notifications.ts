import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const isExpoGo = Constants.appOwnership === 'expo';

export async function registerPushToken(userId: string): Promise<string | null> {
  // iOS push in Expo Go is disabled by Apple as of SDK 53. Android Expo Go still
  // works. Once you EAS Build a dev client / production build, both platforms work.
  if (!Device.isDevice) {
    return null; // Simulator can't get a push token.
  }
  if (isExpoGo && Platform.OS === 'ios') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const next = await Notifications.requestPermissionsAsync();
    status = next.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    (Constants.expoConfig as any)?.extra?.eas?.projectId ??
    (Constants.easConfig as any)?.projectId;
  if (!projectId) {
    console.warn('[notifications] No EAS projectId yet — token registration skipped until you EAS Build.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (token) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
    }
    return token ?? null;
  } catch (e) {
    console.warn('[notifications] failed to get push token', e);
    return null;
  }
}

export async function clearPushToken(userId: string): Promise<void> {
  await supabase.from('profiles').update({ push_token: null }).eq('id', userId);
}
