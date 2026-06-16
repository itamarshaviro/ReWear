import { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { pendingEmail, verifyCode, user } = useAuth();

  // When the user clicks the magic link in a different tab, Supabase fires
  // onAuthStateChange → auth-context sets `user` → navigate past verify.
  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleDigit(value: string, index: number) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      Alert.alert('קוד חסר', 'אנא הזן את 6 הספרות.');
      return;
    }

    setLoading(true);
    const ok = await verifyCode(code);
    setLoading(false);

    if (!ok) {
      Alert.alert('קוד שגוי', 'הקוד שהזנת אינו תקין. נסה שוב.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      return;
    }

    router.push('/auth/id-upload');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.icon}>📩</Text>
            <Text style={styles.title}>אימות אימייל</Text>
            <Text style={styles.sub}>
              שלחנו קוד בן {CODE_LENGTH} ספרות ל-{'\n'}
              <Text style={styles.email}>{pendingEmail || 'האימייל שלך'}</Text>
            </Text>
            <Text style={styles.demoNote}>
              במצב דמו: הזן כל קוד בן 6 ספרות
            </Text>
          </View>

          {/* OTP inputs */}
          <View style={styles.codeRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={el => { inputs.current[i] = el; }}
                style={[styles.digitInput, d ? styles.digitFilled : null]}
                value={d}
                onChangeText={v => handleDigit(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'מאמת...' : 'אמת קוד'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendRow} onPress={() => router.back()}>
            <Text style={styles.resendText}>לא קיבלתי קוד — שלח שוב</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28, gap: 28,
  },
  hero: { alignItems: 'center', gap: 10 },
  icon: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  email: { fontWeight: '700', color: '#6366F1' },
  demoNote: {
    fontSize: 12, color: '#9CA3AF',
    backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 100, marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  digitInput: {
    width: 46, height: 56,
    borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB',
    backgroundColor: '#fff', fontSize: 22, fontWeight: '700', color: '#111827',
  },
  digitFilled: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  btn: {
    backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 48,
    alignSelf: 'stretch', alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  resendRow: { marginTop: 4 },
  resendText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
});
