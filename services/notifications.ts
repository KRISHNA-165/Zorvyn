import { Platform } from 'react-native';

// Dynamically import expo-notifications only on native platforms to avoid web SSR/Prerendering crashes
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('expo-notifications is not supported in this Expo Go environment. Notifications disabled.');
    Notifications = null;
  }
}

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web' || !Notifications) return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }

  return true;
};

export const scheduleDailyReminder = async () => {
  if (Platform.OS === 'web' || !Notifications) return;

  // Clear existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule a daily reminder at 8:00 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "How's your budget looking?",
      body: "Take a moment to record any expenses from today to stay in Equilibrium.",
      data: { screen: 'add' },
    },
    trigger: {
      type: 'daily',
      hour: 20,
      minute: 0,
      repeats: true,
      channelId: 'default',
    } as any,
  });
};
