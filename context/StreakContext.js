import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useMemo, useEffect, useState } from "react";
import useSWR from 'swr';
import * as Notifications from 'expo-notifications'; // 🔹 Need expo-notifications

const StreakContext = createContext();
const STREAK_CACHE_KEY = "streak_local_cache";
const APP_SECRET = "thisismyrandomsuperlongsecretkey";

// 🔹 Notification Scheduler Logic
const scheduleStreakReminders = async (expiresAt) => {
  if (!expiresAt) return;

  // 1. Cancel existing streak notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const expiryDate = new Date(expiresAt).getTime();
  const now = Date.now();

  const timeUntilExpiry = expiryDate - now;

  // Notification 1: 24 Hours before expiry
  const trigger24h = expiryDate - (24 * 60 * 60 * 1000);
  if (trigger24h > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Streak at Risk!",
        body: "You have 24 hours left to post and keep your streak alive!",
        data: { screen: 'CreatePost' },
      },
      trigger: new Date(trigger24h),
    });
  }

  // Notification 2: 2 Hours before expiry (The "Urgent" one)
  const trigger2h = expiryDate - (2 * 60 * 60 * 1000);
  if (trigger2h > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ FINAL WARNING",
        body: "Your streak expires in 2 hours! Post something now!",
        sound: 'default',
        priority: 'high',
      },
      trigger: new Date(trigger2h),
    });
  }

  // Notification 3: At Expiry
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💀 Streak Lost",
      body: "Your streak has expired. Start a new one today!",
    },
    trigger: new Date(expiryDate),
  });
};

const streakFetcher = async (url) => {
  const userData = await AsyncStorage.getItem("mobileUser");
  if (!userData) return null;

  const { deviceId } = JSON.parse(userData);
  if (!deviceId) return null;

  const res = await fetch(`${url}/${deviceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-oreblogda-secret": APP_SECRET 
    }
  });

  if (!res.ok) throw new Error("Failed to fetch streak");
  
  const data = await res.json();
  
  // 🔹 Save to local cache
  await AsyncStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(data));
  
  // 🔹 Schedule the local reminders based on expiresAt from DB
  if (data?.expiresAt) {
    await scheduleStreakReminders(data.expiresAt);
  }
  
  return data;
};

export function StreakProvider({ children }) {
  const [initialCache, setInitialCache] = useState({
    streak: 0, 
    lastPostDate: null, 
    canRestore: false, 
    recoverableStreak: 0,
    expiresAt: null
  });
  const [isCacheReady, setIsCacheReady] = useState(false);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const savedStreak = await AsyncStorage.getItem(STREAK_CACHE_KEY);
        if (savedStreak) {
          const parsed = JSON.parse(savedStreak);
          setInitialCache(parsed);
          // Reschedule reminders on app launch in case they were cleared
          if (parsed.expiresAt) scheduleStreakReminders(parsed.expiresAt);
        }
      } catch (e) {
        console.error("Streak Cache Load Error:", e);
      } finally {
        setIsCacheReady(true);
      }
    };
    loadCache();
  }, []);

  const { data, error, mutate, isValidating } = useSWR(
    isCacheReady ? "https://oreblogda.com/api/users/streak" : null,
    streakFetcher,
    {
      dedupingInterval: 1000 * 60 * 5, 
      revalidateOnFocus: true,
      fallbackData: initialCache, 
    }
  );

  const loading = !isCacheReady || (!data && !error);

  const refreshStreak = () => mutate();

  const value = useMemo(() => ({
    streak: data || initialCache, 
    loading,
    isValidating,
    refreshStreak
  }), [data, initialCache, loading, isValidating]);

  return (
    <StreakContext.Provider value={value}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error("useStreak must be used within a StreakProvider");
  }
  return context;
}
