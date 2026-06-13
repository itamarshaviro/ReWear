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
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { CATEGORY_INFO, CONDITION_LABELS } from '@/data/mock';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

export default function CompleteScreen() {
  const { draft, setDraft, addListing, canAddMore, listingCount, limit, isPremium, upgradePremium } = useApp();

  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [location, setLocation] = useState('');

  if (!draft) {
    router.replace('/seller/upload');
    return null;
  }

  const catInfo = CATEGORY_INFO[draft.category];

  function submit() {
    if (!draft) return;
    if (!price || !size || !location) {
      Alert.alert('שדות חסרים', 'אנא מלא מחיר, מידה ומיקום.');
      return;
    }
    if (!canAddMore) {
      Alert.alert(
        'הגעת למגבלה',
        isPremium ? `פרסמת ${limit} פריטים (מגבלה פרמיום)` : 'מגבלת חינם: 5 פריטים. שדרג לפרמיום.',
        isPremium
          ? [{ text: 'אישור' }]
          : [
              { text: 'ביטול', style: 'cancel' },
              { text: 'שדרג לפרמיום 🚀', onPress: upgradePremium },
            ]
      );
      return;
    }

    addListing({
      name: draft.name,
      brand: draft.brand,
      category: draft.category,
      condition: draft.condition,
      description: draft.description,
      price: parseInt(price),
      size,
      location,
      imageUrl: draft.imageUri,
    });
    setDraft(null);
    router.replace('/seller/dashboard');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>פרסם פריט</Text>
        <View style={{ width: 40 }} />
      </View>

      {!canAddMore && !isPremium && (
        <TouchableOpacity style={styles.premiumBanner} onPress={upgradePremium}>
          <Text style={styles.premiumBannerText}>🚀 שדרג לפרמיום — עד 50 פריטים</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image + AI results */}
          <View style={styles.imageRow}>
            <Image source={{ uri: draft.imageUri }} style={styles.thumb} contentFit="cover" />
            <View style={styles.aiInfo}>
              <View style={styles.aiTag}><Text style={styles.aiTagText}>✨ AI</Text></View>
              <Text style={styles.aiName}>{draft.name}</Text>
              <Text style={styles.aiBrand}>{draft.brand}</Text>
              <InfoRow label="קטגוריה" value={`${catInfo.emoji} ${catInfo.label}`} />
              <InfoRow label="מצב" value={CONDITION_LABELS[draft.condition]} />
            </View>
          </View>

          <View style={styles.descBox}>
            <Text style={styles.descLabel}>תיאור שנוצר ע"י AI</Text>
            <Text style={styles.descText}>{draft.description}</Text>
          </View>

          {/* User fills */}
          <Text style={styles.sectionTitle}>השלם את הפרטים</Text>

          <Field label="מחיר (₪) *">
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: 120"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              textAlign="right"
            />
          </Field>

          <Field label="מידה *">
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: M, 32, 38..."
              value={size}
              onChangeText={setSize}
              textAlign="right"
            />
          </Field>

          <Field label="מיקום כללי *">
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: תל אביב, הרצליה..."
              value={location}
              onChangeText={setLocation}
              textAlign="right"
            />
          </Field>

          <View style={styles.limitRow}>
            <Text style={styles.limitText}>
              {listingCount}/{isPremium ? '50' : '5'} פריטים{' '}
              {!isPremium && <Text style={styles.upgradeLink} onPress={upgradePremium}>· שדרג לפרמיום</Text>}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !canAddMore && styles.submitBtnDisabled]}
            onPress={submit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>פרסם פריט 🚀</Text>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  premiumBanner: {
    backgroundColor: '#FEF3C7', marginHorizontal: 20, marginBottom: 4,
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  premiumBannerText: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  content: { padding: 20, gap: 16 },
  imageRow: { flexDirection: 'row-reverse', gap: 14, alignItems: 'flex-start' },
  thumb: { width: 110, height: 140, borderRadius: 16 },
  aiInfo: { flex: 1, gap: 6 },
  aiTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-end' },
  aiTagText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  aiName: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'right' },
  aiBrand: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', minWidth: 50 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  descBox: {
    backgroundColor: '#EEF2FF', borderRadius: 16, padding: 14, gap: 6,
  },
  descLabel: { fontSize: 12, fontWeight: '700', color: '#6366F1', textAlign: 'right' },
  descText: { fontSize: 14, color: '#374151', textAlign: 'right', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'right', marginTop: 4 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'right' },
  input: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  limitRow: { alignItems: 'flex-end' },
  limitText: { fontSize: 13, color: '#9CA3AF' },
  upgradeLink: { color: '#6366F1', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0.1 },
  submitText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
