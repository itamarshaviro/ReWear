import { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/auth-context';
import type { Condition } from '@/data/mock';
import { CATEGORY_INFO, CONDITIONS, ALL_SIZES } from '@/data/mock';

function SizeDropdown({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
        <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
          {value || 'בחר מידה'}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {ALL_SIZES.map((s, i) => (
              <TouchableOpacity
                key={s}
                style={[styles.dropdownItem, i < ALL_SIZES.length - 1 && styles.dropdownItemBorder, value === s && styles.dropdownItemActive]}
                onPress={() => { onChange(s); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, value === s && styles.dropdownItemTextActive]}>{s}</Text>
                {value === s && <Text style={styles.dropdownCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={styles.req}> *</Text>}</Text>
      {children}
    </View>
  );
}

export default function CompleteScreen() {
  const { draft, setDraft, canAddMore, listingCount, limit, isPremium, upgradePremium } = useApp();
  const { user } = useAuth();

  const [name, setName] = useState(draft?.name ?? '');
  const [brand, setBrand] = useState(draft?.brand ?? '');
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(draft?.condition ?? null);
  const [price, setPrice] = useState(draft?.price ? String(draft.price) : '');
  const [size, setSize] = useState(draft?.size ?? '');
  const userCity = user?.address ? user.address.split(',')[1]?.trim() ?? '' : '';
  const [location, setLocation] = useState(userCity);
  const [priceMode, setPriceMode] = useState<'suggest' | 'custom'>(draft?.price ? 'suggest' : 'custom');

  const suggestedPrice = draft?.price;

  useEffect(() => {
    if (!draft) {
      router.replace('/');
    }
  }, [draft]);

  if (!draft) return null;

  const catInfo = draft.category ? CATEGORY_INFO[draft.category] : null;

  function goToPreview() {
    if (!draft) return;
    if (!name.trim()) {
      Alert.alert('שדה חסר', 'אנא הזן שם לפריט.');
      return;
    }
    if (!selectedCondition) {
      Alert.alert('שדה חסר', 'אנא בחר מצב פריט.');
      return;
    }
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

    setDraft({
      ...draft,
      name: name.trim(),
      brand: brand.trim() || undefined,
      condition: selectedCondition,
      price: parseInt(price),
      size: size.trim(),
      location: location.trim(),
    });
    router.push('/seller/preview');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
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
          {/* Image preview */}
          <View style={styles.imageRow}>
            <Image source={{ uri: draft.imageUri }} style={styles.thumb} contentFit="cover" />
            <View style={styles.aiInfo}>
              <View style={styles.aiTag}><Text style={styles.aiTagText}>✨ AI</Text></View>
              {catInfo && <Text style={styles.catLabel}>{catInfo.emoji} {catInfo.label}</Text>}
              {draft.color && (
                <View style={styles.colorRow}>
                  <Text style={styles.colorDot}>●</Text>
                  <Text style={styles.colorText}>{draft.color}</Text>
                </View>
              )}
              {draft.description ? (
                <Text style={styles.descPreview} numberOfLines={3}>{draft.description}</Text>
              ) : null}
            </View>
          </View>

          {/* Name — AI pre-filled or blank */}
          <Field label="שם הפריט" required>
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: ג׳ינס ישר כחול"
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
            {!draft.name && (
              <Text style={styles.aiHint}>* AI לא זיהה — מלא ידנית</Text>
            )}
          </Field>

          {/* Brand — AI pre-filled or blank */}
          <Field label="מותג (אופציונלי)">
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: Zara, H&M..."
              value={brand}
              onChangeText={setBrand}
              textAlign="right"
            />
          </Field>

          {/* Condition picker */}
          <Field label="מצב הפריט" required>
            <View style={styles.conditionList}>
              {CONDITIONS.map(c => {
                const active = selectedCondition === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.conditionRow, active && styles.conditionRowActive]}
                    onPress={() => setSelectedCondition(c.value)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.conditionDot, active && { backgroundColor: c.color }]} />
                    <Text style={[styles.conditionLabel, active && { color: c.color, fontWeight: '700' }]}>
                      {c.label}
                    </Text>
                    <View style={[styles.radioOuter, active && { borderColor: c.color }]}>
                      {active && <View style={[styles.radioInner, { backgroundColor: c.color }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!draft.condition && (
              <Text style={styles.aiHint}>* AI לא זיהה — בחר ידנית</Text>
            )}
          </Field>

          {/* Price */}
          <Field label="מחיר (₪)" required>
            {suggestedPrice && priceMode === 'suggest' ? (
              <View style={styles.priceSuggestCard}>
                <View style={styles.priceSuggestHeader}>
                  <Text style={styles.priceSuggestLabel}>הצעת AI לפי מותג ומצב הפריט</Text>
                  <Text style={styles.priceSuggestIcon}>💡</Text>
                </View>
                <Text style={styles.priceSuggestAmount}>₪{suggestedPrice}</Text>
                <View style={styles.priceSuggestBtns}>
                  <TouchableOpacity
                    style={styles.priceSuggestAccept}
                    onPress={() => { setPrice(String(suggestedPrice)); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.priceSuggestAcceptText}>✓ קבל הצעה</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.priceSuggestOverride}
                    onPress={() => { setPriceMode('custom'); setPrice(''); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.priceSuggestOverrideText}>הזן מחיר אחר</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="לדוגמה: 120"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                  textAlign="right"
                />
                {suggestedPrice && (
                  <TouchableOpacity onPress={() => { setPriceMode('suggest'); setPrice(String(suggestedPrice)); }}>
                    <Text style={styles.backToSuggest}>← חזור להצעת AI (₪{suggestedPrice})</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Field>

          {/* Size */}
          <Field label="מידה" required>
            <SizeDropdown value={size} onChange={setSize} />
          </Field>

          {/* Location */}
          <Field label="מיקום כללי" required>
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
            style={[styles.previewBtn, !canAddMore && styles.previewBtnDisabled]}
            onPress={goToPreview}
            activeOpacity={0.85}
          >
            <Text style={styles.previewBtnText}>תצוגה מקדימה →</Text>
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
  content: { padding: 20, gap: 18 },
  imageRow: { flexDirection: 'row-reverse', gap: 14, alignItems: 'flex-start' },
  thumb: { width: 100, height: 130, borderRadius: 16 },
  aiInfo: { flex: 1, gap: 6 },
  aiTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-end' },
  aiTagText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  catLabel: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'right' },
  colorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  colorDot: { color: '#6366F1', fontSize: 12 },
  colorText: { fontSize: 13, color: '#6B7280' },
  descPreview: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', lineHeight: 18 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'right' },
  req: { color: '#F43F5E' },
  input: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  aiHint: { fontSize: 11, color: '#F59E0B', textAlign: 'right', marginTop: 2 },
  conditionList: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  conditionRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  conditionRowActive: { backgroundColor: '#FAFAFA' },
  conditionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' },
  conditionLabel: { flex: 1, fontSize: 15, color: '#374151', textAlign: 'right' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  dropdownTrigger: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  dropdownValue: { fontSize: 16, color: '#111827', fontWeight: '600' },
  dropdownPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  dropdownArrow: { fontSize: 11, color: '#6366F1', fontWeight: '700' },
  dropdownList: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#6366F1',
    marginTop: 6, overflow: 'hidden',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
  },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemActive: { backgroundColor: '#EEF2FF' },
  dropdownItemText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  dropdownItemTextActive: { color: '#6366F1', fontWeight: '700' },
  dropdownCheck: { fontSize: 14, color: '#6366F1', fontWeight: '800' },
  limitRow: { alignItems: 'flex-end' },
  limitText: { fontSize: 13, color: '#9CA3AF' },
  upgradeLink: { color: '#6366F1', fontWeight: '700' },
  previewBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  previewBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0.1 },
  previewBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },

  priceSuggestCard: {
    backgroundColor: '#FFF7ED', borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1.5, borderColor: '#FED7AA',
  },
  priceSuggestHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  priceSuggestIcon: { fontSize: 20 },
  priceSuggestLabel: { fontSize: 13, color: '#92400E', fontWeight: '600', textAlign: 'right' },
  priceSuggestAmount: { fontSize: 36, fontWeight: '900', color: '#D97706', textAlign: 'right' },
  priceSuggestBtns: { flexDirection: 'row-reverse', gap: 10 },
  priceSuggestAccept: {
    flex: 1, backgroundColor: '#6366F1', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  priceSuggestAcceptText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  priceSuggestOverride: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  priceSuggestOverrideText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  backToSuggest: { fontSize: 12, color: '#6366F1', fontWeight: '600', textAlign: 'right', marginTop: 6 },
});
