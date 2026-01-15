import { TestIds } from 'react-native-google-mobile-ads';

// Set this to true when you are ready to go live
const IS_PRODUCTION = true

export const AdConfig = {
  banner: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/3239678831'
    : TestIds.BANNER,

  interstitial: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/9421943807'
    : TestIds.INTERSTITIAL,

  rewarded: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/2696753353'
    : TestIds.REWARDED,

  appOpen: IS_PRODUCTION
    ? 'ca-app-pub-7937601457401494/3563112460' // App Open ID
    : TestIds.APP_OPEN,
};
