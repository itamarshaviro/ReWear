import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AppProvider } from '@/context/app-context';
import { AuthProvider } from '@/context/auth-context';
import { MapsProvider } from '@/context/maps-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <MapsProvider>
        <AuthProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </AppProvider>
        </AuthProvider>
      </MapsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
