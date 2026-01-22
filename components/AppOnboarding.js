import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
        title: "SUMMONING_COMPLETE",
        desc: "You've been summoned to the world of Oreblogda! Whether you're a wandering Shinobi or a top-tier Gamer, synchronize your soul to start sharing your journey with the guild.",
        icon: "sparkles",
        color: "#6366f1",
        intel: "STATUS: HERO_AWAKENED"
    },
    {
        title: "MANUSCRIPT_SUBMISSION",
        desc: "Submit your scrolls to the High Council. Every chapter is reviewed by the Sensei. You'll receive a message once your tale is officially ARCHIVED or marked as FILLER.",
        icon: "cloud-upload",
        color: "#60a5fa",
        intel: "PROTOCOL: SCROLL_SYNC"
    },
    {
        title: "SPIRIT_STREAK",
        desc: "Keep your Inner Fire burning! Your Power Level rises with every post. Don't let your Mana drop—if you stop training for 48 hours, your Spirit Streak will reset to zero.",
        icon: "flame",
        color: "#f59e0b",
        intel: "MANA: CONSISTENCY_CHECK"
    },
    {
        title: "LEVEL_UP_ARC",
        desc: "Climb the ranks and unlock your true potential: \n• E-Rank: Novice Researcher 🛡️\n• C-Rank: Novice Writer ⚔️\n• A-Rank: Elite Writer 💎\n• S-Rank: Master Writer 👑",
        icon: "trending-up",
        color: "#10b981",
        intel: "RANK: ADVENTURER_LOG"
    },
    {
        title: "AURA_AWAKENING",
        desc: "Manifest your spiritual pressure! Earn Aura Points through transmissions and high engagement. Every week, the Council resets the leaderboard—top legends keep their glowing badges of prestige. Let's get the AURA farming started. ",
        icon: "auto-fix",
        color: "#a78bfa",
        intel: "AURA: SOUL_VIBRATION"
    },
    {
        title: "GUILD_LEADERBOARD",
        desc: "The top 200 legends are etched into the Hall of Fame. Earn your Title by staying consistent. High-ranking masters gain ultimate prestige across the entire realm.",
        icon: "medal",
        color: "#fbbf24",
        intel: "HALL: TOP_OPERATIVES"
    },
    {
        title: "PERSONAL_GRIMOIRE",
        desc: "Visit your Grimoire to manage your recorded history. Track your progress, review your past arcs, and monitor your path toward becoming an S-Rank legend.",
        icon: "finger-print",
        color: "#a78bfa",
        intel: "VAULT: SOUL_RECORD"
    },
    {
        title: "JUDGMENT_GATE",
        desc: "Zero tolerance for Cursed Spirits or Spam. Ensure your contributions add value to the archives. Breaking the Ninja Code may result in your streak being sealed.",
        icon: "shield-checkmark",
        color: "#f87171",
        intel: "COUNCIL: ANTI_CURSE"
    },
    {
        title: "ADVENTURE_AWAITS",
        desc: "Your Mana is full. Your connection to Oreblogda is established. The world is waiting for your story, Hero. Go beyond, Plus Ultra!",
        icon: "checkmark-done-circle",
        color: "#10b981",
        intel: "FINAL_INIT: GO_BEYOND"
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
                                {features[step].icon === "auto-fix" ? (
                                     <MaterialCommunityIcons name="auto-fix" size={34} color={features[step].color} />
                                ) : (
                                    <Ionicons name={features[step].icon} size={34} color={features[step].color} />
                                )}
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
