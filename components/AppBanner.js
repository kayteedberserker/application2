import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, MobileAds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdConfig } from '../utils/AdConfig';

const BANNER_ID = __DEV__ ? TestIds.BANNER : AdConfig.banner;
const SECRET_PIN = "1234"; // 👈 Set your secret admin PIN here
const BANNED_KEY = "@admin_debug_banned";

const AppBanner = ({ size = BannerAdSize.MEDIUM_RECTANGLE }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Debug Menu States
  const [modalVisible, setModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const checkBan = async () => {
      const banned = await AsyncStorage.getItem(BANNED_KEY);
      if (banned === "true") setIsBanned(true);
    };
    checkBan();
  }, []);

  const handleOpenInspector = async () => {
    if (pinInput === SECRET_PIN) {
      try {
        setModalVisible(false);
        setPinInput("");
        await MobileAds().openAdInspector();
      } catch (e) {
        Alert.alert("Error", "Inspector failed to open. Make sure the app is initialized.");
      }
    } else {
      // Wrong PIN -> Permanent Ban from Debug Menu
      await AsyncStorage.setItem(BANNED_KEY, "true");
      setIsBanned(true);
      setModalVisible(false);
      Alert.alert("Access Denied", "Unauthorized attempt. Security lock engaged.");
    }
  };

  const getMinHeight = () => {
    if (size === BannerAdSize.MEDIUM_RECTANGLE) return 250;
    return 50;
  };

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: loaded ? 10 : 0 }}>
      
      {/* 🔹 SECRET TRIGGER: Small "ADS" text (Double Tap to Open) */}
      {!isBanned && (
        <TouchableOpacity 
          onPress={() => {}} // Single press does nothing
          onDoublePress={() => setModalVisible(true)} // Double tap for Admin
          delayLongPress={2000}
          className="self-end px-2"
        >
          <Text style={{ fontSize: 8, color: '#ccc', opacity: 0.5 }}>ADS</Text>
        </TouchableOpacity>
      )}

      {/* BANNER AD */}
      {!failed && (
        <View style={{ minHeight: loaded ? 0 : getMinHeight(), width: '100%', alignItems: 'center' }}>
          <BannerAd
            unitId={BANNER_ID}
            size={size}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdLoaded={() => setLoaded(true)}
            onAdFailedToLoad={(error) => {
              setFailed(true);
              if (__DEV__) console.error("Banner Failed:", error);
            }}
          />
        </View>
      )}

      {/* 🔹 SECRET ADMIN MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', padding: 25, borderRadius: 15, width: '100%', maxWidth: 300 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 15 }}>Admin Auth</Text>
            <TextInput
              style={{ backgroundColor: '#333', color: 'white', padding: 12, borderRadius: 8, marginBottom: 20 }}
              placeholder="Enter PIN"
              placeholderTextColor="#777"
              keyboardType="numeric"
              secureTextEntry
              value={pinInput}
              onChangeText={setPinInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginRight: 20 }}>
                <Text style={{ color: '#aaa' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenInspector}>
                <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AppBanner;
