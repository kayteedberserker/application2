import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter, usePathname } from "expo-router"; // 🔹 Added useRouter/usePathname
import { useColorScheme as useNativeWind } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
	Animated,
	DeviceEventEmitter,
	Image,
	Linking,
	StatusBar,
	TouchableOpacity,
	useColorScheme as useSystemScheme,
	View,
	BackHandler // 🔹 Added BackHandler
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AnimeLoading from "../../components/AnimeLoading";
import UpdateHandler from "../../components/UpdateModal";
import { useUser } from "../../context/UserContext";
import "../globals.css";
import CategoryNav from "./../../components/CategoryNav";
import TopBar from "./../../components/Topbar";

export default function MainLayout() {
	const router = useRouter();
	const pathname = usePathname();
	const { colorScheme, setColorScheme } = useNativeWind();
	const systemScheme = useSystemScheme(); 

	const [lastOffset, setLastOffset] = useState(0);
	const [isNavVisible, setIsNavVisible] = useState(true);
	const [showTop, setShowTop] = useState(false);
	
	// 🔹 Track active category index for back button logic
	const activeCategoryIndex = useRef(0);

	const navY = useRef(new Animated.Value(0)).current;
	const { user, contextLoading } = useUser();

	useEffect(() => {
		if (user?.deviceId) {
			const updateActivity = async () => {
				try {
					await fetch("https://oreblogda.com/api/mobile/app-open", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ deviceId: user.deviceId }),
					});
				} catch (err) {}
			};
			updateActivity();
		}
	}, [user?.deviceId]);

	// ✅ Sync system theme → NativeWind
	useEffect(() => {
		if (systemScheme) {
			setColorScheme(systemScheme);
		}
	}, [systemScheme]);

	// 🔹 Listen for category changes to update our back-button reference
	useEffect(() => {
		const sub = DeviceEventEmitter.addListener("categoryChanged", (index) => {
			activeCategoryIndex.current = index;
		});
		return () => sub.remove();
	}, []);

	// 🔹 HARDWARE BACK BUTTON LOGIC
	useEffect(() => {
		const onBackPress = () => {
			// If we are on the Home tab but NOT on the first category (Home index 0)
			if (pathname === "/" && activeCategoryIndex.current !== 0) {
				DeviceEventEmitter.emit("jumpToCategory", "Home");
				return true; // Prevents app exit
			}
			return false; // Default behavior (exit or go back in stack)
		};

		BackHandler.addEventListener("hardwareBackPress", onBackPress);
		return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
	}, [pathname]);

	// Scroll listener
	useEffect(() => {
		const subscription = DeviceEventEmitter.addListener("onScroll", (offsetY) => {
			setShowTop(offsetY > 400);

			if (offsetY < lastOffset || offsetY < 50) {
				if (!isNavVisible) {
					setIsNavVisible(true);
					Animated.timing(navY, {
						toValue: 0,
						duration: 200,
						useNativeDriver: true,
					}).start();
				}
			} else if (offsetY > lastOffset && offsetY > 100) {
				if (isNavVisible) {
					setIsNavVisible(false);
					Animated.timing(navY, {
						toValue: -70,
						duration: 200,
						useNativeDriver: true,
					}).start();
				}
			}
			setLastOffset(offsetY);
		});
		return () => subscription.remove();
	}, [lastOffset, isNavVisible]);

	if (!contextLoading && !user) {
		return <Redirect href="/screens/FirstLaunchScreen" />;
	}

	if (contextLoading) {
		return <AnimeLoading message="Loading Page" subMessage="Syncing Account" />;
	}

	const insets = useSafeAreaInsets();
	const isDark = colorScheme === "dark";
	const handleBackToTop = () => DeviceEventEmitter.emit("doScrollToTop");

	return (
		<>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
			
			<SafeAreaView style={{ zIndex: 100, maxHeight: 130 }}>
				<TopBar isDark={isDark} />
				<Animated.View style={{ transform: [{ translateY: navY }], zIndex: 10 }}>
					<CategoryNav isDark={isDark} />
				</Animated.View>
			</SafeAreaView>

			<UpdateHandler />

            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#60a5fa",
                    tabBarInactiveTintColor: isDark ? "#94a3b8" : "#64748b",
                    tabBarShowLabel: true, 
                    tabBarLabelStyle: {
                        fontSize: 9,
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                    },
                    tabBarStyle: {
                        position: "absolute",
                        bottom: insets.bottom + 15,
                        height: 60, 
                        transform: [{ translateX: '15%' }], 
                        width: "70%",
                        alignSelf: "center",
                        borderRadius: 25,
                        backgroundColor: isDark ? "#111111" : "#ffffff",
                        borderTopWidth: 0,
                        borderWidth: isDark ? 1 : 0,
                        borderColor: "#1e293b",
                        paddingTop: 2,
                        elevation: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 5,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="authordiary"
                    options={{
                        title: "Ore Diary",
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen name="post/[id]" options={{ href: null }} />
                <Tabs.Screen name="author/[id]" options={{ href: null }} />
                <Tabs.Screen name="categories/[id]" options={{ href: null }} />
            </Tabs>

			<View style={{ position: "absolute", bottom: insets.bottom + 20, right: 20, gap: 12, alignItems: "center", zIndex: 1000 }}>
				{showTop && (
					<TouchableOpacity
						onPress={handleBackToTop}
						activeOpacity={0.7}
						style={{
							width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center",
							backgroundColor: "#111111", borderWidth: 1.5, borderColor: "#1e293b", elevation: 5,
						}}
					>
						<Ionicons name="chevron-up" size={24} color="#3b82f6" />
					</TouchableOpacity>
				)}

				<TouchableOpacity
					onPress={() => Linking.openURL("https://whatsapp.com/channel/0029VbBkiupCRs1wXFWtDG3N")}
					activeOpacity={0.8}
					style={{ elevation: 8, shadowColor: "#22c55e", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
				>
					<Image
						source={require("../../assets/images/whatsapp.png")}
						style={{ width: 52, height: 52, borderRadius: 18, borderWidth: 2, borderColor: "#111111" }}
					/>
				</TouchableOpacity>
			</View>
		</>
	);
}
