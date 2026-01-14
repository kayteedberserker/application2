import {
    AdEventType,
    AppOpenAd,
} from 'react-native-google-mobile-ads';
import { AdConfig } from '../utils/AdConfig';

let appOpenAd = null;
let isLoaded = false;

export const loadAppOpenAd = () => {
    if (appOpenAd) return;
    appOpenAd = AppOpenAd.createForAdRequest(AdConfig.appOpen);

    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        isLoaded = true;
    });

    appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        isLoaded = false;
        appOpenAd = null;
        loadAppOpenAd(); // preload next
    });

    appOpenAd.load();
    console.log("appopen loaded")
};

export const showAppOpenAd = () => {
    if (isLoaded && appOpenAd) {
        appOpenAd.show();
        console.log("appopen shown");
        
    }
};
