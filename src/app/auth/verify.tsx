import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function VerifyScreen() {
  const { user, pendingEmail, verifyOtp, resendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleVerify() {
    if (code.length !== 6) { setError('הזן קוד בן 6 ספרות'); return; }
    setLoading(true);
    setError('');
    const err = await verifyOtp(code);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace({ pathname: '/auth', params: { verified: '1' } });
    }
  }

  async function handleResend() {
    setResendLoading(true);
    const err = await resendOtp();
    setResendLoading(false);
    if (!err) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    }
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '...';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📩</Text>
        <Text style={styles.title}>אמת את האימייל שלך</Text>
        <Text style={styles.sub}>
          שלחנו קוד בן 6 ספרות ל-{maskedEmail}{'\n'}
          הזן אותו כאן:
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          placeholder="000000"
          placeholderTextColor="#D1D5DB"
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>אמת חשבון ✓</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendLoading} style={styles.resendRow}>
          {resendLoading
            ? <ActivityIndicator size="small" color="#6366F1" />
            : <Text style={[styles.resendText, resendSuccess && styles.resendSuccess]}>
                {resendSuccess ? '✓ קוד חדש נשלח!' : 'לא קיבלת? שלח שוב'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth')} style={styles.backLink}>
          <Text style={styles.backLinkText}>חזור להתחברות</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  icon: { fontSize: 72 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center' },
  sub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  codeInput: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    textAlign: 'center',
  },
  error: { fontSize: 14, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  resendRow: { paddingVertical: 8 },
  resendText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  resendSuccess: { color: '#16A34A' },
  backLink: { paddingVertical: 4 },
  backLinkText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
});
