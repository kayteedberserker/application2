import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState, useRef, useMemo } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Pressable,
	Animated as RNAnimated,
	ScrollView,
	TextInput,
	View,
	Platform,
	PanResponder,
	Keyboard,
	KeyboardAvoidingView,
	Share,
	Linking,
	StyleSheet
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
	FadeIn,
	FadeOut,
} from "react-native-reanimated";
import useSWR from "swr";
import { useUser } from "../context/UserContext";
import { Text } from "./Text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_URL = "https://oreblogda.com";

// --- Helper: Flatten the Deep Tree for Display ---
const flattenReplies = (nodes) => {
	let flatList = [];
	const traverse = (items) => {
		if (!items) return;
		items.forEach(item => {
			flatList.push(item);
			if (item.replies && item.replies.length > 0) {
				traverse(item.replies);
			}
		});
	};
	traverse(nodes);
	return flatList.sort((a, b) => new Date(a.date) - new Date(b.date));
};

// --- Skeleton Component ---
const CommentSkeleton = () => {
	const opacity = useRef(new RNAnimated.Value(0.3)).current;
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
			<RNAnimated.View style={{ opacity }} className="h-4 w-full bg-gray-100 dark:border-gray-800 rounded-md mb-1" />
		</View>
	);
};

// --- Single Comment Component ---
const SingleComment = ({ comment, onOpenDiscussion }) => {
	const countReplies = (nodes) => {
		let count = 0;
		if (!nodes) return 0;
		nodes.forEach(n => {
			count++;
			if (n.replies) count += countReplies(n.replies);
		});
		return count;
	};
	
	const totalReplies = countReplies(comment.replies);
	const hasReplies = totalReplies > 0;
	const previewReply = comment.replies && comment.replies.length > 0 ? comment.replies[0] : null;

	return (
		<View className="mb-6 border-l-2 border-blue-600/20 pl-4">
			<Text className="text-[11px] font-black text-blue-600 uppercase tracking-tighter">{comment.name}</Text>
			<Text className="text-xs text-gray-600 dark:text-gray-300 font-bold leading-5 mt-1">{comment.text}</Text>
			<View className="flex-row items-center mt-3 gap-4">
				<Text className="text-gray-400 text-[8px] font-bold">{new Date(comment.date).toLocaleDateString()}</Text>
				<Pressable 
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onOpenDiscussion(comment);
					}} 
					className="flex-row items-center bg-blue-600/10 px-3 py-1.5 rounded-full border border-blue-600/20"
				>
					<Ionicons name="chatbubbles-outline" size={12} color="#2563eb" />
					<Text className="text-blue-600 text-[9px] font-black uppercase ml-1.5 tracking-widest">
						{hasReplies ? `View Discussion (${totalReplies})` : "Start Discussion"}
					</Text>
				</Pressable>
			</View>
			{hasReplies && previewReply && (
				<View className="mt-3 opacity-50 bg-gray-50 dark:bg-white/5 p-2 rounded-lg border-l border-gray-300 dark:border-gray-700">
					<Text className="text-[9px] font-black text-gray-500 uppercase">{previewReply.name}</Text>
					<Text className="text-[10px] text-gray-500 font-bold" numberOfLines={1}>{previewReply.text}</Text>
				</View>
			)}
		</View>
	);
};

// --- Discussion Drawer Component (FULL SCREEN OVERLAY) ---
const DiscussionDrawer = ({ visible, comment, onClose, onReply, isPosting, postId }) => {
	const [replyText, setReplyText] = useState("");
	const panY = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;
	const scrollViewRef = useRef(null);
	const scrollOffset = useRef(0);

	const displayComments = useMemo(() => {
		if (!comment) return [];
		return flattenReplies(comment.replies);
	}, [comment]);

	useEffect(() => {
		if (visible) {
			RNAnimated.spring(panY, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }).start();
		} else {
			RNAnimated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start();
		}
	}, [visible]);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (e, gs) => gs.dy > 20 && scrollOffset.current <= 5,
			onPanResponderMove: (e, gs) => { if (gs.dy > 0) panY.setValue(gs.dy); },
			onPanResponderRelease: (e, gs) => {
				if (gs.dy > 200 || gs.vy > 0.5) {
					RNAnimated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(onClose);
				} else {
					RNAnimated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
				}
			},
		})
	).current;

	const handleShare = async () => {
		if (!comment) return;
		try {
			await Share.share({
				message: `Join this discussion on OreBlogda: ${API_URL}/posts/${postId}?discussion=${comment._id}`,
			});
		} catch (error) {
			console.log(error.message);
		}
	};

	if (!comment && !visible) return null;

	return (
		<RNAnimated.View 
			style={[
				StyleSheet.absoluteFill, 
				{ 
					zIndex: 9999, 
					backgroundColor: '#000',
					transform: [{ translateY: panY }],
					height: SCREEN_HEIGHT,
					width: SCREEN_WIDTH,
					position: 'absolute',
					top: 0,
					left: 0
				}
			]}
		>
			<KeyboardAvoidingView 
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				{/* Header Area */}
				<View className="bg-white dark:bg-[#0a0a0a] pt-12 pb-4 px-6 border-b border-gray-100 dark:border-gray-800">
					<View className="flex-row items-center justify-between mb-4">
						<Pressable onPress={onClose} className="p-2 -ml-2">
							<Ionicons name="chevron-down" size={28} color="#2563eb" />
						</Pressable>
						<View {...panResponder.panHandlers} className="flex-1 items-center">
							<View className="w-10 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
						</View>
						<View className="w-10" /> 
					</View>
					
					<Text className="text-xl font-black dark:text-white uppercase tracking-tighter">Discussion</Text>
				</View>

				{/* INPUT AT TOP (To avoid keyboard blocking issues) */}
				<View className="p-5 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-gray-800">
					<View className="flex-row gap-3 items-center">
						<TextInput
							placeholder="TYPE YOUR MESSAGE..."
							placeholderTextColor="#6b7280"
							multiline
							className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-[14px] font-black dark:text-white max-h-24 border border-gray-100 dark:border-gray-800"
							value={replyText}
							onChangeText={setReplyText}
						/>
						<Pressable
							onPress={() => {
								if (replyText.trim() && !isPosting) {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									onReply(comment._id, replyText);
									setReplyText("");
									Keyboard.dismiss();
								}
							}}
							disabled={isPosting}
							className="bg-blue-600 w-12 h-12 rounded-xl items-center justify-center"
						>
							{isPosting ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
						</Pressable>
					</View>
				</View>

				<ScrollView 
					ref={scrollViewRef} 
					className="flex-1 bg-white dark:bg-[#0a0a0a]" 
					onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
				>
					{/* Original Comment (Anchor) */}
					<View className="px-6 py-6 border-b border-gray-50 dark:border-gray-900">
						<Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Original Signal</Text>
						<Text className="text-sm font-black dark:text-white">{comment?.name}</Text>
						<Text className="text-xs text-gray-600 dark:text-gray-400 font-bold mt-1 leading-5">{comment?.text}</Text>
					</View>

					{/* Reply List */}
					<View className="px-6 pt-6">
						{displayComments.map((reply, idx) => (
							<View key={reply._id || idx} className="mb-6 border-l-2 border-blue-500/30 pl-4">
								<Text className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{reply.name}</Text>
								<Text className="text-xs text-gray-600 dark:text-gray-300 font-bold mt-1 leading-5">{reply.text}</Text>
								<Text className="text-[8px] font-bold text-gray-400 uppercase mt-2">{new Date(reply.date).toLocaleTimeString()}</Text>
							</View>
						))}
						
						{/* BIG SHARE BUTTON AT BOTTOM OF FEED */}
						<Pressable 
							onPress={handleShare}
							className="mt-10 mb-20 flex-row items-center justify-center bg-blue-600/10 border-2 border-dashed border-blue-600/40 p-6 rounded-3xl"
						>
							<Ionicons name="share-social" size={24} color="#2563eb" />
							<Text className="ml-3 text-blue-600 font-black uppercase tracking-widest">Share Discussion</Text>
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</RNAnimated.View>
	);
};

// --- Main Comment Section ---
export default function CommentSection({ postId }) {
	const { user } = useUser();
	const [text, setText] = useState("");
	const [isPosting, setIsPosting] = useState(false);
	const [activeDiscussion, setActiveDiscussion] = useState(null);

	const loaderX = useSharedValue(-200);
	useEffect(() => {
		if (isPosting) loaderX.value = withRepeat(withTiming(200, { duration: 1500, easing: Easing.linear }), -1, false);
		else loaderX.value = -200;
	}, [isPosting]);

	const loaderStyle = useAnimatedStyle(() => ({ transform: [{ translateX: loaderX.value }] }));

	const { data, mutate, isLoading } = useSWR(
		user?.deviceId ? `${API_URL}/api/posts/${postId}/comment` : null,
		(url) => fetch(url).then(res => res.json()),
		{ refreshInterval: 5000 }
	);

	const comments = data?.comments || [];

	// --- ROBUST DEEP LINKING (Warm & Cold Starts) ---
	useEffect(() => {
		const findAndOpenDiscussion = (url) => {
			if (!url) return;
			// Match both web URLs and custom schemes
			const match = url.match(/discussion=([^&]+)/);
			if (match && match[1]) {
				const discussionId = match[1];
				const target = comments.find(c => c._id === discussionId);
				if (target) {
					setActiveDiscussion(target);
				}
			}
		};

		// Cold start check
		Linking.getInitialURL().then(findAndOpenDiscussion);

		// Warm start check (app already open)
		const subscription = Linking.addEventListener('url', (event) => {
			findAndOpenDiscussion(event.url);
		});
		
		return () => subscription.remove();
	}, [comments]);

	// Keep active discussion synced with fresh data
	useEffect(() => {
		if (activeDiscussion) {
			const updated = comments.find(c => c._id === activeDiscussion._id);
			if (updated) setActiveDiscussion(updated);
		}
	}, [comments]);

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

			if (res.ok) {
				const responseData = await res.json();
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				if (parentId) {
					mutate(); // Fetch full tree for nested updates
				} else {
					mutate({ comments: [responseData.comment, ...comments] }, false);
					setText("");
					Keyboard.dismiss();
				}
			}
		} catch (err) {
			Alert.alert("Link Failure", "Connection lost.");
		} finally {
			setIsPosting(false);
		}
	};

	return (
		<View className="bg-white/80 dark:bg-black/40 rounded-[32px] p-5 border border-gray-100 dark:border-blue-900/30 shadow-2xl mt-4">
			<View className="flex-row items-center justify-between mb-6">
				<View className="flex-row items-center gap-2">
					<View className="w-2 h-2 bg-blue-600 rounded-full" />
					<Text className="text-sm font-[900] uppercase tracking-[0.3em] text-gray-900 dark:text-white">Comms_Feed</Text>
				</View>
				<Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{comments.length} Signals</Text>
			</View>

			<View className="gap-3 mb-8">
				<TextInput
					placeholder="ENTER ENCRYPTED MESSAGE..."
					placeholderTextColor="#6b7280"
					multiline
					className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-[13px] font-black tracking-widest text-gray-900 dark:text-white min-h-[100px]"
					style={{ textAlignVertical: "top" }}
					value={text}
					onChangeText={setText}
				/>
				<Pressable
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						handlePostComment();
					}}
					disabled={isPosting}
					className="relative bg-blue-600 h-14 rounded-xl overflow-hidden justify-center items-center shadow-lg"
				>
					<View className="flex-row items-center gap-2">
						{isPosting ? <ActivityIndicator size="small" color="white" /> : <Text className="text-[13px] font-black text-white uppercase tracking-widest">Transmit Signal</Text>}
					</View>
					{isPosting && (
						<View className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
							<Animated.View className="h-full w-1/2 bg-white/60" style={loaderStyle} />
						</View>
					)}
				</Pressable>
			</View>

			<View style={{ maxHeight: 500 }}>
				<ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
					{isLoading ? (
						<View><CommentSkeleton /><CommentSkeleton /></View>
					) : comments.length > 0 ? (
						comments.map((c, i) => (
							<SingleComment key={c._id || i} comment={c} onOpenDiscussion={(comm) => setActiveDiscussion(comm)} />
						))
					) : (
						<View className="items-center justify-center py-10 opacity-40">
							<ActivityIndicator size="small" color="#6b7280" />
							<Text className="text-[15px] font-bold text-gray-500 uppercase tracking-widest text-center mt-3">
								Awaiting First Signal...
							</Text>
						</View>
					)}
				</ScrollView>
			</View>

			{/* Full Screen Overlay */}
			<DiscussionDrawer 
				visible={!!activeDiscussion}
				comment={activeDiscussion}
				onClose={() => setActiveDiscussion(null)}
				onReply={handlePostComment}
				isPosting={isPosting}
				postId={postId}
			/>
		</View>
	);
}
