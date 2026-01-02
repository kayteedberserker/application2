import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import useSWRInfinite from "swr/infinite";
import { useUser } from "../../context/UserContext";

const API_BASE = "https://oreblogda.com/api";
const LIMIT = 5;

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function MobileProfilePage() {
    const { user, setUser } = useUser();
    const router = useRouter();

    const [description, setDescription] = useState("");
    const [preview, setPreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // 🔹 1. Sync User Data from DB
    useEffect(() => {
        const syncUserWithDB = async () => {
            if (!user?.deviceId) return;
            try {
                const res = await fetch(`${API_BASE}/users/me?fingerprint=${user.deviceId}`);
                const dbUser = await res.json();
                if (res.ok) {
                    setUser(dbUser);
                    setDescription(dbUser.description || "");
                }
            } catch (err) {
                console.error("Sync User Error:", err);
            }
        };
        syncUserWithDB();
    }, [user?.deviceId]);

    // 🔹 2. SWR Infinite with live settings
    const getKey = (pageIndex, previousPageData) => {
        if (!user?._id) return null; // Wait for synced ID
        if (previousPageData && previousPageData.posts.length < LIMIT) return null; // End of data
        return `${API_BASE}/posts?author=${user._id}&page=${pageIndex + 1}&limit=${LIMIT}`;
    };

    const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
        refreshInterval: 10000,   // Live updates every 10s
        revalidateOnFocus: true,  // Refresh when app is opened
        dedupingInterval: 5000,   // Prevent double-calls
    });

    const posts = useMemo(() => {
        return data ? data.flatMap((page) => page.posts || []) : [];
    }, [data]);

    // 🔹 Advanced Loading Logic
    const isLoadingInitialData = isLoading && !data; 
    const isReachingEnd = data && data[data.length - 1]?.posts.length < LIMIT;
    // Only show footer spinner if we are explicitly loading a NEW page (size increased)
    const isFetchingNextPage = isValidating && data && typeof data[size - 1] === "undefined";

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
        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append("userId", user?._id || "");
            formData.append("fingerprint", user?.deviceId || "");
            formData.append("description", description);

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
                Alert.alert("Success", "Profile updated successfully!");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = (postId) => {
        Alert.alert("Confirm", "Delete this post?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await fetch(`${API_BASE}/posts/delete`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ postId, fingerprint: user?.deviceId }),
                        });
                        mutate(); // Instant refresh
                    } catch (err) {
                        Alert.alert("Error", "Failed to delete.");
                    }
                },
            },
        ]);
    };

    const listHeader = useMemo(() => (
        <View className="px-6">
            <Text className="text-2xl font-semibold dark:text-white">Edit Profile</Text>
            <View className="items-center justify-center my-8">
                <TouchableOpacity onPress={pickImage} className="relative">
                    <Image
                        source={{ uri: preview || user?.profilePic?.url || "https://via.placeholder.com/150" }}
                        style={{ width: 112, height: 112, borderRadius: 56 }}
                        className="border-2 border-blue-600 bg-gray-200"
                    />
                    <View className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full">
                        <Ionicons name="camera" size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
            <TextInput
                value={user?.username || "Guest Author"}
                editable={false}
                className="border p-3 rounded bg-gray-200 mb-4 text-gray-600"
            />
            <TextInput
                multiline
                value={description}
                onChangeText={setDescription}
                placeholder="Write a description..."
                className="border p-3 rounded h-28 bg-white mb-4"
                style={{ textAlignVertical: 'top' }}
            />
            <TouchableOpacity
                onPress={handleUpdate}
                disabled={isUpdating}
                className="bg-blue-600 p-4 rounded-lg w-full items-center"
            >
                {isUpdating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
            </TouchableOpacity>
            <Text className="text-xl font-semibold mb-4 dark:text-white mt-10">Ore Posts</Text>
        </View>
    ), [user, preview, description, isUpdating]);

    return (
            <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={listHeader}
            className="bg-white dark:bg-gray-900"
            onEndReached={() => {
                if (!isReachingEnd && !isValidating) {
                    setSize(size + 1);
                }
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
                <View className="px-6 mb-10">
                    <View className="mx-6 border border-gray-200 p-4 max-w-[80%] rounded-xl flex-row justify-between items-center bg-gray-50 dark:bg-gray-800">
                        <Pressable onPress={() => router.push(`/post/${item.slug || item._id}`)} className="flex-1 mr-4">
                            <Text className="font-medium text-lg dark:text-white" numberOfLines={1}>
                                {item.title || item.message}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                            <View className="flex-row items-center gap-4 mt-2">
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="heart-outline" size={14} color="#9ca3af" />
                                    <Text className="text-gray-500 text-xs">{item.likes?.length || 0}</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="chatbubble-outline" size={14} color="#9ca3af" />
                                    <Text className="text-gray-500 text-xs">{item.comments?.length || 0}</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="eye-outline" size={14} color="#9ca3af" />
                                    <Text className="text-gray-500 text-xs">{item.views || 0}</Text>
                                </View>
                            </View>
                        </Pressable>
                        <TouchableOpacity onPress={() => handleDelete(item._id)}>
                            <Text className="text-red-500 font-bold">Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            ListEmptyComponent={() => {
                // Shows spinner only on very first empty load
                if (isLoadingInitialData) return <ActivityIndicator className="py-10" color="#2563eb" />;
                return <Text className="text-center text-gray-400 py-10">You haven't posted yet.</Text>;
            }}
            ListFooterComponent={() => {
                // Footer spinner ONLY shows when user triggers "load more", not on background syncs
                return isFetchingNextPage ? <ActivityIndicator className="py-4" color="#2563eb" /> : null;
            }}
        />
    );
}