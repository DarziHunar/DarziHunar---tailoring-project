import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/** Shows a native local notification on this device. Server-side inbox records are created separately. */
export async function showLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
    if (Platform.OS === 'web') return;
    try {
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) return;
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('orders', {
                name: 'Order updates', importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default', vibrationPattern: [0, 250, 200, 250],
            });
        }
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data: data ?? {}, sound: 'default' },
            trigger: null,
        });
    } catch (error) {
        // A denied permission or unavailable native module must not make order creation fail.
        console.warn('Local notification could not be displayed:', error);
    }
}
