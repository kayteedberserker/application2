import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  Text as RNText,
  TextInput,
  View,
} from "react-native";
import AnimeLoading from "../../components/AnimeLoading";
import { Text } from "../../components/Text";
import { useUser } from "../../context/UserContext"; // Import this
import { getFingerprint } from "../../utils/device";

const { width } = Dimensions.get('window');

const THEME = {
  bg: "#0a0a0a",
  card: "#111111",
  accent: "#2563eb",
  border: "#1e293b",
  glowBlue: "rgba(37, 99, 235, 0.1)",
  glowIndigo: "rgba(79, 70, 229, 0.08)"
};
export default function FirstLaunchScreen() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const isMounted = useRef(true);
  const { setUser } = useUser(); // Get the setter from context

  const notify = (title, message) => {
    if (Platform.OS === "web") alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("mobileUser");
        if (storedUser && isMounted.current) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed); // Sync global state first
          router.replace("/profile");
          return;
        }
      } catch (e) {
        console.error("Storage error", e);
      }
      setLoading(false);
    })();
    return () => { isMounted.current = false; };
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === "web") return null;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return null;
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || "yMNrI6jWuN";
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch { return null; }
  }

  const handleRegister = async () => {
    if (isRegistering) return;
    if (!username.trim() || username.trim().length < 3 || username.trim() == "Admin") {
      return notify("Invalid Username", "Username must be at least 3 characters.");
    }

    setIsRegistering(true);
    try {
      const deviceId = await getFingerprint();
      const pushToken = await registerForPushNotificationsAsync();

      const res = await fetch("https://oreblogda.com/api/mobile/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: deviceId || "device-id",
            username: username.trim(),
            pushToken,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      const userData = {
        deviceId,
        username: username.trim(),
        pushToken,
      };

      // 1. Save to Storage
      await AsyncStorage.setItem("mobileUser", JSON.stringify(userData));

      // 2. IMPORTANT: Update Global User Context immediately
      setUser(userData);

      // 3. Small timeout to allow Context to propagate before navigating
      setTimeout(() => {
        router.replace("/profile");
      }, 100);

    } catch (err) {
      console.error("Registration Catch:", err);
      notify("Registration Error", err.message);
      if (isMounted.current) setIsRegistering(false);
    }
  };

  if (loading) {
    return <AnimeLoading message="Loading..." subMessage="Checking Session" />
  }

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }} className="justify-center items-center px-8">
      
      {/* --- Ambient Background Glows --- */}
      <View style={{ position: 'absolute', top: 100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: THEME.glowBlue }} />
      <View style={{ position: 'absolute', bottom: 100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: THEME.glowIndigo }} />

      {/* --- Terminal Icon --- */}
      <View 
        style={{ borderColor: THEME.border }}
        className="w-20 h-20 bg-gray-900 rounded-[30px] items-center justify-center mb-8 border-2 shadow-2xl shadow-blue-500/20"
      >
        <Ionicons name="finger-print" size={40} color={THEME.accent} />
      </View>

      <View className="items-center mb-10">
        <Text className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-2 text-center">Identity Initialization</Text>
        <Text className="text-4xl font-black italic uppercase text-white text-center">Welcome</Text>
      </View>

      <Text className="text-sm text-gray-500 mb-10 text-center leading-6 font-medium px-4">
        Choose a <Text className="text-white font-bold italic uppercase">Username</Text> for your posts and comments to begin the uplink.
      </Text>

      {/* --- Form Section --- */}
      <View className="w-full">
        <Text className="text-gray-600 font-black uppercase text-[9px] tracking-[0.2em] mb-3 ml-1">Callsign Assignment</Text>
        <TextInput
          style={{ backgroundColor: THEME.card, borderColor: THEME.border }}
          className="w-full border-2 rounded-2xl px-5 py-5 mb-8 text-white font-black italic uppercase"
          placeholder="ENTER CALLSIGN (E.G. ANIMELOVER)"
          placeholderTextColor="#334155"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          editable={!isRegistering}
        />

        <Pressable
          onPress={handleRegister}
          disabled={isRegistering}
          style={({ pressed }) => [
            {
              backgroundColor: isRegistering ? "#1e3a8a" : THEME.accent,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: isRegistering ? 0.7 : 1
            }
          ]}
          className="w-full py-5 rounded-[24px] flex-row justify-center items-center shadow-2xl shadow-blue-500/40"
        >
          {isRegistering ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 12 }} />
              <RNText style={{ color: "white", fontSize: 16, fontWeight: "900", fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 2 }}>
                Synchronizing...
              </RNText>
            </>
          ) : (
            <>
              <Ionicons name="power" size={18} color="white" style={{ marginRight: 10 }} />
              <RNText style={{ color: "white", fontSize: 16, fontWeight: "900", fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 2 }}>
                Establish Link
              </RNText>
            </>
          )}
        </Pressable>
      </View>

      {/* --- Footer Label --- */}
      <View className="absolute bottom-12 items-center">
        <Text className="text-gray-800 font-black text-[8px] uppercase tracking-[0.5em]">Secure Auth Sector 7</Text>
      </View>
    </View>
  );
}