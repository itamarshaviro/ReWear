import { useState } from 'react';
import {
  Alert,
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

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: 'default' | 'numeric';
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
        textAlign="right"
        autoCorrect={false}
      />
    </View>
  );
}

export default function AddressScreen() {
  const { completeProfile } = useAuth();
  const [street, setStreet]   = useState('');
  const [city, setCity]       = useState('');
  const [zip, setZip]         = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!street.trim() || !city.trim()) {
      Alert.alert('שדות חסרים', 'אנא מלא לפחות רחוב ועיר.');
      return;
    }
    setLoading(true);
    const fullAddress = [street.trim(), city.trim(), zip.trim()].filter(Boolean).join(', ');
    await completeProfile(fullAddress);
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map(s => (
            <View key={s} style={[styles.step, styles.stepDone]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.title}>כתובת מגורים</Text>
            <Text style={styles.sub}>
              משמשת לחישוב מרחק מהפריטים.{'\n'}
              לא מוצגת למוכרים.
            </Text>
          </View>

          <View style={styles.form}>
            <Field label="רחוב ומספר" value={street} onChangeText={setStreet} placeholder="הרצל 12" />
            <Field label="עיר" value={city} onChangeText={setCity} placeholder="תל אביב" />
            <Field label="מיקוד (אופציונלי)" value={zip} onChangeText={setZip} placeholder="6100000" keyboardType="numeric" />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleFinish}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? 'יוצר חשבון...' : 'סיים הרשמה 🎉'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { completeProfile(''); router.replace('/'); }}>
              <Text style={styles.skipText}>דלג בינתיים</Text>
            </TouchableOpacity>
          </View>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  stepRow: { flexDirection: 'row', gap: 6 },
  step: { width: 28, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDone: { backgroundColor: '#6366F1' },
  content: { padding: 24, gap: 28 },
  hero: { alignItems: 'center', gap: 8, paddingTop: 8 },
  icon: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right' },
  input: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  footer: { gap: 14, alignItems: 'center' },
  btn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', alignSelf: 'stretch',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0.1 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  skipText: { fontSize: 14, color: '#9CA3AF' },
});
