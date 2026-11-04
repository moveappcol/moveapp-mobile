import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Pide permiso de notificaciones y devuelve el token de push de Expo, o
 * null si la persona no dio permiso o está en un simulador (los push no
 * funcionan ahí). Nunca lanza. */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ff4f3f",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return data;
  } catch {
    return null;
  }
}
