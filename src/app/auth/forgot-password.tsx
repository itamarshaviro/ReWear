import { useState } from 'react';
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
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const { sendPasswordReset, confirmPasswordReset } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode() {
    setError('');
    if (!email.trim() || !email.includes('@')) { setError('אנא הזן כתובת מייל תקינה.'); return; }
    setLoading(true);
    const err = await sendPasswordReset(email.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    setStep('code');
  }

  async function handleVerifyCode() {
    setError('');
    if (code.trim().length < 4) { setError('אנא הזן את הקוד שקיבלת.'); return; }
    setStep('password');
  }

  async function handleResetPassword() {
    setError('');
    if (newPassword.length < 8) { setError('הסיסמא חייבת להכיל לפחות 8 תווים.'); return; }
    if (newPassword !== confirmPassword) { setError('הסיסמאות אינן תואמות.'); return; }
    setLoading(true);
    const err = await confirmPasswordReset(code.trim(), newPassword);
    setLoading(false);
    if (err) { setError(err); setStep('code'); return; }
    router.replace({ pathname: '/auth', params: { verified: '1' } });
  }

  const STEPS = ['email', 'code', 'password'] as const;
  const stepIndex = STEPS.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 'email' ? router.back() : setStep(STEPS[stepIndex - 1])}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>איפוס סיסמא</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step dots */}
      <View style={styles.stepDots}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>

          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <Text style={styles.title}>שכחת סיסמא?</Text>
              <Text style={styles.subtitle}>הזן את המייל שלך ונשלח לך קוד לאיפוס הסיסמא</Text>
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
                  onSubmitEditing={handleSendCode}
                  returnKeyType="send"
                />
              </View>
              {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{loading ? 'שולח...' : 'שלח קוד לאימייל'}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <>
              <Text style={styles.title}>הזן את הקוד</Text>
              <Text style={styles.subtitle}>שלחנו קוד 6 ספרות לכתובת{'\n'}{email}</Text>
              <View style={styles.field}>
                <Text style={styles.label}>קוד אימות</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  onSubmitEditing={handleVerifyCode}
                  returnKeyType="next"
                />
              </View>
              {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
              <TouchableOpacity
                style={styles.btn}
                onPress={handleVerifyCode}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>אמת קוד</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('email')} style={styles.linkBtn}>
                <Text style={styles.linkText}>לא קיבלתי קוד — שלח שוב</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New password */}
          {step === 'password' && (
            <>
              <Text style={styles.title}>סיסמא חדשה</Text>
              <Text style={styles.subtitle}>הגדר סיסמא חדשה לחשבון שלך</Text>
              <View style={styles.field}>
                <Text style={styles.label}>סיסמא חדשה</Text>
                <View style={styles.passwordRow}>
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                    <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="לפחות 8 תווים"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>אישור סיסמא</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="הזן סיסמא שוב"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  textAlign="right"
                  onSubmitEditing={handleResetPassword}
                  returnKeyType="done"
                />
              </View>
              {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{loading ? 'שומר...' : 'שמור סיסמא חדשה'}</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#6366F1', width: 24 },
  content: { flex: 1, padding: 28, gap: 20, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: '#111827', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'right', lineHeight: 22, marginTop: -8 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right' },
  input: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: '#111827',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  codeInput: {
    fontSize: 28, fontWeight: '800', letterSpacing: 8,
    textAlign: 'center', paddingVertical: 18,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 50, height: 50, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 20 },
  error: { fontSize: 14, color: '#DC2626', textAlign: 'right', fontWeight: '600' },
  btn: {
    backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  linkBtn: { alignItems: 'center', paddingVertical: 4 },
  linkText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
});
