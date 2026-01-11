import { useEffect } from 'react';
import { Text as RNText, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * A reusable Otaku-themed loading component updated to Reanimated.
 * Optimized for production and lower-end hardware (Samsung A30).
 */
export const SyncLoading = ({ message = "Fetching Otaku Posts" }) => {
  // Use shared values for UI-thread animations
  const pulseAnim = useSharedValue(0);
  const statusOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Progress Bar Animation - 1.5s loop
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );

    // 2. Status Dot Blinking - Smooth sequence
    statusOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
    
    // Cleanup to ensure no memory leaks on unmount
    return () => {
        pulseAnim.value = 0;
        statusOpacity.value = 1;
    };
  }, []);

  // Optimized transform for the progress bar
  const progressStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: pulseAnim.value * 280 - 80,
      },
    ],
  }));

  const blinkStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  return (
    <View className="py-8 items-center justify-center">
      {/* Header Label - Electric Cyan */}
      <View className="flex-row items-center gap-3 mb-5">
        <View className="h-[1px] w-6 bg-cyan-500/20" />
        <RNText className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-600 dark:text-cyan-400">
          {message}
        </RNText>
        <View className="h-[1px] w-6 bg-cyan-500/20" />
      </View>

      {/* Progress Bar Track */}
      <View className="w-52 h-1 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
        <Animated.View
          style={[
            progressStyle,
            {
              height: '100%',
              width: '35%',
              backgroundColor: '#06b6d4',
              borderRadius: 10,
              // PERFORMANCE FIX: Reduced shadow complexity for A30 stability
              opacity: 0.9, 
            }
          ]}
        />
      </View>

      {/* Status Badges - Multi-Color Palette */}
      <View className="mt-5 flex-row gap-5">
        
        {/* Active Status: Emerald Green */}
        <View className="flex-row items-center gap-1.5">
          <Animated.View 
            className="h-1 w-1 bg-emerald-500 rounded-full" 
            style={blinkStyle}
          />
          <RNText className="text-[7px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest">
            Sync_Active
          </RNText>
        </View>

        {/* Connection Status: Amber/Orange */}
        <View className="flex-row items-center gap-1.5">
          <View className="h-1 w-1 bg-amber-500 rounded-full opacity-80" />
          <RNText className="text-[7px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">
            DB_Link
          </RNText>
        </View>

        {/* Meta Status: Cool Slate/Indigo */}
        <View className="flex-row items-center gap-1.5">
          <View className="h-1 w-1 bg-indigo-400 rounded-full opacity-50" />
          <RNText className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            V.2.0.4
          </RNText>
        </View>
      </View>

      {/* Subtle Bottom Accent */}
      <View className="mt-3 w-12 h-[1px] bg-slate-200 dark:bg-slate-800" />
    </View>
  );
};