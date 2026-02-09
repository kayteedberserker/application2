import { useColorScheme } from "nativewind";
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Dimensions, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PostsViewer from "./../../components/PostViewer";
import { Text } from "./../../components/Text";
import CategoryPage from "./categories/[id]";

const { width } = Dimensions.get('window');

const CHANNELS = [
    { id: 'all', title: 'Global', type: 'feed' },
    { id: 'news', title: 'News', type: 'category' },
    { id: 'memes', title: 'Memes', type: 'category' },
    { id: 'polls', title: 'Polls', type: 'category' },
    { id: 'review', title: 'Review', type: 'category' },
    { id: 'gaming', title: 'Gaming', type: 'category' },
];

// 🔹 Optimization: Separate Component to prevent parent re-renders
const Scene = memo(({ item, index, activeIndex }) => {
    // Only render the component if it's the active one or the immediate neighbor (pre-loading)
    const shouldRender = Math.abs(index - activeIndex) <= 1;

    return (
        <View style={{ width, flex: 1 }}>
            {shouldRender ? (
                item.type === 'feed' ? (
                    <PostsViewer />
                ) : (
                    <CategoryPage forcedId={item.id} />
                )
            ) : (
                // Placeholder to keep the list layout stable without heavy logic
                <View className="flex-1 items-center justify-center">
                    <View className="w-10 h-10 border-2 border-blue-600/20 rounded-full" />
                </View>
            )}
        </View>
    );
});

export default function HomePage() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener("scrollToIndex", (index) => {
            flatListRef.current?.scrollToIndex({ index, animated: true });
        });
        return () => sub.remove();
    }, []);

    const renderItem = ({ item, index }) => (
        <Scene item={item} index={index} activeIndex={activeIndex} />
    );

    return (
        <View className={`flex-1 ${isDark ? "bg-[#050505]" : "bg-white"}`}>
            <View 
                pointerEvents="none"
                className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" 
            />

            <FlatList
                ref={flatListRef}
                data={CHANNELS}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveIndex(index);
                    DeviceEventEmitter.emit("pageSwiped", index);
                }}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                // 🔹 Performance Settings
                removeClippedSubviews={true} 
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2} 
                scrollEventThrottle={16}
                decelerationRate="fast"
            />

            <View 
                className="absolute left-6 flex-row items-center gap-2"
                style={{ bottom: insets.bottom + 5, opacity: 0.3 }}
                pointerEvents="none"
            >
                <View className="h-1 w-1 rounded-full bg-blue-600" />
                <Text className="text-[8px] font-[900] uppercase tracking-[0.5em] text-blue-600">
                    Neural_Link // {CHANNELS[activeIndex].title.toUpperCase()}_SECTOR
                </Text>
            </View>
        </View>
    );
}