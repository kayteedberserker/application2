import { TestIds } from 'react-native-google-mobile-ads';

// Set this to true when you are ready to go live
const IS_PRODUCTION = true

export const AdConfig = {
  banner: IS_PRODUCTION
    ? 'ca-app-pub-8021671365048667/7318309040'
    : TestIds.BANNER,

  interstitial: IS_PRODUCTION
    ? 'ca-app-pub-8021671365048667/6872598240'
    : TestIds.INTERSTITIAL,

  rewarded: TestIds.REWARDED, 
    //IS_PRODUCTION
 //   ? 'ca-app-pub-8021671365048667/5559516575'
  //  : TestIds.REWARDED,

  appOpen: IS_PRODUCTION
    ? 'ca-app-pub-8021671365048667/8591846359' // App Open ID
    : TestIds.APP_OPEN,
};
