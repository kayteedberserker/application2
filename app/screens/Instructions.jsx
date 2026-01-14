import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dimensions, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/Text';
import THEME from '../../components/useAppTheme';
const { width } = Dimensions.get('window');


export default function Instructions() {
  const router = useRouter();

  const InstructionStep = ({ icon, title, desc, color }) => (
    <View className="flex-row items-start mb-8">
      <View 
        style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }} 
        className="w-12 h-12 rounded-2xl items-center justify-center border"
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View className="flex-1 ml-5">
        <Text className="text-sm font-black uppercase italic text-white tracking-tight">{title}</Text>
        <Text className="text-gray-500 mt-1.5 leading-5 font-medium text-[13px]">{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      {/* --- Ambient Background Glows --- */}
      <View style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: THEME.glowBlue }} />
      <View style={{ position: 'absolute', bottom: 100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: THEME.glowGreen }} />

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* --- Header --- */}
        <View className="flex-row items-center mt-8 mb-10">
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ backgroundColor: THEME.card, borderColor: THEME.border }}
            className="w-12 h-12 items-center justify-center rounded-2xl border-2"
          >
            <Ionicons name="chevron-back" size={24} color={THEME.accent} />
          </TouchableOpacity>
          <View className="ml-5">
            <Text className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Knowledge Base</Text>
            <Text className="text-3xl font-black italic uppercase text-white">How to Post</Text>
          </View>
        </View>

        {/* --- 1. The Core Workflow --- */}
        <Text className="text-gray-600 font-black uppercase text-[9px] tracking-[0.2em] mb-6 ml-1">Transmission Basics</Text>
        
        <InstructionStep 
          icon="document-text-outline"
          title="Drafting Content"
          desc="Initialize with a high-impact title. Use the terminal formatting buttons [h] or [section] to ensure data readability."
          color="#3b82f6"
        />

        <InstructionStep 
          icon="scan-outline"
          title="Pre-Flight Check"
          desc="Always tap 'Show Preview'. This verifies the visual output. If syntax tags are corrupted, fix them before final submission."
          color="#8b5cf6"
        />

        {/* --- 2. Media & TikTok --- */}
        <View style={{ backgroundColor: THEME.border, height: 1 }} className="my-6 opacity-30" />
        <Text className="text-gray-600 font-black uppercase text-[9px] tracking-[0.2em] mb-6 ml-1">Media Integration</Text>
        
        <View 
          style={{ backgroundColor: THEME.card, borderColor: THEME.border }}
          className="p-6 rounded-[32px] border-2 mb-8"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="logo-tiktok" size={20} color={THEME.accent} />
            <Text className="ml-3 font-black italic uppercase text-white">TikTok Embeds</Text>
          </View>
          <Text className="text-gray-400 text-sm leading-6 font-medium">
            Copy links directly from source. Use full URLs (tiktok.com/video/...) for optimal decoding. Avoid shortened 'vm' links to reduce latency.
          </Text>
        </View>

        {/* --- 3. Polls & Categories --- */}
        <Text className="text-gray-600 font-black uppercase text-[9px] tracking-[0.2em] mb-6 ml-1">User Engagement</Text>
        
        <InstructionStep 
          icon="bar-chart-outline"
          title="Interactive Data"
          desc="Toggle 'Add a Poll' for crowd feedback. Minimum 2 options required. Data shows 3x higher engagement on interactive posts."
          color="#10b981"
        />

        <InstructionStep 
          icon="layers-outline"
          title="Sector Accuracy"
          desc="Posting 'News' in the 'Memes' sector will result in automated rejection. Ensure metadata matches content."
          color="#f59e0b"
        />

        {/* --- 4. Formatting Guide Table --- */}
        <View 
          style={{ backgroundColor: THEME.card, borderColor: THEME.border }}
          className="p-6 rounded-[32px] mt-4 border-2 shadow-2xl shadow-blue-500/10"
        >
          <View className="flex-row items-center mb-6">
             <Ionicons name="code-slash" size={18} color={THEME.accent} />
             <Text className="ml-3 font-black italic uppercase text-white">Syntax Reference</Text>
          </View>
          
          <View className="space-y-4">
            <View 
               style={{ borderBottomColor: THEME.border }}
               className="flex-row justify-between border-b pb-3 mb-3"
            >
              <Text className="text-blue-500 font-mono text-[11px] font-bold">[h]TITLE[/h]</Text>
              <Text className="text-gray-600 font-black uppercase text-[9px]">Bold Header</Text>
            </View>

            <View 
               style={{ borderBottomColor: THEME.border }}
               className="flex-row justify-between border-b pb-3 mb-3"
            >
              <Text className="text-blue-500 font-mono text-[11px] font-bold">[section]DATA[/section]</Text>
              <Text className="text-gray-600 font-black uppercase text-[9px]">Box Container</Text>
            </View>

            <View 
               style={{ borderBottomColor: THEME.border }}
               className="flex-row justify-between border-b pb-3 mb-3"
            >
              <Text className="text-blue-500 font-mono text-[11px] font-bold">[li]ITEM[/li]</Text>
              <Text className="text-gray-600 font-black uppercase text-[9px]">Bullet Node</Text>
            </View>
            <View 
               style={{ borderBottomColor: THEME.border }}
               className="flex-row justify-between pb-3 mb-3"
            >
              <Text className="text-blue-500 font-mono text-[11px] font-bold">[source="link" text:Text]</Text>
              <Text className="text-gray-600 font-black uppercase text-[9px]">Source Link</Text>
            </View>
          </View>
        </View>

        <View className="items-center mt-12 mb-8">
            <Text className="text-gray-800 font-black text-[8px] uppercase tracking-[0.4em]">Formatting Engine v2.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
