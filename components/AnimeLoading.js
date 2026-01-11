import React, { useEffect } from 'react';
import { Text as RNText, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Reusable Anime/Gaming Loading Component
 * Scaled down and color-boosted for a high-energy "Neon" feel.
 */
const AnimeLoading = ({ message = "FETCHING", subMessage = "Synchronizing Universe..." }) => {
    // Shared values
    const rotation = useSharedValue(0);
    const pulse = useSharedValue(1);
    const float = useSharedValue(0);
    const wave = useSharedValue(0);
    const barProgress = useSharedValue(-160); // Adjusted for smaller width (40 * 4)

    useEffect(() => {
        // 1. Kinetic Rotation
        rotation.value = withRepeat(
            withTiming(1, { duration: 2500 }),
            -1,
            false
        );

        // 2. Pulsing Core
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 600 }),
                withTiming(1, { duration: 600 })
            ),
            -1,
            true
        );

        // 3. Floating Text
        float.value = withRepeat(
            withSequence(
                withTiming(-6, { duration: 1200 }),
                withTiming(0, { duration: 1200 })
            ),
            -1,
            true
        );

        // 4. Energy Pulse Wave
        wave.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );

        // 5. Progress Bar
        barProgress.value = withRepeat(
            withTiming(160, { duration: 1200 }),
            -1,
            false
        );
    }, []);

    // Animated Styles
    const outerRingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value * 360}deg` }],
    }));

    const innerRingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${-rotation.value * 720}deg` }],
    }));

    const coreStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: pulse.value },
            { rotate: '45deg' }
        ],
    }));

    const waveStyle = useAnimatedStyle(() => ({
        transform: [{ scale: wave.value * 2 }],
        opacity: 1 - wave.value,
    }));

    const floatTextStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: float.value }],
    }));

    const progressBarStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: barProgress.value }],
    }));

    return (
        <View className="flex-1 justify-center items-center bg-[#f8fafc] dark:bg-[#020617]">
            {/* --- Ambient Background Glow --- */}
            <View className="absolute w-40 h-40 bg-cyan-500/10 dark:bg-blue-600/20 blur-3xl rounded-full" />

            <View className="relative items-center justify-center">
                
                {/* Expanding Energy Wave */}
                <Animated.View 
                    style={[
                        waveStyle,
                        {
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            borderWidth: 1,
                            borderColor: '#06b6d4',
                            position: 'absolute',
                        }
                    ]}
                />

                {/* Outer Orbital (Now Cyan) */}
                <Animated.View 
                    style={[
                        outerRingStyle,
                        {
                            width: 100,
                            height: 100,
                            borderWidth: 1.5,
                            borderColor: '#06b6d4',
                            borderStyle: 'dashed',
                            borderRadius: 50,
                            position: 'absolute',
                            opacity: 0.5,
                        }
                    ]}
                />

                {/* Inner Hex Frame (Now Vibrant Blue) */}
                <Animated.View 
                    style={[
                        innerRingStyle,
                        {
                            width: 70,
                            height: 70,
                            borderWidth: 3,
                            borderLeftColor: '#2563eb',
                            borderRightColor: '#0ea5e9',
                            borderTopColor: 'transparent',
                            borderBottomColor: 'transparent',
                            borderRadius: 15,
                            position: 'absolute',
                        }
                    ]}
                />

                {/* Core Power Crystal (Electric Cyan) */}
                <Animated.View 
                    style={[
                        coreStyle,
                        {
                            width: 28,
                            height: 28,
                            backgroundColor: '#06b6d4',
                            borderRadius: 4,
                            shadowColor: '#06b6d4',
                            shadowRadius: 15,
                            shadowOpacity: 0.9,
                            elevation: 12,
                            borderWidth: 1,
                            borderColor: '#ffffff',
                        }
                    ]}
                />
            </View>

            {/* --- HUD TEXT --- */}
            <Animated.View style={floatTextStyle} className="mt-20 items-center">
                <View>
                    <RNText className="absolute -top-0.5 -left-0.5 text-4xl font-black italic uppercase text-cyan-500 opacity-20">
                         {message}
                    </RNText>
                    <RNText className="text-4xl font-black italic uppercase text-slate-900 dark:text-cyan-50">
                         {message}
                    </RNText>
                </View>

                {/* Status Badge (Skewed & Neon) */}
                <View 
                    className="flex-row items-center mt-3 bg-cyan-600 dark:bg-blue-600 px-4 py-0.5"
                    style={{ 
                        transform: [{ skewX: '-15deg' }],
                        shadowColor: '#06b6d4',
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                    }}
                >
                     <RNText 
                       className="text-[8px] font-bold text-white uppercase tracking-[0.4em]"
                       style={{ transform: [{ skewX: '15deg' }] }}
                     >
                        {subMessage}
                     </RNText>
                </View>

                {/* Experience Bar Style Loader */}
                <View className="w-40 h-1 bg-slate-200 dark:bg-slate-800 mt-10 overflow-hidden rounded-full border border-slate-300/30 dark:border-blue-900/30">
                    <Animated.View 
                       className="h-full bg-cyan-500 w-full" 
                       style={[
                           progressBarStyle,
                           {
                             shadowColor: '#06b6d4',
                             shadowOpacity: 1,
                             shadowRadius: 4,
                           }
                       ]}
                    />
                </View>
                
                {/* Tech Bits */}
                <View className="flex-row gap-2 mt-4 opacity-40">
                    <View className="w-3 h-0.5 bg-cyan-500 rounded-full" />
                    <View className="w-1 h-0.5 bg-cyan-500 rounded-full" />
                    <View className="w-3 h-0.5 bg-cyan-500 rounded-full" />
                </View>
            </Animated.View>
        </View>
    );
};

export default AnimeLoading;