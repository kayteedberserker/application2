import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Toast from "react-native-toast-message";
import useSWR from "swr";
import { useUser } from "../context/UserContext";
import { Text } from "./Text";

const API_URL = "https://oreblogda.com";

const fetcher = (url) => fetch(url).then(res => res.json());

export default function Poll({ poll, postId, readOnly = false }) {
    const { user } = useUser();
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false); // Added missing loading state

    // --- SWR: live post (poll source of truth) ---
    const { data, mutate } = useSWR(
        postId ? `${API_URL}/api/posts/${postId}` : null,
        fetcher,
        {
            refreshInterval: 5000,          // keep poll in sync across devices
            revalidateOnFocus: true,
            dedupingInterval: 0,            // ⚠️ prevent stale cache rollback
        }
    );

    const livePoll = data?.poll || poll;

    // --- Detect if this device already voted ---
    useEffect(() => {
        if (user?.deviceId && livePoll?.voters?.includes(user.deviceId)) {
            setSubmitted(true);
        }
    }, [livePoll?.voters, user?.deviceId]);

    const handleOptionChange = (optionIndex) => {
        if (readOnly || submitted) return;

        if (livePoll.pollMultiple) {
            setSelectedOptions((prev) =>
                prev.includes(optionIndex)
                    ? prev.filter((i) => i !== optionIndex)
                    : [...prev, optionIndex]
            );
        } else {
            setSelectedOptions([optionIndex]);
        }
    };

    const handleVote = async () => {
        if (readOnly || selectedOptions.length === 0 || !user?.deviceId || loading) {
            if (!user?.deviceId) {
                Toast.show({ type: "error", text1: "Device ID not found" });
            }
            return;
        }

        setLoading(true); // Start loading animation

        // --- Optimistic UI update ---
        const optimisticPoll = {
            ...livePoll,
            options: livePoll.options.map((opt, i) =>
                selectedOptions.includes(i)
                    ? { ...opt, votes: opt.votes + 1 }
                    : opt
            ),
            voters: [...(livePoll.voters || []), user.deviceId],
        };

        // Apply optimistic update instantly
        mutate(
            (current) => ({ ...current, poll: optimisticPoll }),
            false
        );

        try {
            const res = await fetch(`${API_URL}/api/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "vote",
                    fingerprint: user.deviceId,
                    payload: { selectedOptions },
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                if (result.message === "Already voted") {
                    setSubmitted(true);
                    Toast.show({ type: "info", text1: "You’ve already voted!" });
                } else {
                    throw new Error(result.message || "Vote failed");
                }
            } else {
                setSubmitted(true);
                Toast.show({ type: "success", text1: "Vote submitted!" });
            }

            // Revalidate with backend truth
            mutate();

        } catch (err) {
            Toast.show({ type: "error", text1: "Vote failed, retrying…" });
            mutate(); // rollback to backend state if needed
        } finally {
            setLoading(false); // Stop loading animation
        }
    };

    const totalVotes = livePoll.options.reduce((sum, opt) => sum + opt.votes, 0);

    return (
        <View className="mt-6 p-5 border border-gray-200 dark:border-blue-900/30 rounded-[24px] bg-white/50 dark:bg-black/40 shadow-sm relative overflow-hidden">

            {/* Mobile HUD Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <View className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    <Text className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                        Consensus_Protocol
                    </Text>
                </View>
                <Text className="text-[8px] font-mono text-blue-600/60">
                    Total: {totalVotes}
                </Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
                {livePoll.options.map((opt, i) => {
                    const percentage = totalVotes ? ((opt.votes / totalVotes) * 100).toFixed(1) : 0;
                    const isSelected = selectedOptions.includes(i);

                    return (
                        <Pressable
                            key={i}
                            onPress={() => !readOnly && !submitted && handleOptionChange(i)}
                            className={`mb-3 w-[48%] p-3 rounded-2xl border ${isSelected
                                    ? "border-blue-600 bg-blue-600/5 dark:bg-blue-600/10"
                                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                                }`}
                        >
                            <View className="flex-row items-center justify-between mb-2">
                                <Text
                                    className={`text-[10px] font-bold uppercase flex-1 ${isSelected ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
                                    numberOfLines={1}
                                >
                                    {opt.text}
                                </Text>
                                <Text className="text-[9px] font-mono font-bold text-blue-500">{percentage}%</Text>
                            </View>

                            {/* Progress Bar */}
                            <View className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <View
                                    className="bg-blue-600 h-full"
                                    style={{ width: `${percentage}%` }}
                                />
                            </View>

                            <View className="flex-row justify-between mt-2">
                                <Text className="text-[8px] font-mono text-gray-400">Votes: {opt.votes}</Text>
                                {isSelected && <Text className="text-[8px] font-black text-blue-600">SELECTED</Text>}
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            {!readOnly && !submitted && (
                <View className="mt-2">
                    <Pressable
                        onPress={handleVote}
                        disabled={loading || selectedOptions.length === 0}
                        className={`relative h-12 bg-gray-900 dark:bg-white rounded-xl flex-row items-center justify-center overflow-hidden ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <View className="flex-row items-center gap-2">
                                <View className="w-3 h-3 border-2 border-gray-400 border-t-blue-600 rounded-full" />
                                <Text className="text-[10px] font-black uppercase tracking-widest text-white dark:text-black">Processing...</Text>
                            </View>
                        ) : (
                            <Text className="text-[10px] font-black uppercase tracking-widest text-white dark:text-black">
                                Transmit Selection
                            </Text>
                        )}

                        {/* Mobile Loading Bar Animation */}
                        {loading && (
                            <View className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                        )}
                    </Pressable>

                    {loading && (
                        <Text className="text-[8px] font-mono text-blue-500 text-center mt-2 animate-pulse uppercase">
                            Encrypting Choice / Sending to Network...
                        </Text>
                    )}
                </View>
            )}

            {submitted && (
                <View className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex-row items-center justify-center gap-2">
                    <View className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <Text className="text-[9px] font-black uppercase tracking-widest text-green-600">
                        Vote Logged Successfully
                    </Text>
                </View>
            )}
        </View>
    );
}