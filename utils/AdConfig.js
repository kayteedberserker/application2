import { TestIds } from 'react-native-google-mobile-ads';

// Set this to true when you are ready to go live
const IS_PRODUCTION =! __DEV__; 

export const AdConfig = {
  banner: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/9433498196'
    : TestIds.BANNER,

  interstitial: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/8875272604'
    : TestIds.INTERSTITIAL,

  rewarded: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/9241926507'
    : TestIds.REWARDED,

  appOpen: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/1256637033' // App Open ID
    : TestIds.APP_OPEN,
};
