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
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('שדות חסרים', 'אנא הזן מייל וסיסמא.');
      return;
    }
    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      Alert.alert('שגיאה', err);
    } else {
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>

          <View style={styles.hero}>
            <Text style={styles.logo}>ReWear</Text>
            <Text style={styles.tagline}>קנה ומכור בגדים יד שנייה 👗</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
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
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>סיסמא</Text>
              <View style={styles.passwordRow}>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass(p => !p)}
                >
                  <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="לפחות 8 תווים"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  textAlign="right"
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{loading ? 'מתחבר...' : 'התחבר'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>או</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>צור חשבון חדש</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: {
    flex: 1, justifyContent: 'center',
    padding: 28, gap: 20,
  },
  hero: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { fontSize: 44, fontWeight: '900', color: '#6366F1', letterSpacing: -2 },
  tagline: { fontSize: 15, color: '#6B7280' },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right' },
  input: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: '#111827',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    flex: 1,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  eyeBtn: {
    width: 48, height: 48,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },
  loginBtn: {
    backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  loginBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  registerBtn: {
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    borderWidth: 2, borderColor: '#6366F1', backgroundColor: '#EEF2FF',
  },
  registerBtnText: { fontSize: 17, fontWeight: '800', color: '#6366F1' },
});
