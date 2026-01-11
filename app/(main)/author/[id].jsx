import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { DeviceEventEmitter, FlatList, Image, View } from "react-native";
import AnimeLoading from "../../../components/AnimeLoading";
import PostCard from "../../../components/PostCard";
import { SyncLoading } from "../../../components/SyncLoading";
import { Text } from "../../../components/Text";

const API_BASE = "https://oreblogda.com/api"

export default function AuthorPage() {
  const { id } = useLocalSearchParams()
  const [author, setAuthor] = useState(null)
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0); // Track lifetime total from API
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("doScrollToTop", () => {
      scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [userRes, postRes] = await Promise.all([
        fetch(`${API_BASE}/users/${id}`),
        fetch(`${API_BASE}/posts?author=${id}&page=1&limit=6`),
      ]);

      const userData = await userRes.json();
      const postData = await postRes.json();

      if (userRes.ok) setAuthor(userData.user);
      if (postRes.ok) {
        setPosts(postData.posts);
        setTotalPosts(postData.total || postData.posts.length); // Initialize lifetime count
        setHasMore(postData.posts.length === 6);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (!hasMore || loading || posts.length === 0) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts?author=${id}&page=${nextPage}&limit=6`);
      const data = await res.json();
      if (res.ok && data.posts.length > 0) {
        setPosts((prev) => [...prev, ...data.posts]);
        setTotalPosts(data.total); // Keep total synced
        setPage(nextPage);
        setHasMore(data.posts.length === 6);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const ListHeader = () => {
    // Rank logic variables based on lifetime totalPosts
    const count = totalPosts;
    const rankTitle = count > 200 ? "Master_Writer" : count > 150 ? "Elite_Writer" : count > 100 ? "Senior_Writer" : count > 50 ? "Novice_Writer" : count > 25 ? "Senior_Researcher" : "Novice_Researcher";
    const rankIcon = count > 200 ? "👑" : count > 150 ? "💎" : count > 100 ? "🔥" : count > 50 ? "⚔️" : count > 25 ? "📜" : "🛡️";
    const nextMilestone = count > 200 ? 500 : count > 150 ? 200 : count > 100 ? 150 : count > 50 ? 100 : count > 25 ? 50 : 25;
    const progress = Math.min((count / nextMilestone) * 100, 100);

    return (
      <View className="px-4 pt-20 pb-6">
        {author && (
          <View 
            className="relative p-6 bg-white/40 dark:bg-black/40 border border-gray-200 dark:border-blue-900/30 overflow-hidden shadow-2xl"
            style={{ borderRadius: 32 }}
          >
            <Text className="absolute top-2 right-4 opacity-10 font-black uppercase italic text-4xl dark:text-white select-none">
              Operator
            </Text>
            
            <View className="flex-col items-center gap-6">
              <View className="relative">
                <View className="absolute inset-0 bg-blue-600 rounded-full blur-md opacity-20" />
                <Image
                  source={{ uri: author.profilePic?.url || "https://via.placeholder.com/150" }}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 shadow-xl"
                />
                <View className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-black rounded-full" />
              </View>

              <View className="items-center w-full">
                <View className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 mb-3">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-blue-600">Verified_Intel_Source</Text>
                </View>
                
                <Text className="text-4xl font-black italic tracking-tighter uppercase text-gray-900 dark:text-white text-center">
                  {author.username} - {author.lastStreak > 0 ? <Ionicons name="flame" size={30} color="#f97316"/> : <Ionicons name="flame" size={30} color="#ef4444"/>}{author.lastStreak > 0 ? `${author.lastStreak}` : "0"}
                </Text>
                
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center leading-relaxed font-medium px-4">
                  {author.description || "This operator hasn’t synchronized a bio with the central network yet."}
                </Text>

                <View className="mt-8 w-full px-2">
                  <View className="flex-row justify-between items-end mb-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">{rankIcon}</Text>
                      <View>
                        <Text className="text-[8px] font-mono uppercase tracking-[0.2em] text-blue-500/60 leading-none mb-1">Current_Class</Text>
                        <Text className="text-sm font-black uppercase tracking-tighter dark:text-white">
                          {rankTitle}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                      EXP: {count} / {count > 150 ? "MAX" : nextMilestone}
                    </Text>
                  </View>

                  <View className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-white/10">
                    <View 
                      style={{ width: `${progress}%` }}
                      className="h-full bg-blue-600 shadow-lg shadow-blue-500"
                    />
                  </View>
                  
                  <Text className="text-[8px] font-mono uppercase tracking-widest text-center mt-2 opacity-50 dark:text-gray-400">
                    System_Status: {count > 100 ? "Limit_Breaker_Active" : "Synchronizing_Archives"}
                  </Text>
                </View>
              </View>
            </View>
            
            <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600/30" />
          </View>
        )}

        <View className="flex-row items-center gap-4 mt-10 mb-4">
          <Text className="text-xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">
            Intel <Text className="text-blue-600">Archives</Text>
          </Text>
          <View className="h-[1px] flex-1 bg-blue-600/20" />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View className="px-4">
      <PostCard post={item} isFeed />
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <AnimeLoading message="Loading Author" subMessage="Fetching Author Info" />
    );
  }

  return (
    <FlatList
      ref={scrollRef}
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={
        <View className="py-10">
          {loading && <SyncLoading />}
          {!hasMore && posts.length > 0 && (
            <View className="items-center opacity-30">
              <View className="h-[1px] w-24 bg-gray-500 mb-4" />
              <Text className="text-[10px] font-mono uppercase tracking-[0.4em] dark:text-white">End_Of_Transmission</Text>
            </View>
          )}
        </View>
      }
      onEndReached={fetchMorePosts}
      onEndReachedThreshold={0.5}
      onRefresh={() => {
        setPage(1);
        fetchInitialData();
      }}
      refreshing={refreshing}
      onScroll={(e) => {
        DeviceEventEmitter.emit("onScroll", e.nativeEvent.contentOffset.y);
      }}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: 120 }}
      className="bg-white dark:bg-gray-950"
    />
  );
}
