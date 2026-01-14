import Constants from 'expo-constants';
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { AppState, BackHandler, DeviceEventEmitter, Platform, StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import AnimeLoading from "../components/AnimeLoading";
import { loadAppOpenAd, showAppOpenAd } from "../components/appOpenAd";
import { StreakProvider, useStreak } from "../context/StreakContext";
import { UserProvider, useUser } from "../context/UserContext";
import { AdConfig } from '../utils/AdConfig';
import "./globals.css";

SplashScreen.preventAutoHideAsync();

// --- AD CONFIGURATION ---
const FIRST_AD_DELAY_MS = 120000; // 2 minute delay after app opens
const COOLDOWN_MS = 480000; // 8 minutes between subsequent ads

// We set the lastShownTime to "now minus (cooldown - first delay)" 
let lastShownTime = Date.now() - (COOLDOWN_MS - FIRST_AD_DELAY_MS);
let interstitial = null;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || "yMNrI6jWuN";

    try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        return token;
    } catch (e) {
        console.error("Push Token Error:", e);
        return null;
    }
}

function RootLayoutContent() {
    const { refreshStreak } = useStreak()
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const [isSyncing, setIsSyncing] = useState(true);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        loadAppOpenAd();
        
        const sub = AppState.addEventListener('change', nextState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextState === 'active'
            ) {
                showAppOpenAd();
            }
            appState.current = nextState;
        });

        return () => sub.remove();
    }, []);

    useEffect(() => {
        refreshStreak();
    }, [pathname, refreshStreak]);

    const [fontsLoaded, fontError] = useFonts({
        "SpaceGrotesk": require("../assets/fonts/SpaceGrotesk.ttf"),
        "SpaceGroteskBold": require("../assets/fonts/SpaceGrotesk.ttf"),
    });

    // 1. AdMob Logic with Session Delay
    useEffect(() => {
        if (Platform.OS !== 'web') {
            try {
                const { InterstitialAd } = require('react-native-google-mobile-ads');
                const mobileAds = require('react-native-google-mobile-ads').default;

                mobileAds().initialize().then(() => {
                    interstitial = InterstitialAd.createForAdRequest(AdConfig.interstitial);
                    interstitial.load();
                    const adTriggerSub = DeviceEventEmitter.addListener("tryShowInterstitial", () => {
                        const now = Date.now();
                        if (interstitial?.loaded && (now - lastShownTime > COOLDOWN_MS)) {
                            lastShownTime = now;
                            interstitial.show();
                            interstitial.load();
                        }
                    });
                    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                        DeviceEventEmitter.emit("tryShowInterstitial");
                        return false;
                    });

                    return () => {
                        adTriggerSub.remove();
                        backHandler.remove();
                    };
                });
            } catch (err) { console.log("AdMob error:", err); }
        }
    }, []);

    // 2. Account Sync & Push Token
    useEffect(() => {
        async function performSync() {
            if (!fontsLoaded) return;

            const token = await registerForPushNotificationsAsync();

            if (token && user?.deviceId) {
                try {
                    await fetch("https://oreblogda.com/api/users/update-push-token", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            deviceId: user.deviceId,
                            pushToken: token
                        })
                    });
                } catch (err) {
                    console.log("Token sync failed:", err);
                }
            }

            // Always include loading animation as requested
            setTimeout(() => setIsSyncing(false), 1500);
        }

        performSync();
    }, [fontsLoaded, user?.deviceId]);

    // 3. Notification Interaction (Cold Start + Background/Foreground)
    useEffect(() => {
        if (isSyncing) return;

        const handleNotificationResponse = (response) => {
            const data = response.notification.request.content.data;
            console.log("🔔 Notification Data Payload:", JSON.stringify(data));

            const targetId = data?.postId || data?.body?.postId || data?.id;
            const type = data?.type;

            if (targetId) {
                console.log("🚀 Navigating to Post ID:", targetId);
                router.push({
                    pathname: "/post/[id]",
                    params: { id: targetId }
                });
            } else if (type === "open_diary") {
                console.log("📓 Navigating to Author Diary");
                router.push("/authordiary");
            }
        };

        // Check if the app was opened by a notification (Cold Start)
        Notifications.getLastNotificationResponseAsync().then(response => {
            if (response) {
                handleNotificationResponse(response);
            }
        });

        // Listen for interactions while app is open/backgrounded
        const responseSub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

        return () => responseSub.remove();
    }, [isSyncing]);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded || isSyncing) {
        return <AnimeLoading message="Loading Page" subMessage="Syncing Account" />
    }

    return (
        <View key={colorScheme} className="flex-1 bg-white dark:bg-gray-900">
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={isDark ? "#0a0a0a" : "#ffffff"}
            />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: isDark ? "#0a0a0a" : "#ffffff" },
                }}
                onStateChange={() => {
                    setTimeout(() => {
                        DeviceEventEmitter.emit("tryShowInterstitial");
                    }, 500);
                }}
            />
            <Toast />
        </View>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <UserProvider>
                <StreakProvider>
                    <RootLayoutContent />
                </StreakProvider>
            </UserProvider>
        </SafeAreaProvider>
    );
}
