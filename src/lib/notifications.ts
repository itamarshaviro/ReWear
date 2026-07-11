import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase, isSupabaseConfigured } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(dbId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (isSupabaseConfigured() && dbId) {
      await supabase.from('users').update({ push_token: token }).eq('id', dbId);
    }
  } catch {
    // simulator or no EAS project — skip silently
  }
}

export async function sendPushNotification(
  recipientDbId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { data: row } = await supabase
    .from('users')
    .select('push_token')
    .eq('id', recipientDbId)
    .single();

  const token = row?.push_token;
  if (!token) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
}
