import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons"; 
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useColorScheme as useNativeWind } from "nativewind"; 
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Image,
    Platform,
    Pressable,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import useSWRInfinite from "swr/infinite";
import AnimeLoading from "../../components/AnimeLoading";
import AppOnboarding from "../../components/AppOnboarding";
import { SyncLoading } from "../../components/SyncLoading";
import { Text } from "../../components/Text";
import { useUser } from "../../context/UserContext";

const { width } = Dimensions.get("window");
const API_BASE = "https://oreblogda.com/api";
const LIMIT = 5;

const fetcher = (url) => fetch(url).then((res) => res.json());

// ----------------------
// ✨ AURA UTILITY HELPER
// ----------------------
const getAuraTier = (rank) => {
    if (!rank) return { color: '#3b82f6', label: 'NEUTRAL', shadow: 'rgba(59, 130, 246, 0.3)' };
    switch (rank) {
        case 1: return { color: '#fbbf24', label: 'PROTAGONIST', shadow: 'rgba(251, 191, 36, 0.5)' };
        case 2: return { color: '#60a5fa', label: 'RIVAL', shadow: 'rgba(96, 165, 250, 0.5)' };
        case 3: return { color: '#cd7f32', label: 'SENSEI', shadow: 'rgba(205, 127, 50, 0.5)' };
        default: return { color: '#a78bfa', label: 'ELITE', shadow: 'rgba(167, 139, 250, 0.3)' };
    }
};

export default function MobileProfilePage() {
    const { user, setUser, contextLoading } = useUser();
    const { colorScheme } = useNativeWind(); 
    const isDark = colorScheme === "dark"; 
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [description, setDescription] = useState("");
    const [username, setUsername] = useState("");
    const [totalPosts, setTotalPosts] = useState(0); 
    const [isRestoringCache, setIsRestoringCache] = useState(true);
    const [showId, setShowId] = useState(false);
    const [preview, setPreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Animations
    const scanAnim = useRef(new Animated.Value(0)).current;
    const loadingAnim = useRef(new Animated.Value(0)).current;
    const auraFillAnim = useRef(new Animated.Value(0)).current; // 🔹 New Aura Fill Anim
    const [copied, setCopied] = useState(false);

    const CACHE_KEY_USER_EXTRAS = `user_profile_cache_${user?.deviceId}`;

    const copyToClipboard = async () => {
        if (user?.deviceId) {
            await Clipboard.setStringAsync(user.deviceId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
        }
    };

    // Spin Animation
    useEffect(() => {
        Animated.loop(
            Animated.timing(scanAnim, {
                toValue: 1,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    // Aura Fill Animation
    useEffect(() => {
        if (user?.weeklyAura !== undefined) {
            auraFillAnim.setValue(0);
            Animated.timing(auraFillAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.out(Easing.back(1)),
                useNativeDriver: false,
            }).start();
        }
    }, [user?.weeklyAura]);

    useEffect(() => {
        if (isUpdating) {
            Animated.loop(
                Animated.timing(loadingAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            loadingAnim.stopAnimation();
            loadingAnim.setValue(0);
        }
    }, [isUpdating]);

    const spin = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const translateX = loadingAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    // 🔹 1. INITIAL CACHE RESTORATION
    useEffect(() => {
        const loadProfileCache = async () => {
            if (!user?.deviceId) return;
            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY_USER_EXTRAS);
                if (cached) {
                    const data = JSON.parse(cached);
                    if (data.username) setUsername(data.username);
                    if (data.description) setDescription(data.description);
                    if (data.totalPosts) setTotalPosts(data.totalPosts);
                }
            } catch (e) {
                console.error("Cache load error", e);
            } finally {
                setIsRestoringCache(false);
            }
        };
        loadProfileCache();
    }, [user?.deviceId]);

    // 🔹 2. SYNC WITH DB
    useEffect(() => {
        const syncUserWithDB = async () => {
            if (!user?.deviceId) return;
            try {
                const res = await fetch(`${API_BASE}/users/me?fingerprint=${user.deviceId}`);
                const dbUser = await res.json();
                if (res.ok) {
                    setUser(dbUser);
                    setDescription(dbUser.description || "");
                    setUsername(dbUser.username || "");

                    const postRes = await fetch(`${API_BASE}/posts?author=${dbUser._id}&limit=1`);
                    const postData = await postRes.json();
                    const newTotal = postData.total || 0;
                    if (postRes.ok) {
                        setTotalPosts(newTotal);
                    }

                    await AsyncStorage.setItem(CACHE_KEY_USER_EXTRAS, JSON.stringify({
                        username: dbUser.username,
                        description: dbUser.description,
                        totalPosts: newTotal
                    }));
                }
            } catch (err) {
                console.error("Sync User Error:", err);
            }
        };
        syncUserWithDB();
    }, [user?.deviceId]);

    // 🔹 3. SWR Infinite
    const getKey = (pageIndex, previousPageData) => {
        if (!user?._id) return null;
        if (previousPageData && previousPageData.posts.length < LIMIT) return null;
        return `${API_BASE}/posts?author=${user._id}&page=${pageIndex + 1}&limit=${LIMIT}`;
    };

    const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true,
        dedupingInterval: 5000,
    });

    const posts = useMemo(() => {
        return data ? data.flatMap((page) => page.posts || []) : [];
    }, [data]);

    const isLoadingInitialData = isLoading && !data;
    const isReachingEnd = data && data[data.length - 1]?.posts.length < LIMIT;
    const isFetchingNextPage = isValidating && data && typeof data[size - 1] === "undefined";

    // Ranking Logic
    const count = totalPosts;
    const rankTitle = count > 200 ? "Master_Writer" : count > 150 ? "Elite_Writer" : count > 100 ? "Senior_Writer" : count > 50 ? "Novice_Writer" : count > 25 ? "Senior_Researcher" : "Novice_Researcher";
    const rankIcon = count > 200 ? "👑" : count > 150 ? "💎" : count > 100 ? "🔥" : count > 50 ? "⚔️" : count > 25 ? "📜" : "🛡️";
    const nextMilestone = count > 200 ? 500 : count > 150 ? 200 : count > 100 ? 150 : count > 50 ? 100 : count > 25 ? 50 : 25;
    const progress = Math.min((count / nextMilestone) * 100, 100);

    // 🔹 Aura Logic
    const auraInfo = getAuraTier(user?.previousRank);
    const weeklyAura = user?.weeklyAura || 0;
    // We treat 1000 as a "Soft Max" for visual scale, but it can go higher
    const auraProgressWidth = auraFillAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', `${Math.min((weeklyAura / 500) * 100, 100)}%`]
    });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const selected = result.assets[0];
            setPreview(selected.uri);
            setImageFile({
                uri: selected.uri,
                name: "profile.jpg",
                type: "image/jpeg",
            });
        }
    };

    const handleUpdate = async () => {
        if (!username.trim()) {
            Alert.alert("Error", "Username cannot be empty.");
            return;
        }

        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append("userId", user?._id || "");
            formData.append("fingerprint", user?.deviceId || "");
            formData.append("description", description);
            formData.append("username", username);

            if (imageFile) {
                if (Platform.OS === "web") {
                    const blob = await (await fetch(imageFile.uri)).blob();
                    formData.append("file", blob, "profile.jpg");
                } else {
                    formData.append("file", imageFile);
                }
            }

            const res = await fetch(`${API_BASE}/users/upload`, {
                method: "PUT",
                body: formData,
            });

            const result = await res.json();
            if (res.ok) {
                setUser(result.user);
                setPreview(null);
                setImageFile(null);
                Alert.alert("Success", "Character Data Updated.");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to sync changes.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = (postId) => {
        Alert.alert("Confirm Deletion", "Erase this transmission log?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    Toast.show({ type: 'info', text1: 'Processing...' });
                    try {
                        const response = await fetch(`${API_BASE}/posts/delete`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ postId, fingerprint: user?.deviceId }),
                        });
                        if (response.ok) {
                            mutate();
                            setTotalPosts(prev => prev - 1);
                            Toast.show({ type: 'success', text1: 'Deleted' });
                        }
                    } catch (err) {
                        Toast.show({ type: 'error', text1: 'Connection Error' });
                    }
                },
            },
        ]);
    };

    const listHeader = useMemo(() => (
        <View className="px-6">
            <View className="flex-row items-center gap-4 mb-10 border-b border-gray-100 dark:border-gray-800 pb-6">
                <View className="w-2 h-8 bg-blue-600" />
                <Text className="text-3xl font-black italic tracking-tighter uppercase dark:text-white">Player Profile</Text>
            </View>

            <View className="items-center mb-10">
                <View className="relative">
                    <Animated.View
                        style={{ transform: [{ rotate: spin }] }}
                        className="absolute -inset-4 border border-dashed border-blue-600/30 rounded-full"
                    />
                    <View 
                        className="absolute -inset-1 border-2 rounded-full opacity-50" 
                        style={{ borderColor: auraInfo.color }} 
                    />

                    <TouchableOpacity onPress={pickImage} className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-[#0a0a0a] bg-gray-900 shadow-2xl">
                        <Image
                            source={{ uri: preview || user?.profilePic?.url || "https://via.placeholder.com/150" }}
                            className="w-full h-full object-cover"
                        />
                        <View className="absolute inset-0 bg-black/40 items-center justify-center">
                            <Text className="text-[10px] font-black uppercase tracking-widest text-white">Change DNA</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="mt-6 items-center">
                    <Text 
                        className="text-xl font-black uppercase tracking-tighter" 
                        style={{ color: auraInfo.color }}
                    >
                        {username || user?.username || "GUEST"}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Class: {rankTitle}</Text>
                        {user?.previousRank && (
                            <View className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                <Text style={{ color: auraInfo.color, fontSize: 8, fontWeight: '900' }}>{auraInfo.label}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 🔹 NEW AURA PROGRESS SECTION */}
                <View className="mt-8 w-full px-4">
                    <View className="flex-row justify-between items-end mb-2">
                        <View className="flex-row items-center gap-2">
                            <MaterialCommunityIcons name="auto-fix" size={14} color="#a78bfa" />
                            <Text className="text-[10px] font-black uppercase tracking-widest dark:text-white">Current Weekly Aura</Text>
                        </View>
                        <Text className="text-[10px] font-mono font-bold text-purple-500">
                            {weeklyAura} PTS
                        </Text>
                    </View>
                    <View className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 p-[2px]">
                        <Animated.View
                            style={{ 
                                width: auraProgressWidth,
                                backgroundColor: auraInfo.color,
                                shadowColor: auraInfo.color,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 10,
                            }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <Text className="text-[8px] text-center text-gray-500 mt-2 uppercase font-bold tracking-widest">Resets every Sunday at Midnight</Text>
                </View>

                {/* Post EXP Progress */}
                <View className="mt-6 w-full px-4 opacity-60">
                    <View className="flex-row justify-between items-end mb-2">
                        <Text className="text-[9px] font-black uppercase tracking-widest dark:text-gray-400">Writer Level Progress</Text>
                        <Text className="text-[9px] font-mono font-bold text-gray-500">EXP: {count}/{nextMilestone}</Text>
                    </View>
                    <View className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <View style={{ width: `${progress}%` }} className="h-full bg-gray-400" />
                    </View>
                </View>
            </View>

            {/* Form Fields */}
            <View className="space-y-6">
                <View className="space-y-1">
                    <Text className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Display Name / Alias</Text>
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter alias..."
                        placeholderTextColor="#4b5563"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl text-sm font-bold dark:text-white"
                    />
                </View>

                <View className="space-y-1 mt-4">
                    <Text className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Neural Uplink</Text>
                    <View className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
                        <View className="flex-1 mr-4">
                            <Text numberOfLines={1} ellipsizeMode="middle" className={`text-xs font-bold font-mono ${showId ? 'text-gray-500' : 'text-blue-500/40'}`}>
                                {showId ? (user?.deviceId || "SEARCHING...") : "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"} 
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Pressable onPress={() => setShowId(!showId)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                                <Feather name={showId ? "eye-off" : "eye"} size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                            </Pressable>
                            <Pressable onPress={copyToClipboard} className={`p-2 rounded-xl ${copied ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                <Feather name={copied ? "check" : "copy"} size={16} color={copied ? "#22c55e" : "#3b82f6"} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View className="space-y-1 mt-4">
                    <Text className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Biography / Lore</Text>
                    <TextInput
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        className="w-full bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm font-medium dark:text-white min-h-[120px]"
                        style={{ textAlignVertical: 'top' }}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleUpdate}
                    disabled={isUpdating}
                    className="relative w-full h-14 bg-blue-600 rounded-2xl overflow-hidden items-center justify-center mt-6"
                >
                    <Text className="relative z-10 text-white font-black uppercase italic tracking-widest text-xs">
                        {isUpdating ? "Syncing Changes..." : "Update Character Data"}
                    </Text>
                    {isUpdating && <Animated.View className="absolute bottom-0 h-1 bg-white/40 w-full" style={{ transform: [{ translateX }] }} />}
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-4 mt-16 mb-8">
                <Text className="text-xl font-black uppercase tracking-tighter italic dark:text-white">Transmission Logs</Text>
                <View className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
            </View>
        </View>
    ), [user, preview, description, username, isUpdating, spin, translateX, totalPosts, copied, rankTitle, rankIcon, progress, nextMilestone, count, showId, isDark, weeklyAura]); 

    if (contextLoading || isRestoringCache) {
        return <AnimeLoading message="Syncing Profile" subMessage="Checking local cache..." />;
    }

    return (
        <View className="flex-1 bg-white dark:bg-[#0a0a0a]" style={{ paddingTop: insets.top }}>
            <AppOnboarding />
            <FlatList
                data={posts}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={listHeader}
                onEndReached={() => { if (!isReachingEnd && !isValidating) setSize(size + 1); }}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => (
                    <View className="px-6 mb-4">
                        <View className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex-row justify-between items-center">
                            <Pressable onPress={() => router.push(`/post/${item.slug || item._id}`)} className="flex-1 pr-4">
                                <Text className="font-black text-sm uppercase tracking-tight text-gray-800 dark:text-gray-200" numberOfLines={1}>{item.title || item.message}</Text>
                                <Text className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </Pressable>
                            <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-3 bg-red-500/10 rounded-xl">
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => isLoadingInitialData ? <SyncLoading /> : (
                    <View className="mx-6 p-12 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 items-center">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Empty Logs - Go Post Something!</Text>
                    </View>
                )}
                ListFooterComponent={() => <View style={{ paddingBottom: insets.bottom + 100 }}>{isFetchingNextPage && <ActivityIndicator className="py-4" color="#2563eb" />}</View>}
            />
        </View>
    );
}
