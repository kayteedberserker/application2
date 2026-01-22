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

// --- Discussion Drawer Component (Now a Full Overlay View) ---
const DiscussionDrawer = ({ visible, comment, onClose, onReply, isPosting, postId }) => {
	const [replyText, setReplyText] = useState("");
	const [showNewMessageToast, setShowNewMessageToast] = useState(false);
	const panY = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;
	const scrollViewRef = useRef(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
	const scrollOffset = useRef(0);

	const displayComments = useMemo(() => {
		if (!comment) return [];
		return flattenReplies(comment.replies);
	}, [comment]);

	useEffect(() => {
		if (visible) {
			RNAnimated.spring(panY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }).start();
			setShouldAutoScroll(true);
			setShowNewMessageToast(false);
		} else {
			RNAnimated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start();
		}
	}, [visible]);

	useEffect(() => {
		if (visible && displayComments.length > 0 && !shouldAutoScroll && scrollOffset.current > 100) {
			setShowNewMessageToast(true);
		}
	}, [displayComments.length, visible]);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (e, gs) => gs.dy > 10 && scrollOffset.current <= 5,
			onPanResponderMove: (e, gs) => { if (gs.dy > 0) panY.setValue(gs.dy); },
			onPanResponderRelease: (e, gs) => {
				if (gs.dy > 150 || gs.vy > 0.5) {
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
				message: `Join the discussion on OreBlogda: ${API_URL}/posts/${slug}?discussion=${comment._id}`,
			});
		} catch (error) {
			console.log(error.message);
		}
	};

	const jumpToBottom = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		scrollViewRef.current?.scrollToEnd({ animated: true });
		setShowNewMessageToast(false);
	};

	if (!comment && !visible) return null;

	return (
		<View style={[StyleSheet.absoluteFill, { zIndex: 1000, pointerEvents: visible ? 'auto' : 'none' }]}>
			{/* Backdrop */}
			{visible && (
				<Pressable 
					style={StyleSheet.absoluteFill} 
					onPress={() => { Keyboard.dismiss(); onClose(); }}
				>
					<Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1 bg-black/60" />
				</Pressable>
			)}

			<KeyboardAvoidingView 
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1, justifyContent: 'flex-end' }}
			>
				<RNAnimated.View 
					style={{ transform: [{ translateY: panY }], height: SCREEN_HEIGHT * 0.85 }} 
					className="bg-white dark:bg-[#0a0a0a] rounded-t-[40px] border-t-2 border-blue-600/40 overflow-hidden"
				>
					{/* Header */}
					<View className="relative items-center py-5 bg-white dark:bg-[#0a0a0a] border-b border-gray-50 dark:border-gray-800">
						<View {...panResponder.panHandlers} className="absolute top-0 w-full h-full items-center pt-5 z-10">
							<View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
						</View>
						<Pressable onPress={handleShare} className="absolute right-6 top-5 z-20 bg-gray-100 dark:bg-white/10 p-2 rounded-full">
							<Ionicons name="share-outline" size={16} color="#2563eb" />
						</Pressable>
					</View>

					<View className="flex-1">
						{showNewMessageToast && (
							<Animated.View entering={FadeIn} exiting={FadeOut} className="absolute top-4 self-center z-50">
								<Pressable onPress={jumpToBottom} className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full shadow-xl">
									<Ionicons name="arrow-down" size={14} color="white" />
									<Text className="text-white text-[10px] font-black uppercase ml-2">New Signals</Text>
								</Pressable>
							</Animated.View>
						)}

						<ScrollView 
							ref={scrollViewRef} 
							className="flex-1" 
							onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
							scrollEventThrottle={16}
							showsVerticalScrollIndicator={false}
							stickyHeaderIndices={[0]}
							onContentSizeChange={() => { if (shouldAutoScroll) scrollViewRef.current?.scrollToEnd({ animated: true }); }}
						>
							{/* Anchor */}
							<View className="bg-white dark:bg-[#0a0a0a] px-6 pb-4 border-b border-gray-100 dark:border-gray-800">
								<Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Anchor Signal</Text>
								<Text className="text-sm font-black dark:text-white">{comment.name}</Text>
								<Text className="text-xs text-gray-600 dark:text-gray-400 font-bold mt-1 leading-5">{comment.text}</Text>
							</View>

							<View className="px-6 pt-6">
								<Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-6">Response Feed</Text>
								
								{displayComments.map((reply, idx) => (
									<View key={reply._id || idx} className="mb-6 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
										<Text className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{reply.name}</Text>
										<Text className="text-xs text-gray-600 dark:text-gray-300 font-bold mt-1 leading-5">{reply.text}</Text>
										<Text className="text-[8px] font-bold text-gray-400 uppercase mt-2">{new Date(reply.date).toLocaleTimeString()}</Text>
									</View>
								))}
								<View className="h-20" />
							</View>
						</ScrollView>

						{/* Input Area */}
						<View className="p-5 pb-10 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800">
							<View className="flex-row gap-3 items-end">
								<TextInput
									placeholder="WRITE RESPONSE..."
									placeholderTextColor="#6b7280"
									multiline
									className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl text-[12px] font-black dark:text-white max-h-32 border border-gray-100 dark:border-gray-800"
									value={replyText}
									onChangeText={setReplyText}
								/>
								<Pressable
									onPress={() => {
										if (replyText.trim() && !isPosting) {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
											onReply(comment._id, replyText);
											setReplyText("");
											setShouldAutoScroll(true);
										}
									}}
									disabled={isPosting}
									className="bg-blue-600 w-14 h-14 rounded-2xl items-center justify-center shadow-lg"
								>
									{isPosting ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
								</Pressable>
							</View>
						</View>
					</View>
				</RNAnimated.View>
			</KeyboardAvoidingView>
		</View>
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

	// --- HANDLE DEEP LINKING (Cold & Warm Starts) ---
	useEffect(() => {
		const findAndOpenDiscussion = (url) => {
			if (!url || !url.includes("discussion=")) return;
			const discussionId = url.split("discussion=")[1]?.split("&")[0];
			if (!discussionId) return;

			const target = comments.find(c => c._id === discussionId);
			if (target) {
				setActiveDiscussion(target);
			}
		};

		// 1. Check for initial URL (Cold start)
		Linking.getInitialURL().then(findAndOpenDiscussion);

		// 2. Listen for incoming URLs (Warm start)
		const subscription = Linking.addEventListener('url', (event) => findAndOpenDiscussion(event.url));
		
		return () => subscription.remove();
	}, [comments]);

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
					mutate(); 
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

			{/* Discussion Overlay (Replaces Modal) */}
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
