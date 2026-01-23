import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import apiFetch from "../../utils/apiFetch";
import { Text } from "../../components/Text"; 
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

// --- AUTHOR CARD COMPONENT ---
const AuthorCard = ({ author, isDark }) => {
    const router = useRouter();
    
    // Logic for Ranks & Aura Colors
    const getAuraTier = (rank) => {
        if (!rank || rank > 10 || rank <= 0) return { color: '#3b82f6', label: 'OPERATIVE' };

        switch (rank) {
            case 1: return { color: '#fbbf24', label: 'MONARCH' }; 
            case 2: return { color: '#ef4444', label: 'YONKO' };   
            case 3: return { color: '#a855f7', label: 'KAGE' };    
            case 4: return { color: '#3b82f6', label: 'SHOGUN' };  
            case 5: return { color: '#ffffff', label: 'ESPADA 0' }; 
            case 6: 
            case 7: 
            case 8: 
            case 9: 
            case 10: return { color: '#e5e7eb', label: `ESPADA ${rank - 5}` };
            default: return { color: '#94a3b8', label: 'OPERATIVE' };
        }
    };

    const tier = getAuraTier(author.previousRank);

    return (
        <Animated.View entering={FadeInDown.duration(400)}>
            <TouchableOpacity
                onPress={() => router.push(`/author/${author._id}`)}
                className={`mb-3 p-3 rounded-2xl border ${
                    isDark ? "bg-[#0a0a0a] border-zinc-800" : "bg-white border-zinc-100 shadow-sm"
                }`}
            >
                <View className="flex-row items-center">
                    {/* Profile Pic with Tier Ring */}
                    <View 
                        style={{ borderColor: tier.color }}
                        className="w-14 h-14 rounded-full border-2 p-0.5 shadow-lg"
                    >
                        <Image
                            source={{ uri: author.profilePic?.url || "https://oreblogda.com/default-avatar.png" }}
                            className="w-full h-full rounded-full bg-zinc-800"
                        />
                    </View>

                    <View className="flex-1 ml-3">
                        <View className="flex-row items-center justify-between">
                            <Text className={`font-black italic uppercase tracking-tighter text-base ${isDark ? 'text-white' : 'text-black'}`}>
                                {author.username}
                            </Text>
                            {/* Rank Badge */}
                            <View style={{ backgroundColor: `${tier.color}20` }} className="px-2 py-0.5 rounded-md border" style={{ borderColor: `${tier.color}40`, backgroundColor: `${tier.color}10` }}>
                                <Text style={{ color: tier.color }} className="text-[8px] font-black uppercase tracking-widest">
                                    {tier.label}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Row - Compact & Otaku Style */}
                        <View className="flex-row items-center mt-2 justify-between pr-2">
                            <View className="flex-row items-center gap-3">
                                <View className="flex-row items-center">
                                    <Ionicons name="flame" size={12} color="#f97316" />
                                    <Text className="text-[10px] font-bold ml-1 text-zinc-400">{author.streak || 0}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons name="document-text-outline" size={12} color="#3b82f6" />
                                    <Text className="text-[10px] font-bold ml-1 text-zinc-400">{author.postsCount || 0}</Text>
                                </View>
                            </View>
                            
                            <View className="flex-row items-center bg-zinc-800/50 px-2 py-0.5 rounded-full">
                                <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                                    Aura: <Text className="text-blue-400">{author.aura || 0}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- MAIN SEARCH SCREEN ---
const SearchScreen = () => {
    const router = useRouter();
    const isDark = true; 
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ authors: [], posts: [] });
    const [activeTab, setActiveTab] = useState("all");

    const performSearch = useCallback(async (text) => {
        if (text.length < 2) {
            setResults({ authors: [], posts: [] });
            return;
        }

        setLoading(true);
        try {
            const response = await apiFetch(`https://oreblogda.com/api/search?q=${encodeURIComponent(text)}`);
            const data = await response.json();
            
            if (response.ok) {
                setResults({
                    authors: data.users || [],
                    posts: data.posts || []
                });
            }
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            performSearch(query);
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [query, performSearch]);

    const renderItem = ({ item }) => {
        if (item.username) {
            return <AuthorCard author={item} isDark={isDark} />;
        }
        return (
            <Animated.View entering={FadeIn.duration(400)}>
                <TouchableOpacity 
                    onPress={() => router.push(`/post/${item._id}`)}
                    className={`mb-3 p-4 rounded-2xl border ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-gray-50 border-gray-100"}`}
                >
                    <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em]">{item.category}</Text>
                        <Text className="text-zinc-600 text-[8px] font-mono">ID_{item._id.slice(-5).toUpperCase()}</Text>
                    </View>
                    <Text className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</Text>
                    <Text className="text-zinc-500 text-xs italic" numberOfLines={2}>{item.message}</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? "bg-[#050505]" : "bg-white"}`}>
            {/* Header / Search Input */}
            <View className="px-4 py-3 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="pr-3">
                    <Ionicons name="chevron-back" size={28} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
                
                <View className={`flex-1 flex-row items-center px-4 h-12 rounded-2xl border ${isDark ? 'bg-zinc-900 border-blue-900/30' : 'bg-gray-100 border-gray-200'}`}>
                    <Ionicons name="search" size={20} color={isDark ? "#3b82f6" : "#71717a"} />
                    <TextInput
                        placeholder="SCAN_NEURAL_ARCHIVES..."
                        placeholderTextColor={isDark ? "#3f3f46" : "#a1a1aa"}
                        className={`flex-1 ml-3 font-bold text-sm tracking-widest ${isDark ? 'text-white' : 'text-black'}`}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#71717a" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-4 py-2 gap-2">
                {['all', 'authors', 'posts'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`px-5 py-1.5 rounded-xl border ${
                            activeTab === tab 
                            ? "bg-blue-600 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                            : isDark ? "bg-transparent border-zinc-800" : "bg-transparent border-gray-200"
                        }`}
                    >
                        <Text className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            activeTab === tab ? "text-white" : "text-zinc-600"
                        }`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Results List */}
            <View className="flex-1 px-4 mt-2">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#2563eb" size="large" />
                        <Text className="text-blue-500 text-[10px] font-black mt-6 tracking-[0.4em] uppercase">
                            Establishing_Neural_Link...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={[
                            ...(activeTab === 'all' || activeTab === 'authors' ? results.authors : []),
                            ...(activeTab === 'all' || activeTab === 'posts' ? results.posts : [])
                        ]}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        ListEmptyComponent={() => (
                            <View className="mt-20 items-center opacity-40">
                                <Ionicons name="barcode-outline" size={60} color={isDark ? "#3f3f46" : "#e5e7eb"} />
                                <Text className="text-zinc-500 font-black mt-4 text-center tracking-widest uppercase text-xs px-10">
                                    {query.length < 2 ? "Awaiting input for data retrieval..." : "No matches found in the current sector."}
                                </Text>
                            </View>
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default SearchScreen;
