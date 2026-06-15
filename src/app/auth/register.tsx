import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textAlign="right"
        autoCorrect={false}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleNext() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('שדות חסרים', 'אנא מלא את כל השדות.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('מייל לא תקין', 'אנא הזן כתובת מייל תקינה.');
      return;
    }
    if (phone.length < 9) {
      Alert.alert('טלפון לא תקין', 'אנא הזן מספר טלפון תקין.');
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email, phone });
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.logo}>ReWear</Text>
            <Text style={styles.title}>יצירת חשבון</Text>
            <Text style={styles.sub}>הצטרף לקהילת הבגדים יד שנייה</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Field label="שם פרטי" value={firstName} onChangeText={setFirstName} placeholder="ישראל" autoCapitalize="words" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="שם משפחה" value={lastName} onChangeText={setLastName} placeholder="כהן" autoCapitalize="words" />
              </View>
            </View>

            <Field label="אימייל" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="טלפון" value={phone} onChangeText={setPhone} placeholder="050-1234567" keyboardType="phone-pad" autoCapitalize="none" />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? 'שולח קוד...' : 'המשך →'}</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              קוד אימות יישלח לאימייל שלך
            </Text>

            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.skipText}>כבר יש לי חשבון — דלג</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { padding: 24, gap: 32 },
  hero: { alignItems: 'center', gap: 8, paddingTop: 16 },
  logo: { fontSize: 36, fontWeight: '900', color: '#6366F1', letterSpacing: -1 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  form: { gap: 16 },
  nameRow: { flexDirection: 'row-reverse', gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  footer: { gap: 14, alignItems: 'center' },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  hint: { fontSize: 13, color: '#9CA3AF' },
  skipText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
});
