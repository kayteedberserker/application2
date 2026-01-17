import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveToCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Cache save error", e);
  }
};

export const getFromCache = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

