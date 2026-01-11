import { TestIds } from 'react-native-google-mobile-ads';

// Set this to true when you are ready to go live
const IS_PRODUCTION = !__DEV__; 

export const AdConfig = {
  banner: IS_PRODUCTION 
    ? 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy' // Real Banner ID
    : TestIds.BANNER,
    
  interstitial: IS_PRODUCTION 
    ? 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz' // Real Interstitial ID
    : TestIds.INTERSTITIAL,

  rewarded: IS_PRODUCTION
    ? 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww' // Real Rewarded ID
    : TestIds.REWARDED,
};