import { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAPS_LIBRARIES: ['places'] = ['places'];

const MapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

// Separate component so useJsApiLoader is always called unconditionally within it
function WebMapsProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useJsApiLoader } = require('@react-google-maps/api');
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    id: 'rewear-map',
    libraries: MAPS_LIBRARIES,
  });
  return (
    <MapsContext.Provider value={{ isLoaded }}>
      {children}
    </MapsContext.Provider>
  );
}

export function MapsProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web' && GOOGLE_MAPS_KEY) {
    return <WebMapsProvider>{children}</WebMapsProvider>;
  }
  return (
    <MapsContext.Provider value={{ isLoaded: false }}>
      {children}
    </MapsContext.Provider>
  );
}

export function useMaps() {
  return useContext(MapsContext);
}
