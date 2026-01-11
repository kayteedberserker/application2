import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Modal,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    ScaleIn
} from "react-native-reanimated";
import { Text } from "./Text";

const { height } = Dimensions.get('window');

export default function AppOnboarding() {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0);

    const features = [
        {
            title: "NEURAL_LINK_START",
            desc: "Welcome to Oreblogda. You've just entered the ultimate hub for Anime and Gaming enthusiasts. Synchronize your profile to start sharing intel with the collective.",
            icon: "sparkles",
            color: "#6366f1",
            intel: "SYSTEM: INITIALIZING"
        },
        {
            title: "INTEL_SUBMISSION",
            desc: "Submit your posts to the archives. Each entry undergoes manual verification by the THE SYSTEM. You'll be notified once your intel is APPROVED or REJECTED.",
            icon: "cloud-upload",
            color: "#60a5fa",
            intel: "PROTOCOL: DATA_ENTRY"
        },
        {
            title: "STREAK_STABILITY",
            desc: "Maintain your daily flame ⚡. Your streak increases with every post—approved or rejected with a 24 hour cooldown. THE SYSTEM requires activity every 48hrs or your streak resets.",
            icon: "#f59e0b",
            icon: "flame",
            color: "#f59e0b",
            intel: "STATUS: CONSISTENCY_CHECK"
        },
        {
            title: "PROGRESSION_PATH",
            desc: "Rise through the ranks: \n• 0+ Posts: Novice Researcher 🛡️\n• 50+ Posts: Novice Writer ⚔️\n• 150+ Posts: Elite Writer 💎\n• 200+ Posts: Master Writer 👑",
            icon: "trending-up",
            color: "#10b981",
            intel: "DATA: RANK_LOGIC"
        },
        {
            title: "COMMAND_CENTER",
            desc: "The top 200 operatives are featured on the Global Leaderboard. Earn your MEDAL by staying consistent. High-ranking writers gain ultimate prestige.",
            icon: "medal",
            color: "#fbbf24",
            intel: "RANKING: GLOBAL_SQUAD"
        },
        {
            title: "CORE_MANAGEMENT",
            desc: "Visit your PROFILE to manage your published documents. Track your status, review your history, and monitor your progress toward the next rank level.",
            icon: "finger-print",
            color: "#a78bfa",
            intel: "ACCESS: PERSONAL_VAULT"
        },
        {
            title: "DATA_INTEGRITY",
            desc: "Zero tolerance for SPAM or corrupted data. Ensure your posts add value to the archives. Violating protocol may result in streak resets.",
            icon: "shield-checkmark",
            color: "#f87171",
            intel: "SECURITY: ANTI_SPAM"
        },
        {
            title: "SYSTEM_ONLINE",
            desc: "All systems are green. Your neural link to Oreblogda is established. Welcome to the frontline, Operative. The archives are waiting for your contribution.",
            icon: "checkmark-done-circle",
            color: "#10b981",
            intel: "FINAL_INIT: ACCESS_GRANTED"
        }
    ];

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            // Check if user has registered FIRST
            const storedUser = await AsyncStorage.getItem("mobileUser");
            const hasSeenWelcome = await AsyncStorage.getItem("HAS_SEEN_WELCOME");

            // ONLY show onboarding if user is registered AND hasn't seen the welcome briefing
            if (storedUser !== null && hasSeenWelcome === null) {
                setIsVisible(true);
            }
        } catch (e) {
            console.log("Onboarding logic error:", e);
        }
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem("HAS_SEEN_WELCOME", "true");
            setIsVisible(false);
        } catch (e) {
            console.log("Error saving onboarding state:", e);
        }
    };

    const nextStep = () => {
        if (step < features.length - 1) setStep(step + 1);
        else handleComplete();
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    if (!isVisible) return null;

    return (
        <Modal transparent visible={isVisible} animationType="none">
            <View style={{ 
                flex: 1, 
                backgroundColor: 'rgba(0,0,0,0.96)', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: 20 
            }}>
                <Animated.View entering={FadeIn} style={{ position: 'absolute', width: '100%', height: '100%' }} />

                <Animated.View 
                    entering={ScaleIn}
                    style={{ 
                        width: '100%', 
                        height: height * 0.78, 
                        backgroundColor: '#050505', 
                        borderRadius: 32, 
                        borderWidth: 1, 
                        borderColor: '#1e293b',
                        padding: 30,
                        justifyContent: 'space-between'
                    }}
                >
                    {/* --- TOP NAVIGATION BAR --- */}
                    <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        zIndex: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#111',
                        paddingBottom: 15
                    }}>
                        <View style={{ width: 80 }}> 
                            {step > 0 && (
                                <TouchableOpacity 
                                    onPress={prevStep} 
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                >
                                    <Ionicons name="chevron-back" size={14} color="#60a5fa" />
                                    <Text style={{ fontSize: 10, color: '#60a5fa', fontWeight: 'bold' }}>PREV_DATA</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <TouchableOpacity onPress={handleComplete}>
                            <Text style={{ fontSize: 10, color: '#475569', fontWeight: 'bold', letterSpacing: 1 }}>SKIP_SYNC_X</Text>
                        </TouchableOpacity>
                    </View>

                    <View>
                        {/* Icon */}
                        <Animated.View key={`icon-${step}`} entering={FadeIn} style={{ marginBottom: 30, marginTop: 10 }}>
                            <View style={{ 
                                width: 68, height: 68, borderRadius: 20, backgroundColor: '#000', 
                                borderWidth: 1, borderColor: features[step].color, 
                                justifyContent: 'center', alignItems: 'center',
                                shadowColor: features[step].color, shadowOpacity: 0.3, shadowRadius: 15
                            }}>
                                <Ionicons name={features[step].icon} size={34} color={features[step].color} />
                            </View>
                        </Animated.View>

                        {/* Text Content */}
                        <Animated.View key={`text-${step}`} entering={FadeInDown}>
                            <Text style={{ fontSize: 10, color: features[step].color, fontWeight: '900', letterSpacing: 3, marginBottom: 12 }}>
                                {features[step].intel} // 0{step + 1}
                            </Text>
                            <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 18, lineHeight: 34 }}>
                                {features[step].title}
                            </Text>
                            <Text style={{ fontSize: 15, color: '#94a3b8', lineHeight: 24 }}>
                                {features[step].desc}
                            </Text>
                        </Animated.View>
                    </View>

                    <View>
                        {/* Progress Dots */}
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 30 }}>
                            {features.map((_, i) => (
                                <View key={i} style={{ 
                                    height: 4, width: i === step ? 24 : 6, borderRadius: 10, 
                                    backgroundColor: i === step ? features[step].color : '#1e293b' 
                                }} />
                            ))}
                        </View>

                        {/* Main Action Button */}
                        <TouchableOpacity
                            onPress={nextStep}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: features[step].color,
                                paddingVertical: 18, borderRadius: 18,
                                alignItems: 'center', flexDirection: 'row',
                                justifyContent: 'center', gap: 10
                            }}
                        >
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 2 }}>
                                {step === features.length - 1 ? "INITIALIZE_CORE" : "NEXT_SYNC_LEVEL"}
                            </Text>
                            <Ionicons 
                                name={step === features.length - 1 ? "flash" : "chevron-forward"} 
                                size={20} 
                                color="#000" 
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}