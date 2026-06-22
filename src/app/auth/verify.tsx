import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function VerifyScreen() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📩</Text>
        <Text style={styles.title}>בדוק את האימייל שלך</Text>
        <Text style={styles.sub}>
          שלחנו לך קישור אימות.{'\n'}
          לחץ עליו כדי להפעיל את החשבון.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/auth')}>
          <Text style={styles.btnText}>חזור להתחברות</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  icon: { fontSize: 72 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  sub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  btn: {
    marginTop: 12, backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
