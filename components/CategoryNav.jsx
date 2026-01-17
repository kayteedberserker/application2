import { usePathname, useRouter } from "expo-router";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Text } from "./Text";

const categories = ["News", "Memes", "Polls", "Review", "Gaming"];

export default function CategoryNav({ isDark }) {
    // Keep your original functions and hooks
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View 
            className={`shadow-sm ${isDark ? "bg-black/40" : "bg-white/40"}`} 
            style={{ 
                height: 55,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "rgba(30, 58, 138, 0.3)" : "rgba(229, 231, 235, 1)",
            }}
        >
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                // Keep your original props for Android touch stability
                contentContainerStyle={{ 
                    paddingHorizontal: 3, 
                    alignItems: 'center',
                    height: '100%' 
                }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                renderItem={({ item }) => {
                    // Keep your original logic
                    const catSlug = item.toLowerCase().replace("/", "-");
                    const isActive = pathname.includes(catSlug);
                    const displayName = item === "Videos/Edits" ? "Videos" : item;

                    return (
                        <TouchableOpacity
                            onPress={() => router.push(`/categories/${catSlug}`)}
                            activeOpacity={0.7}
                            style={{ marginRight: 8 }}
                            className={`px-4 py-2 rounded-lg relative ${
                                isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-800/80"
                            }`}
                        >
                            <Text 
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                    isActive ? "text-white" : "text-gray-800 dark:text-gray-400"
                                }`}
                            >
                                {displayName}
                            </Text>

                            {/* Tactical Corners - Only for Active (Visual UI) */}
                            {isActive && (
                                <>
                                    <View style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 4, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'white' }} />
                                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 4, height: 4, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'white' }} />
                                </>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}
