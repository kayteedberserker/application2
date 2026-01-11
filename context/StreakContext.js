import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useMemo } from "react";
import useSWR from 'swr';

const StreakContext = createContext();

// The fetcher handles getting the ID from storage then hitting the API
const streakFetcher = async (url) => {
  const userData = await AsyncStorage.getItem("mobileUser");
  if (!userData) return null;

  const { deviceId } = JSON.parse(userData);
  if (!deviceId) return null;

  const res = await fetch(`${url}/${deviceId}`);
  if (!res.ok) throw new Error("Failed to fetch streak");
  
  return res.json();
};

export function StreakProvider({ children }) {
  // SWR Hook
  const { data, error, mutate, isValidating } = useSWR(
    "https://oreblogda.com/api/users/streak",
    streakFetcher,
    {
      dedupingInterval: 1000 * 60 * 60, // Dedup requests within 1 hour
      revalidateOnFocus: true,        // Check for updates when user returns to app
      fallbackData: { 
        streak: 0, 
        lastPostDate: null, 
        canRestore: false, 
        recoverableStreak: 0 
      }
    }
  );

  // loading is true only if we have no data and no error
  const loading = !data && !error;

  // refreshStreak now just calls mutate() which triggers SWR to refetch
  const refreshStreak = () => mutate();

  const value = useMemo(() => ({
    streak: data,
    loading,
    isValidating,
    refreshStreak
  }), [data, loading, isValidating]);

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