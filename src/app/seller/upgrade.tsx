import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';

const PREMIUM_PRICE = 20; // ₪ per month — change here to update everywhere

export default function UpgradeScreen() {
  const { upgradePremium, isPremium } = useApp();

  const [cardNumber, setCardNumber] = useState('');
  const [cardName,   setCardName]   = useState('');
  const [expiry,     setExpiry]     = useState('');
  const [cvv,        setCvv]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  function formatCard(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  function validate() {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 16) return 'מספר כרטיס אינו תקין';
    if (!cardName.trim()) return 'יש להזין שם על הכרטיס';
    if (expiry.length < 5) return 'תאריך תפוגה אינו תקין';
    if (cvv.length < 3) return 'CVV אינו תקין';
    return null;
  }

  async function handlePay() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400)); // simulate payment
    await upgradePremium();
    setLoading(false);
    setDone(true);
  }

  if (done || isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successScreen}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>ברוך הבא לפרמיום!</Text>
          <Text style={styles.successSub}>עכשיו תוכל להעלות עד 50 פריטים</Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => router.replace('/seller/dashboard')}>
            <Text style={styles.successBtnText}>לדשבורד ←</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>→</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>שדרוג לפרמיום</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Plan card */}
          <View style={styles.planCard}>
            <View style={styles.planBadge}><Text style={styles.planBadgeText}>⭐ פרמיום</Text></View>
            <Text style={styles.planPrice}>₪{PREMIUM_PRICE}</Text>
            <Text style={styles.planPer}>לחודש</Text>
            <View style={styles.perks}>
              {[
                'עד 50 פריטים פעילים',
                'עדיפות בתצוגה לקונים',
                'תג מוכר מאומת',
                'סטטיסטיקות מתקדמות',
              ].map(p => (
                <View key={p} style={styles.perkRow}>
                  <Text style={styles.perkText}>{p}</Text>
                  <Text style={styles.perkCheck}>✓</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>פרטי כרטיס אשראי</Text>

            <View style={styles.field}>
              <Text style={styles.label}>מספר כרטיס</Text>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={t => setCardNumber(formatCard(t))}
                placeholder="0000 0000 0000 0000"
                keyboardType="number-pad"
                textAlign="right"
                maxLength={19}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>שם בעל הכרטיס</Text>
              <TextInput
                style={styles.input}
                value={cardName}
                onChangeText={setCardName}
                placeholder="ישראל ישראלי"
                textAlign="right"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>תוקף</Text>
                <TextInput
                  style={styles.input}
                  value={expiry}
                  onChangeText={t => setExpiry(formatExpiry(t))}
                  placeholder="MM/YY"
                  keyboardType="number-pad"
                  textAlign="right"
                  maxLength={5}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  value={cvv}
                  onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  keyboardType="number-pad"
                  textAlign="right"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <Text style={styles.secureNote}>🔒 התשלום מאובטח ומוצפן</Text>

          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnLoading]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>
              {loading ? 'מעבד תשלום...' : `שלם ₪${PREMIUM_PRICE} ושדרג`}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  planCard: {
    backgroundColor: '#6366F1', borderRadius: 24, padding: 24, alignItems: 'center', gap: 6,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  planBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5 },
  planBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  planPrice: { fontSize: 56, fontWeight: '900', color: '#fff', marginTop: 4 },
  planPer: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: -8 },
  perks: { width: '100%', gap: 10, marginTop: 16 },
  perkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  perkCheck: { fontSize: 16, color: '#A5F3FC', fontWeight: '900' },
  perkText: { fontSize: 14, color: '#fff', fontWeight: '600', flex: 1, textAlign: 'right' },

  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  formTitle: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', textAlign: 'right' },
  input: {
    backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827',
  },
  row: { flexDirection: 'row-reverse', gap: 12 },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center', fontWeight: '600' },

  secureNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },

  payBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  payBtnLoading: { backgroundColor: '#A5B4FC' },
  payBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  successEmoji: { fontSize: 72 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  successBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, marginTop: 8,
  },
  successBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
