import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
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
	View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AnimeLoading from "../../components/AnimeLoading";
import UpdateHandler from "../../components/UpdateModal";
import { useUser } from "../../context/UserContext";
import "../globals.css";
import CategoryNav from "./../../components/CategoryNav";
import TopBar from "./../../components/Topbar";

export default function MainLayout() {
	const { colorScheme, setColorScheme } = useNativeWind();
	const systemScheme = useSystemScheme();

	const [lastOffset, setLastOffset] = useState(0);
	const [isNavVisible, setIsNavVisible] = useState(true);
	const [showTop, setShowTop] = useState(false);

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

	if (!contextLoading && !user) {
		return <Redirect href="/screens/FirstLaunchScreen" />;
	}

	if (contextLoading) {
		return <AnimeLoading message="Loading Page" subMessage="Syncing Account" />;
	}

	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (systemScheme) {
			setColorScheme(systemScheme);
		}
	}, [systemScheme]);

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

	const isDark = colorScheme === "dark";
	const handleBackToTop = () => DeviceEventEmitter.emit("doScrollToTop");

	return (
		<>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
			
			<SafeAreaView
				style={{
					zIndex: 100,
					maxHeight: 130,
				}}>
				<TopBar isDark={isDark} />
				<Animated.View
					style={{
						transform: [{ translateY: navY }],
						zIndex: 10,
					}}
				>
					<CategoryNav isDark={isDark} />
				</Animated.View>
			</SafeAreaView>
			<UpdateHandler />

            <Tabs
                // ✅ THE COMBO FIX
                initialRouteName="index" // 1. Set the anchor point
                backBehavior="history"   // 2. Allow B -> A -> Home history
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
                            <Ionicons 
                                name={focused ? "home" : "home-outline"} 
                                size={22} 
                                color={color} 
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="authordiary"
                    options={{
                        title: "Ore Diary",
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons 
                                name={focused ? "add-circle" : "add-circle-outline"} 
                                size={24} 
                                color={color} 
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons 
                                name={focused ? "person" : "person-outline"} 
                                size={22} 
                                color={color} 
                            />
                        ),
                    }}
                />

                {/* ✅ STABLE STACKING ROUTES */}
                <Tabs.Screen 
                    name="post/[id]" 
                    getId={({ params }) => params?.id} 
                    options={{ href: null }} 
                />
                <Tabs.Screen 
                    name="author/[id]" 
                    getId={({ params }) => params?.id} 
                    options={{ href: null }} 
                />
                <Tabs.Screen 
                    name="categories/[id]" 
                    getId={({ params }) => params?.id} 
                    options={{ href: null }} 
                />
            </Tabs>

			<View
				style={{
					position: "absolute",
					bottom: insets.bottom + 20,
					right: 20,
					gap: 12,
					alignItems: "center",
					zIndex: 1000,
				}}
			>
				{showTop && (
					<TouchableOpacity
						onPress={handleBackToTop}
						activeOpacity={0.7}
						style={{
							width: 48,
							height: 48,
							borderRadius: 16,
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: "#111111",
							borderWidth: 1.5,
							borderColor: "#1e293b",
							elevation: 5,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.2,
						}}
					>
						<Ionicons name="chevron-up" size={24} color="#3b82f6" />
					</TouchableOpacity>
				)}

				<TouchableOpacity
					onPress={() => Linking.openURL("https://whatsapp.com/channel/0029VbBkiupCRs1wXFWtDG3N")}
					activeOpacity={0.8}
					style={{ elevation: 8 }}
				>
					<Image
						source={require("../../assets/images/whatsapp.png")}
						style={{
							width: 52,
							height: 52,
							borderRadius: 18,
							borderWidth: 2,
							borderColor: "#111111"
						}}
					/>
				</TouchableOpacity>
			</View>
		</>
	);
}
