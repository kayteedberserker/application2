import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Pressable,
	Animated as RNAnimated,
	ScrollView,
	TextInput,
	View,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import useSWR from "swr";
import { useUser } from "../context/UserContext";
import { Text } from "./Text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_URL = "https://oreblogda.com";

// --- Skeleton Component ---
const CommentSkeleton = () => {
  const opacity = new RNAnimated.Value(0.3);

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View className="mb-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
      <RNAnimated.View style={{ opacity }} className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded-md mb-2" />
      <RNAnimated.View style={{ opacity }} className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-md mb-1" />
      <RNAnimated.View style={{ opacity }} className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded-md" />
    </View>
  );
};

// --- Single Comment ---
const SingleComment = ({ comment, onReply, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [replyText, setReplyText] = useState("");

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <View
      style={{ marginLeft: depth > 0 ? 15 : 0 }}
      className={`mb-5 border-l-2 ${depth === 0 ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800'} pl-4`}
    >
      <Text className="text-[11px] font-black text-blue-600 uppercase tracking-tighter">{comment.name}</Text>
      <Text className="text-xs text-gray-600 dark:text-gray-300 font-bold leading-5 mt-1">{comment.text}</Text>

      <View className="flex-row items-center mt-3 gap-6">
        <Text className="text-gray-400 text-[8px] font-bold">{new Date(comment.date).toLocaleDateString()}</Text>
        <Pressable onPress={() => setShowReplyInput(!showReplyInput)}>
          <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">Reply</Text>
        </Pressable>
        {hasReplies && (
          <Pressable onPress={() => setIsCollapsed(!isCollapsed)} className="flex-row items-center">
            <Ionicons name={isCollapsed ? "chevron-down" : "chevron-up"} size={12} color="#2563eb" />
            <Text className="text-gray-500 text-[10px] font-black uppercase ml-1">
              {isCollapsed ? `${comment.replies.length} Signals` : "Collapse"}
            </Text>
          </Pressable>
        )}
      </View>

      {showReplyInput && (
        <View className="mt-4 flex-row gap-2 bg-gray-50 dark:bg-gray-950 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
          <TextInput
            placeholder="WRITE REPLY..."
            placeholderTextColor="#6b7280"
            className="flex-1 p-2 text-[10px] font-black tracking-widest dark:text-white"
            value={replyText}
            autoFocus
            onChangeText={setReplyText}
          />
          <Pressable
            onPress={() => {
              if (replyText.trim()) onReply(comment._id, replyText);
              setReplyText("");
              setShowReplyInput(false);
              setIsCollapsed(false);
            }}
            className="bg-blue-600 px-4 justify-center rounded-lg"
          >
            <Text className="text-white text-[9px] font-black uppercase tracking-widest">Send</Text>
          </Pressable>
        </View>
      )}

      {!isCollapsed && hasReplies && (
        <View className="mt-4">
          {comment.replies.map((reply) => (
            <SingleComment key={reply._id} comment={reply} onReply={onReply} depth={depth + 1} />
          ))}
        </View>
      )}
    </View>
  );
};

// --- Main Comment Section ---
export default function CommentSection({ postId }) {
  const { user } = useUser();
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // --- LOADING BAR ANIMATION (Reanimated) ---
  const loaderX = useSharedValue(-200);

  useEffect(() => {
    if (isPosting) {
      loaderX.value = withRepeat(
        withTiming(200, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      loaderX.value = -200;
    }
  }, [isPosting]);

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loaderX.value }],
  }));

  // SWR with auto-refresh
  const { data, mutate, error, isLoading } = useSWR(
    user?.deviceId ? `${API_URL}/api/posts/${postId}/comment` : null,
    (url) => fetch(url).then(res => res.json()),
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  const comments = data?.comments || [];

  const handlePostComment = async (parentId = null, replyContent = null) => {
    const content = replyContent || text;
    if (!content.trim() || !user?.deviceId) return;

    setIsPosting(true);

    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.username || "Anonymous",
          text: content,
          parentCommentId: parentId,
          fingerprint: user.deviceId,
          userId: user._id || null
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        if (parentId) {
          // Reply optimistic update
          mutate({
            comments: comments.map(c => {
              if (c._id === parentId) {
                return {
                  ...c, replies: [...(c.replies || []), {
                    _id: responseData.commentId,
                    name: user.username,
                    text: content,
                    date: new Date().toISOString(),
                    replies: []
                  }]
                };
              }
              return c;
            })
          }, false);
        } else {
          // Main comment optimistic update
          mutate({
            comments: [
              ...comments,
              {
                _id: responseData.commentId,
                name: user.username,
                text: content,
                date: new Date().toISOString(),
                replies: []
              }
            ]
          }, false);
          setText("");
        }
      } else {
        Alert.alert("Transmission Error", responseData.message || "Failed to broadcast signal.");
      }
    } catch (err) {
      console.error("Comment POST error:", err);
      Alert.alert("Connection Lost", "Could not establish link to server.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View className="bg-white/80 dark:bg-black/40 rounded-[32px] p-5 border border-gray-100 dark:border-blue-900/30 shadow-2xl mt-4">

      {/* --- SECTION HEADER --- */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 bg-blue-600 rounded-full" />
          <Text className="text-sm font-[900] uppercase tracking-[0.3em] text-gray-900 dark:text-white">
            Comms_Feed
          </Text>
        </View>
        <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          {comments.length} Signals
        </Text>
      </View>

      {/* --- INPUT FORM --- */}
      <View className="gap-3 mb-6">
        <View className="relative">
          <TextInput
            placeholder="ENTER ENCRYPTED MESSAGE..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-[13px] font-black tracking-widest text-gray-900 dark:text-white min-h-[100px]"
            style={{ textAlignVertical: "top" }}
            value={text}
            onChangeText={setText}
          />
        </View>

        <Pressable
          onPress={() => handlePostComment()}
          disabled={isPosting}
          className={`relative bg-blue-600 h-14 rounded-xl overflow-hidden justify-center items-center shadow-lg ${isPosting ? "opacity-70" : "active:scale-95"}`}
          style={{ shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        >
          <View className="flex-row items-center justify-center gap-2">
            {isPosting ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-[10px] font-black text-white uppercase tracking-widest">
                  Broadcasting...
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[13px] font-black text-white uppercase tracking-widest">
                  Transmit Signal
                </Text>
                <Ionicons name="send" size={14} color="white" />
              </>
            )}
          </View>

          {/* LOADING ANIMATION BAR */}
          {isPosting && (
            <View className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
              <Animated.View
                className="h-full w-1/2 bg-white/60"
                style={loaderStyle}
              />
            </View>
          )}
        </Pressable>
      </View>

      {/* --- SCROLLABLE MESSAGES --- */}
      <View style={{ maxHeight: 400 }}>
        <ScrollView
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          className="pr-1"
        >
          {isLoading ? (
            <View>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </View>
          ) : comments.length > 0 ? (
            comments.map((c, i) => (
              <SingleComment key={c._id || i} comment={c} onReply={handlePostComment} />
            ))
          ) : (
            <View className="items-center justify-center py-10 opacity-40">
              <View className="w-8 h-8 border border-dashed border-gray-500 rounded-full items-center justify-center mb-3">
                <ActivityIndicator size="small" color="#6b7280" />
              </View>
              <Text className="text-[15px] font-bold text-gray-500 uppercase tracking-widest text-center">
                Awaiting First Signal...
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}