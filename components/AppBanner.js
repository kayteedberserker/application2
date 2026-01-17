import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, MobileAds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdConfig } from '../utils/AdConfig';

const BANNER_ID = __DEV__ ? TestIds.BANNER : AdConfig.banner;
const SECRET_PIN = "1807"; 
const BANNED_KEY = "@admin_debug_banned";

const AppBanner = ({ size = BannerAdSize.MEDIUM_RECTANGLE }) => {
  const [failed, setFailed] = useState(false);
  const [errorCode, setErrorCode] = useState(null); 
  const [loaded, setLoaded] = useState(false);
  
  // Debug Menu States
  const [modalVisible, setModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isBanned, setIsBanned] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false); // 👈 New state: Hidden by default

  useEffect(() => {
    const checkBan = async () => {
      const banned = await AsyncStorage.getItem(BANNED_KEY);
      if (banned === "true") setIsBanned(true);
    };
    checkBan();
  }, []);

  const handleVerifyAdmin = async () => {
    if (pinInput === SECRET_PIN) {
      setModalVisible(false);
      setPinInput("");
      setShowDebugInfo(true); // 👈 Correct PIN reveals the error message
      
      try {
        // Try to open inspector, but we know it might fail on non-test devices
        await MobileAds().openAdInspector();
      } catch (e) {
        Alert.alert("Admin Mode", `Inspector blocked (Non-Test Device). Debug info is now visible on screen.`);
      }
    } else {
      await AsyncStorage.setItem(BANNED_KEY, "true");
      setIsBanned(true);
      setModalVisible(false);
      Alert.alert("Access Denied", "Unauthorized attempt.");
    }
  };

  const getMinHeight = () => {
    if (size === BannerAdSize.MEDIUM_RECTANGLE) return 250;
    return 50;
  };

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: loaded ? 10 : 0 }}>
      
      {/* 🔹 SECRET TRIGGER */}
      {!isBanned && (
        <TouchableOpacity 
          onPress={() => setModalVisible(true)} 
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }} 
          style={{ alignSelf: 'flex-end', paddingHorizontal: 10 }}
        >
          <Text style={{ fontSize: 9, color: '#ccc', opacity: 0.4, fontWeight: 'bold' }}>ADS</Text>
        </TouchableOpacity>
      )}

      {/* 🔹 DEBUG ERROR INFO: Only shows if you entered the PIN correctly */}
      {showDebugInfo && failed && (
        <View style={{ padding: 10, backgroundColor: '#fee2e2', borderRadius: 5, marginBottom: 10 }}>
            <Text style={{ color: '#b91c1c', fontSize: 10, fontWeight: 'bold' }}>
                ADMIN DEBUG -> Error: {errorCode || 'Unknown'}
            </Text>
        </View>
      )}

      {/* BANNER AD: Shows normally to everyone, disappears if fails */}
      {!failed && (
        <View style={{ minHeight: loaded ? 0 : getMinHeight(), width: '100%', alignItems: 'center' }}>
          <BannerAd
            unitId={BANNER_ID}
            size={size}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdLoaded={() => {
                setLoaded(true);
            }}
            onAdFailedToLoad={(error) => {
              setFailed(true);
              setErrorCode(error.code); // Store error but don't show it yet
              if (__DEV__) console.error("Banner Failed:", error);
            }}
          />
        </View>
      )}

      {/* 🔹 ADMIN MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', padding: 25, borderRadius: 15, width: '100%', maxWidth: 300 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 5 }}>Admin Access</Text>
            <TextInput
              style={{ backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, textAlign: 'center' }}
              placeholder="Enter PIN"
              placeholderTextColor="#666"
              keyboardType="numeric"
              secureTextEntry
              autoFocus={true}
              value={pinInput}
              onChangeText={setPinInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => { setModalVisible(false); setPinInput(""); }} style={{ padding: 10 }}>
                <Text style={{ color: '#777' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVerifyAdmin} style={{ backgroundColor: '#3b82f6', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AppBanner;

