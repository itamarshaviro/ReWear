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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
  optional?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  showToggle?: boolean;
  onToggle?: () => void;
};

function Field({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', secureTextEntry = false,
  optional = false, autoCapitalize = 'sentences',
  showToggle = false, onToggle,
}: FieldProps) {
  const required = !optional;
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        {optional && <Text style={styles.optional}>אופציונלי</Text>}
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.asterisk}> *</Text>}
        </Text>
      </View>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={
            showToggle ? 'new-password'
            : keyboardType === 'email-address' ? 'email'
            : keyboardType === 'phone-pad' ? 'tel'
            : 'off'
          }
          textAlign="right"
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{secureTextEntry ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [age,       setAge]       = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [street,    setStreet]    = useState('');
  const [city,      setCity]      = useState('');
  const [zip,       setZip]       = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleRegister() {
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('אנא הזן שם פרטי ושם משפחה.'); return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('אנא הזן כתובת מייל תקינה.'); return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setError('אנא הזן מספר טלפון תקין.'); return;
    }
    if (age && (parseInt(age) < 13 || parseInt(age) > 120)) {
      setError('אנא הזן גיל בין 13 ל-120.'); return;
    }
    if (password.length < 8) {
      setError('הסיסמא חייבת להכיל לפחות 8 תווים.'); return;
    }
    if (password !== confirm) {
      setError('הסיסמא ואישור הסיסמא שונים.'); return;
    }
    if (!street.trim()) {
      setError('אנא הזן כתובת (רחוב ומספר).'); return;
    }
    if (!city.trim()) {
      setError('אנא הזן עיר.'); return;
    }

    setLoading(true);
    const result = await signUp({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim().toLowerCase(),
      password,
      phone:     phone.trim(),
      age:    age ? parseInt(age) : undefined,
      street: street.trim() || undefined,
      city:   city.trim()   || undefined,
      zip:    zip.trim()    || undefined,
    });
    setLoading(false);

    if (result === 'ok') {
      router.replace({ pathname: '/auth', params: { registered: '1' } });
    } else if (result === 'needs-verify') {
      router.replace('/auth/verify');
    } else {
      setError(result as string);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>יצירת חשבון</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Personal info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטים אישיים</Text>

            <View style={styles.nameRow}>
              <View style={styles.nameCol}>
                <Field label="שם פרטי" value={firstName} onChangeText={setFirstName} placeholder="ישראל" autoCapitalize="words" />
              </View>
              <View style={styles.nameCol}>
                <Field label="שם משפחה" value={lastName} onChangeText={setLastName} placeholder="כהן" autoCapitalize="words" />
              </View>
            </View>

            <Field label="טלפון" value={phone} onChangeText={setPhone} placeholder="050-1234567" keyboardType="phone-pad" />
            <Field label="גיל" value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" optional />
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי חשבון</Text>
            <Field
              label="אימייל"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="סיסמא"
              value={password}
              onChangeText={setPassword}
              placeholder="לפחות 8 תווים"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              showToggle
              onToggle={() => setShowPass(p => !p)}
            />
            <Field
              label="אישור סיסמא"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="הזן סיסמא שוב"
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>כתובת</Text>
            <Field label="רחוב ומספר" value={street} onChangeText={setStreet} placeholder="הרצל 12" />
            <Field label="עיר" value={city} onChangeText={setCity} placeholder="תל אביב" />
            <Field label="מיקוד" value={zip} onChangeText={setZip} placeholder="6100000" keyboardType="numeric" optional />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'יוצר חשבון...' : 'צור חשבון 🎉'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/auth')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>כבר יש לי חשבון — התחבר</Text>
          </TouchableOpacity>

        </ScrollView>
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
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  content: { padding: 20, gap: 20, paddingBottom: 40 },

  section: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 18, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  sectionOptional: { fontSize: 12, color: '#9CA3AF', fontWeight: '400' },

  nameRow: { flexDirection: 'row-reverse', gap: 12 },
  nameCol: { flex: 1 },

  field: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right', flex: 1 },
  optional: { fontSize: 11, color: '#9CA3AF' },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  inputText: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    textAlign: 'right',
  },
  asterisk: { color: '#EF4444', fontWeight: '800' },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  eyeIcon: { fontSize: 18 },

  btn: {
    backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FEF2F2', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'right', fontWeight: '600' },
});
