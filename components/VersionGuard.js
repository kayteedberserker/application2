
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import * as Application from 'expo-application';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

// SETTINGS: Change this when you upload to Play Store
const LATEST_VERSION = "1.5.1"; 
const STORE_URL = "https://play.google.com/store/apps/details?id=com.kaytee.oreblogda";

const VersionGuard = () => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deviceVer, setDeviceVer] = useState('');

  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    const current = Application.nativeApplicationVersion || "1.0.0";
    setDeviceVer(current);
    
    if (current !== LATEST_VERSION) {
      setShowModal(true);
    }
    
    // Always show loading for 1.5s as per your brand style
    setTimeout(() => setLoading(false), 1500);
  };

  if (loading) {
    return (
      <StyledView className="absolute inset-0 z-50 bg-black justify-center items-center">
        <ActivityIndicator size="small" color="#00FF41" />
        <StyledText className="text-neon-green font-mono text-[10px] mt-2 tracking-widest">
          CHECKING_VERSION_INTEGRITY...
        </StyledText>
      </StyledView>
    );
  }

  return (
    <Modal visible={showModal} transparent animationType="fade">
      <StyledView className="flex-1 bg-black/95 justify-center items-center px-8">
        <StyledView className="w-full border-2 border-neon-green p-6 bg-zinc-900 rounded-lg shadow-2xl shadow-neon-green/30">
          <StyledText className="text-neon-green font-bold text-lg mb-2 font-mono tracking-tighter">
            [!] VERSION_OUTDATED
          </StyledText>
          <StyledText className="text-zinc-400 mb-6 font-mono text-xs leading-5">
            Local v{deviceVer} is no longer compatible with the Beta Cluster. 
            Sync with v{LATEST_VERSION} to resume testing.
          </StyledText>
          
          <StyledTouch 
            onPress={() => Linking.openURL(STORE_URL)}
            className="bg-neon-green py-4 rounded-sm items-center active:bg-white"
          >
            <StyledText className="text-black font-black uppercase text-xs">Update System</StyledText>
          </StyledTouch>
        </StyledView>
      </StyledView>
    </Modal>
  );
};

export default VersionGuard;
