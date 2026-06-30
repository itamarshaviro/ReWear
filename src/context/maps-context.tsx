import { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAPS_LIBRARIES: ['places'] = ['places'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useJsApiLoader: ((...args: any[]) => any) | null = null;
if (Platform.OS === 'web') {
  try {
    useJsApiLoader = require('@react-google-maps/api').useJsApiLoader;
  } catch { /* not available */ }
}

const MapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export function MapsProvider({ children }: { children: ReactNode }) {
  const result = useJsApiLoader
    ? useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY, id: 'rewear-map', libraries: MAPS_LIBRARIES })
    : { isLoaded: false };

  return (
    <MapsContext.Provider value={{ isLoaded: result.isLoaded }}>
      {children}
    </MapsContext.Provider>
  );
}

export function useMaps() {
  return useContext(MapsContext);
}
