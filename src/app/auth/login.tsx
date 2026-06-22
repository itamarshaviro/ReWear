import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('מייל לא תקין', 'אנא הזן כתובת מייל תקינה.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase());
      router.push('/auth/verify');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>→</Text>
          </TouchableOpacity>

          <View style={styles.hero}>
            <Text style={styles.icon}>👋</Text>
            <Text style={styles.title}>ברוך שובך!</Text>
            <Text style={styles.sub}>הזן את האימייל שלך כדי להתחבר</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>אימייל</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="right"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'שולח...' : 'התחבר'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/auth/register')}>
            <Text style={styles.switchText}>אין לי חשבון עדיין — הירשם</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: {
    flex: 1,
    padding: 28,
    gap: 28,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  hero: { alignItems: 'center', gap: 8 },
  icon: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '900', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  form: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  switchText: { fontSize: 14, color: '#6366F1', fontWeight: '600', textAlign: 'center' },
});
