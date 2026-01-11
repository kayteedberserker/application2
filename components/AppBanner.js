import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdConfig } from '../utils/AdConfig';
const AppBanner = ({ size = BannerAdSize.MEDIUM_RECTANGLE }) => {
  return (
    <BannerAd
      unitId={AdConfig.banner}
      size={size}
      requestOptions={{
        requestNonPersonalizedAdsOnly: false, // Set to true for GDPR compliance if needed
      }}
      onAdFailedToLoad={(error) => {
        // Silent error in prod, log in dev
        if (__DEV__) console.error("Ad failed to load:", error);
      }}
    />
  );
};

export default AppBanner;