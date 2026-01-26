import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    StatusBar,
    ScrollView,
    useColorScheme
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; 
import { useRouter } from "expo-router";
import apiFetch from "../../utils/apiFetch";
import { Text } from "../../components/Text"; 
import Animated, { FadeInDown, FadeIn, Layout } from "react-native-reanimated";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NativeAdView, { 
  CallToActionView, 
  HeadlineView, 
  TaglineView, 
  IconView, 
  ImageView 
} from "react-native-google-mobile-ads";

// --- TEST IDS (Use these to stop crashing during dev) ---
const NATIVE_AD_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/3986624511',
  android: 'ca-app-pub-3940256099942544/2247696110', // Standard Test Native ID
});

// --- NATIVE AD: AUTHOR STYLE ---
export const NativeAdAuthorStyle = ({ isDark }) => {
  return (
    <Animated.View key="ad-author-wrap" entering={FadeInDown.duration(400)} className="mb-3">
        <NativeAdView
            style={{ width: '100%', minHeight: 100 }}
            adUnitID={NATIVE_AD_ID}
        >
            <View className={`p-4 rounded-3xl border ${isDark ? "bg-[#0f0f0f] border-zinc-800" : "bg-white border-zinc-100 shadow-sm"} flex-row items-center`}>
                <View className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5 overflow-hidden">
                    <IconView style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: '#27272a' }} />
                </View>

                <View className="flex-1 ml-4 justify-center">
                    <View className="flex-row items-center justify-between mb-1">
                        <HeadlineView 
                            numberOfLines={1} 
                            style={{ 
                                fontWeight: '900', 
                                fontStyle: 'italic', 
                                textTransform: 'uppercase', 
                                fontSize: 16, 
                                flex: 1, 
                                marginRight: 8,
                                color: isDark ? 'white' : 'black' 
                            }} 
                        />
                        <View className="bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md">
                            <Text className="text-amber-500 text-[8px] font-black uppercase tracking-widest">SPONSORED</Text>
                        </View>
                    </View>
                    <TaglineView 
                        numberOfLines={1} 
                        style={{ fontSize: 11, marginBottom: 8, color: isDark ? '#71717a' : '#a1a1aa' }} 
                    />
                    <CallToActionView 
                        className="bg-blue-600 px-3 py-1 rounded-full self-start"
                        style={{ minWidth: 80, alignItems: 'center' }}
                        textStyle={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}
                    />
                </View>
            </View>
        </NativeAdView>
    </Animated.View>
  );
};

// --- NATIVE AD: POST STYLE ---
export const NativeAdPostStyle = ({ isDark }) => {
  return (
    <Animated.View key="ad-post-wrap" entering={FadeIn.duration(500)} className="mb-5">
        <NativeAdView
            style={{ width: '100%', minHeight: 300 }}
            adUnitID={NATIVE_AD_ID}
        >
            <View className={`rounded-[2.5rem] border overflow-hidden ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-100 shadow-sm"}`}>
                <ImageView style={{ width: '100%', height: 192, backgroundColor: '#27272a' }} resizeMode="cover" />
                <View className="p-5">
                    <HeadlineView style={{ fontWeight: '900', fontSize: 20, marginBottom: 8, color: isDark ? 'white' : 'black' }} />
                    <TaglineView style={{ color: isDark ? '#a1a1aa' : '#71717a', fontSize: 12, marginBottom: 20 }} numberOfLines={2} />
                    <CallToActionView 
                        className="bg-blue-600 px-6 py-2 rounded-full"
                        textStyle={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}
                    />
                </View>
            </View>
        </NativeAdView>
    </Animated.View>
  );
};

const resolveUserRank = (totalPosts) => {
    const count = totalPosts || 0;
    if (count >= 200) return { title: "MASTER_WRITER", icon: "👑", color: "#fbbf24" };
    if (count > 150) return { title: "ELITE_WRITER", icon: "💎", color: "#60a5fa" };
    if (count > 100) return { title: "SENIOR_WRITER", icon: "🔥", color: "#f87171" };
    if (count > 50) return { title: "NOVICE_WRITER", icon: "⚔️", color: "#a78bfa" };
    if (count > 25) return { title: "RESEACHER_SR", icon: "📜", color: "#34d399" };
    return { title: "RESEACHER_JR", icon: "🛡️", color: "#94a3b8" };
};

const AuthorCard = ({ author, isDark }) => {
    const router = useRouter();
    const getAuraVisuals = (rank) => {
        if (!rank || rank > 10 || rank <= 0) return { color: isDark ? '#1e293b' : '#cbd5e1', label: 'OPERATIVE', icon: 'target' };
        const mapping = {
            1: { color: '#fbbf24', label: 'MONARCH', icon: 'crown' },
            2: { color: '#ef4444', label: 'YONKO', icon: 'flare' },
            3: { color: '#a855f7', label: 'KAGE', icon: 'moon-waxing-crescent' },
            4: { color: '#3b82f6', label: 'SHOGUN', icon: 'shield-star' },
            5: { color: '#e0f2fe', label: 'ESPADA 0', icon: 'skull' },
            6: { color: '#cbd5e1', label: 'ESPADA 1', icon: 'sword-cross' },
            7: { color: '#94a3b8', label: 'ESPADA 2', icon: 'sword-cross' },
            8: { color: '#64748b', label: 'ESPADA 3', icon: 'sword-cross' },
            9: { color: '#475569', label: 'ESPADA 4', icon: 'sword-cross' },
            10: { color: '#334155', label: 'ESPADA 5', icon: 'sword-cross' },
        };
        return mapping[rank] || { color: '#1e293b', label: 'OPERATIVE', icon: 'target' };
    };

    const tier = getAuraVisuals(author.previousRank);
    const writerRank = resolveUserRank(author.postsCount);

    return (
        <Animated.View entering={FadeInDown.duration(400)} layout={Layout.springify()}>
            <TouchableOpacity
                onPress={() => router.push(`/author/${author._id}`)}
                className={`mb-3 p-4 rounded-3xl border ${isDark ? "bg-[#0f0f0f] border-zinc-800" : "bg-white border-zinc-100 shadow-sm"}`}
            >
                <View className="flex-row items-center">
                    <View style={{ borderColor: tier.color }} className="w-16 h-16 rounded-full border-2 p-0.5">
                        <Image
                            source={{ uri: author.profilePic?.url || "https://oreblogda.com/default-avatar.png" }}
                            className="w-full h-full rounded-full bg-zinc-200 dark:bg-zinc-800"
                        />
                    </View>
                    <View className="flex-1 ml-4 justify-center">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text numberOfLines={1} className={`font-black italic uppercase text-lg ${isDark ? 'text-white' : 'text-black'}`}>{author.username}</Text>
                            <View style={{ backgroundColor: `${tier.color}20`, borderColor: `${tier.color}40` }} className="px-2 py-0.5 rounded-md border flex-row items-center gap-1">
                                <MaterialCommunityIcons name={tier.icon} size={8} color={tier.color} />
                                <Text style={{ color: tier.color }} className="text-[8px] font-black uppercase">{tier.label}</Text>
                            </View>
                        </View>
                        <Text className="text-[10px] font-black italic mb-1" style={{ color: writerRank.color }}>{writerRank.icon} {writerRank.title}</Text>
                        <Text numberOfLines={1} className={`text-[11px] font-medium italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{author.description || "No bio decrypted yet..."}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const PostSearchCard = ({ item, isDark }) => {
    const router = useRouter();
    return (
        <Animated.View entering={FadeIn.duration(500)} layout={Layout.springify()}>
            <TouchableOpacity 
                onPress={() => router.push(`/post/${item._id}`)}
                className={`mb-5 rounded-[2.5rem] border overflow-hidden ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-100 shadow-sm"}`}
            >
                {item.mediaUrl ? <Image source={{ uri: item.mediaUrl }} className="w-full h-48 bg-zinc-800" resizeMode="cover" /> : <View className="w-full h-2 bg-blue-600" />}
                <View className="p-5">
                    <Text className={`font-black text-xl mb-2 leading-tight ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</Text>
                    <Text className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} text-xs italic`} numberOfLines={2}>{item.message}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const SearchScreen = () => {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ authors: [], posts: [] });
    const [activeTab, setActiveTab] = useState("all");
    const [recentSearches, setRecentSearches] = useState([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        AsyncStorage.getItem('recent_searches').then(saved => saved && setRecentSearches(JSON.parse(saved)));
    }, []);

    const performSearch = useCallback(async (text, pageNum = 1) => {
        if (text.length < 2) return setResults({ authors: [], posts: [] });
        if (pageNum === 1) setLoading(true);
        try {
            const response = await apiFetch(`https://oreblogda.com/api/search?q=${encodeURIComponent(text)}&page=${pageNum}&limit=10`);
            const data = await response.json();
            if (response.ok) {
                setResults(data);
                if (pageNum === 1) {
                    const updated = [text, ...recentSearches.filter(s => s !== text)].slice(0, 5);
                    setRecentSearches(updated);
                    AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
                }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [recentSearches]);

    useEffect(() => {
        const timer = setTimeout(() => performSearch(query, 1), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const listData = useMemo(() => {
        const raw = [
            ...(activeTab === 'all' || activeTab === 'authors' ? results.authors || [] : []),
            ...(activeTab === 'all' || activeTab === 'posts' ? results.posts || [] : [])
        ];
        const processed = [];
        raw.forEach((item, index) => {
            processed.push(item);
            if ((index + 1) % 4 === 0) {
                processed.push({ _id: `ad-${index}-${activeTab}`, isAd: true, adType: index % 2 === 0 ? 'author' : 'post' });
            }
        });
        return processed;
    }, [results, activeTab]);

    return (
        <SafeAreaView className={`flex-1 ${isDark ? "bg-[#050505]" : "bg-white"}`}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View className="px-4 py-3 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="pr-3">
                    <Ionicons name="chevron-back" size={32} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
                <TextInput
                    placeholder="SCAN_DATA_STREAM..."
                    placeholderTextColor={isDark ? "#3f3f46" : "#a1a1aa"}
                    className={`flex-1 h-14 px-4 rounded-2xl border ${isDark ? 'bg-zinc-900 border-blue-900/30 text-white' : 'bg-gray-100 border-gray-200 text-black'} font-bold`}
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color="#2563eb" size="large" />
                </View>
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => {
                        if (item.isAd) return item.adType === 'author' ? <NativeAdAuthorStyle isDark={isDark} /> : <NativeAdPostStyle isDark={isDark} />;
                        return item.username ? <AuthorCard author={item} isDark={isDark} /> : <PostSearchCard item={item} isDark={isDark} />;
                    }}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={() => query.length > 1 && <Text className="text-center text-zinc-500 mt-10">No results found.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

export default SearchScreen;
