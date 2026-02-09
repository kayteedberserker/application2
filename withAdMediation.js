const { withAndroidManifest, withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAdMediation(config) {
  
  // 1. Inject Activities & Resolve Specific Manifest Conflicts
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const mainApplication = manifest.application[0];
    
    if (!manifest['$']['xmlns:tools']) {
      manifest['$']['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Global Application Overrides
    if (!mainApplication['$']['tools:replace']) {
      mainApplication['$']['tools:replace'] = 'android:allowBackup,android:theme';
    } else {
      const existing = mainApplication['$']['tools:replace'];
      if (!existing.includes('android:theme')) mainApplication['$']['tools:replace'] += ',android:theme';
      if (!existing.includes('android:allowBackup')) mainApplication['$']['tools:replace'] += ',android:allowBackup';
    }

    const activities = [
      // ironSource
      { 'android:name': 'com.ironsource.sdk.controller.ControllerActivity', 'android:configChanges': 'orientation|screenSize', 'android:hardwareAccelerated': 'true' },
      { 
        'android:name': 'com.ironsource.sdk.controller.InterstitialActivity', 
        'android:configChanges': 'orientation|screenSize', 
        'android:hardwareAccelerated': 'true', 
        'android:theme': '@android:style/Theme.Translucent',
        'tools:replace': 'android:theme' 
      },
      { 'android:name': 'com.ironsource.sdk.controller.OpenVideoActivity', 'android:configChanges': 'orientation|screenSize', 'android:hardwareAccelerated': 'true', 'android:theme': '@android:style/Theme.Translucent' },
      
      // Unity
      { 
        'android:name': 'com.unity3d.services.ads.adunit.AdUnitActivity', 
        'android:configChanges': 'fontScale|keyboard|keyboardHidden|locale|mnc|mcc|navigation|orientation|screenLayout|screenSize|smallestScreenSize|uiMode|touchscreen', 
        'android:hardwareAccelerated': 'true', 
        'android:theme': '@android:style/Theme.NoTitleBar.Fullscreen', 
        'android:exported': 'false',
        'tools:replace': 'android:theme'
      },

      // InMobi - UPDATED CONFIGCHANGES TO MATCH SDK 11 REQUIREMENTS
      { 
        'android:name': 'com.inmobi.ads.rendering.InMobiAdActivity', 
        'android:configChanges': 'keyboardHidden|orientation|keyboard|smallestScreenSize|screenSize|screenLayout|locale|fontScale|uiMode', 
        'android:hardwareAccelerated': 'true', 
        'android:resizeableActivity': 'false', 
        'android:theme': '@android:style/Theme.NoTitleBar.Fullscreen', 
        'tools:ignore': 'UnusedAttribute',
        'tools:replace': 'android:theme,android:configChanges' // Added configChanges to replace rules
      }
    ];

    activities.forEach(activity => {
      const existingActivity = mainApplication.activity.find(a => a['$'] && a['$']['android:name'] === activity['android:name']);
      if (!existingActivity) {
        mainApplication.activity.push({ '$': activity });
      } else {
        Object.assign(existingActivity['$'], activity);
      }
    });

    return config;
  });

  // 2. Dependencies
  config = withAppBuildGradle(config, (config) => {
    const dependencies = `
    implementation 'com.google.android.gms:play-services-ads:24.9.0'
    implementation 'com.google.ads.mediation:unity:4.16.6.0'
    implementation 'com.unity3d.ads:unity-ads:4.16.5'
    implementation 'com.google.ads.mediation:ironsource:9.3.0.0'
    implementation 'com.unity3d.ads-mediation:mediation-sdk:9.3.0'
    implementation 'com.google.ads.mediation:inmobi:11.1.0.1'
    implementation 'com.inmobi.monetization:inmobi-ads-kotlin:11.1.0'
    implementation 'com.squareup.picasso:picasso:2.8'
    
    constraints {
        implementation('androidx.work:work-runtime:2.9.0') {
            because 'Conflict between AdMob and Reanimated Worklets'
        }
    }
    `;

    if (!config.modResults.contents.includes('com.google.ads.mediation:inmobi')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s?{/,
        `dependencies {${dependencies}`
      );
    }
    return config;
  });

  // 3. Maven Repos
  config = withProjectBuildGradle(config, (config) => {
    const ironSourceRepo = 'maven { url "https://android-sdk.is.com/" }';
    const unityRepo = 'maven { url "https://unity3d.jfrog.io/artifactory/unity-ads-android-master" }';
    
    if (!config.modResults.contents.includes('android-sdk.is.com')) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s?{\s?repositories\s?{/,
        `allprojects {\n    repositories {\n        ${ironSourceRepo}`
      );
    }
    
    if (!config.modResults.contents.includes('unity3d.jfrog.io')) {
       config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s?{\s?repositories\s?{/,
        `allprojects {\n    repositories {\n        ${unityRepo}`
      );
    }

    return config;
  });

  return config;
};