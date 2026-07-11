module.exports = {
  expo: {
    name: 'rewear',
    slug: 'rewear',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'rewear',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.rewear.app',
      supportsTablet: false,
      icon: './assets/expo.icon',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'ReWear משתמשת במיקומך כדי להציג פריטים קרובים אליך.',
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    },
    android: {
      package: 'com.rewear.app',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        },
      },
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-notifications',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          android: {
            image: './assets/images/splash-icon.png',
            imageWidth: 76,
          },
        },
      ],
      [
        'react-native-maps',
        {
          googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '963a15e9-04be-477a-80a2-4e8be7a86f10',
      },
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
