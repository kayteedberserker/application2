import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, MobileAds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdConfig } from '../utils/AdConfig';

const BANNER_ID = __DEV__ ? TestIds.BANNER : AdConfig.banner;
const SECRET_PIN = "1807"; // 👈 Set your secret admin PIN here
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
        // This opens the Google Ad Inspector to see why ads are failing
        await MobileAds().openAdInspector();
      } catch (e) {
        Alert.alert("Error", "Inspector failed to open. Check your internet or AdMob setup.");
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
      
      {/* 🔹 SECRET TRIGGER: Single tap on "ADS" text */}
      {!isBanned && (
        <TouchableOpacity 
          onPress={() => setModalVisible(true)} // Changed from onDoublePress to onPress
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }} // Makes it easier to tap
          style={{ alignSelf: 'flex-end', paddingHorizontal: 10 }}
        >
          <Text style={{ fontSize: 9, color: '#ccc', opacity: 0.4, fontWeight: 'bold' }}>ADS</Text>
        </TouchableOpacity>
      )}

      {/* BANNER AD */}
      {!failed && (
        <View style={{ minHeight: loaded ? 0 : getMinHeight(), width: '100%', alignItems: 'center' }}>
          <BannerAd
            unitId={BANNER_ID}
            size={size}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdLoaded={() => {
              setLoaded(true);
              if (__DEV__) console.log("Banner Loaded");
            }}
            onAdFailedToLoad={(error) => {
              setFailed(true);
              if (__DEV__) console.error("Banner Failed:", error);
            }}
          />
        </View>
      )}

      {/* 🔹 SECRET ADMIN MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', padding: 25, borderRadius: 15, width: '100%', maxWidth: 300, borderWide: 1, borderColor: '#333' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 5 }}>Admin Access</Text>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 20 }}>Verification required to open Ad Inspector.</Text>
            
            <TextInput
              style={{ backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16, textAlign: 'center' }}
              placeholder="Enter PIN"
              placeholderTextColor="#666"
              keyboardType="numeric"
              secureTextEntry
              autoFocus={true}
              value={pinInput}
              onChangeText={setPinInput}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                onPress={() => {
                    setModalVisible(false);
                    setPinInput("");
                }} 
                style={{ padding: 10 }}
              >
                <Text style={{ color: '#777' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleOpenInspector}
                style={{ backgroundColor: '#3b82f6', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 }}
              >
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
