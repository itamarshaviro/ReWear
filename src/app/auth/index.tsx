import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { signIn, user } = useAuth();
  const params = useLocalSearchParams<{ registered?: string; verified?: string }>();
  const justRegistered = params.registered === '1';
  const justVerified = params.verified === '1';

  // Navigate to home once the user is set after successful sign-in
  useEffect(() => {
    if (user) {
      // Defer to avoid "Cannot update a component during render" warning
      setTimeout(() => router.replace('/'), 0);
    }
  }, [user]);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim()) { setError('אנא הזן כתובת מייל.'); return; }
    if (!password)     { setError('אנא הזן סיסמא.'); return; }

    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      setError(err);
    }
    // Navigation handled by useEffect above when user is set
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

          {justVerified && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ האימייל אומת בהצלחה! התחבר עם המייל והסיסמא שלך.</Text>
            </View>
          )}
          {justRegistered && !justVerified && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ החשבון נוצר בהצלחה! התחבר עם המייל והסיסמא שלך.</Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>אימייל</Text>
              <TextInput
                style={styles.inputBox}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
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
                  style={[styles.inputBox, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="הסיסמא שלך"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoComplete="current-password"
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
    padding: 28, gap: 16,
  },
  hero: { alignItems: 'center', gap: 8, marginBottom: 4 },
  logo: { fontSize: 44, fontWeight: '900', color: '#6366F1', letterSpacing: -2 },
  tagline: { fontSize: 15, color: '#6B7280' },
  successBox: {
    backgroundColor: '#F0FDF4', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 14, color: '#15803D', textAlign: 'right', fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FEF2F2', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'right', fontWeight: '600' },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right' },
  inputBox: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: '#111827',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 50, height: 50,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 20 },
  loginBtn: {
    backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
    marginTop: 4,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  loginBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  registerBtn: {
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    borderWidth: 2, borderColor: '#6366F1', backgroundColor: '#EEF2FF',
  },
  registerBtnText: { fontSize: 17, fontWeight: '800', color: '#6366F1' },
});
