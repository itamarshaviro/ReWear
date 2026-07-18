import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useMaps } from '@/context/maps-context';
import type { Condition } from '@/data/mock';
import { CATEGORY_INFO, CONDITIONS, ALL_SIZES } from '@/data/mock';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const TEL_AVIV = { lat: 32.0853, lng: 34.7818 };

// Web-only Google Maps for manual pin
let GoogleMap: React.ComponentType<any> | null = null;
let GMarker: React.ComponentType<any> | null = null;
if (Platform.OS === 'web') {
  try {
    const gmaps = require('@react-google-maps/api');
    GoogleMap = gmaps.GoogleMap;
    GMarker = gmaps.Marker;
  } catch { /* not available */ }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_KEY || !address.trim()) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=il&key=${GOOGLE_MAPS_KEY}`
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch { /* ignore */ }
  return null;
}

type LatLng = { lat: number; lng: number };

function PinPickerModal({ visible, defaultCenter, value, onChange, onClose }: {
  visible: boolean;
  defaultCenter: LatLng | null;
  value: LatLng | null;
  onChange: (p: LatLng | null) => void;
  onClose: () => void;
}) {
  const [localPin, setLocalPin] = useState<LatLng | null>(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLocalPin(value); }, [visible]);

  const { isLoaded } = useMaps();

  if (!GoogleMap || !GMarker || !GOOGLE_MAPS_KEY) return null;

  const GM = GoogleMap!;
  const Mk = GMarker!;
  const center = localPin ?? defaultCenter ?? TEL_AVIV;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pinOverlay}>
        <View style={styles.pinCard}>
          <View style={styles.pinModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.pinCloseBtn}>
              <Text style={styles.pinCloseBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.pinModalTitle}>📍 קבע מיקום מדויק</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.pinModalHint}>לחץ על המפה לנעוץ סיכה במיקום המכירה</Text>
          {isLoaded ? (
            <GM
              mapContainerStyle={{ width: '100%', height: 380, borderRadius: 14, overflow: 'hidden' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onLoad={(map: any) => { map.setCenter({ lat: center.lat, lng: center.lng }); map.setZoom(15); }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(e: any) => setLocalPin({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
              options={{ fullscreenControl: false, streetViewControl: false, mapTypeControl: false }}
            >
              {localPin && <Mk position={localPin} />}
            </GM>
          ) : (
            <View style={{ height: 380, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          )}
          <View style={styles.pinModalFooter}>
            {localPin && (
              <TouchableOpacity style={styles.pinClearBtn} onPress={() => setLocalPin(null)}>
                <Text style={styles.pinClearText}>✕ נקה סיכה</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.pinConfirmBtn, !localPin && styles.pinConfirmBtnGrey]}
              onPress={() => { onChange(localPin); onClose(); }}
            >
              <Text style={styles.pinConfirmText}>
                {localPin ? 'אשר מיקום ✓' : 'סגור'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SizeDropdown({ value, onChange, error }: { value: string; onChange: (s: string) => void; error?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownTrigger, error && styles.inputError]}
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

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, error && styles.fieldLabelError]}>
        {label}{required && <Text style={styles.req}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export default function CompleteScreen() {
  const { draft, setDraft } = useApp();
  const { user } = useAuth();

  const [name, setName] = useState(draft?.name ?? '');
  const [brand, setBrand] = useState(draft?.brand ?? '');
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(draft?.condition ?? null);
  const [price, setPrice] = useState(draft?.price ? String(draft.price) : '');
  const [size, setSize] = useState(draft?.size ?? '');
  // Full address without zip (e.g. "הרצל 12, תל אביב")
  const userAddress = (() => {
    if (!user?.address) return '';
    const parts = user.address.split(',').map(s => s.trim()).filter(Boolean);
    return parts.filter(p => !/^\d+$/.test(p)).join(', ');
  })();
  const [location, setLocation] = useState(userAddress);
  const [priceMode, setPriceMode] = useState<'suggest' | 'custom'>(draft?.price ? 'suggest' : 'custom');
  const [manualPin, setManualPin] = useState<LatLng | null>(null);
  const [defaultPinCenter, setDefaultPinCenter] = useState<LatLng | null>(null);
  const [showPinPicker, setShowPinPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const gpsRef = useRef<LatLng | null>(null);

  function clearError(field: string) {
    setErrors(prev => { const next = new Set(prev); next.delete(field); return next; });
  }

  // Geocode registered address to pre-pin map when PinPicker opens
  useEffect(() => {
    if (!showPinPicker || Platform.OS !== 'web') return;
    if (manualPin) { setDefaultPinCenter(manualPin); return; }
    if (user?.address) {
      geocodeAddress(user.address).then(geo => {
        if (geo) { setDefaultPinCenter(geo); setManualPin(geo); }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPinPicker]);

  const suggestedPrice = draft?.price;

  useEffect(() => {
    if (!draft) {
      router.replace('/');
    }
  }, [draft]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // GPS denied — suggest manual pin
        setShowPinPicker(true);
        return;
      }
      const last = await Location.getLastKnownPositionAsync();
      if (last) gpsRef.current = { lat: last.coords.latitude, lng: last.coords.longitude };
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      gpsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    })();
  }, []);

  if (!draft) return null;

  const catInfo = draft.category ? CATEGORY_INFO[draft.category] : null;

  async function goToPreview() {
    if (!draft) return;
    const newErrors = new Set<string>();
    if (!name.trim()) newErrors.add('name');
    if (!selectedCondition) newErrors.add('condition');
    if (!price) newErrors.add('price');
    if (!size) newErrors.add('size');
    if (!location.trim()) newErrors.add('location');
    if (newErrors.size > 0) { setErrors(newErrors); return; }
    setErrors(new Set());

    setSaving(true);

    // Priority: manual pin → GPS → geocode location text → geocode profile city
    let finalLat: number | undefined = manualPin?.lat ?? gpsRef.current?.lat;
    let finalLng: number | undefined = manualPin?.lng ?? gpsRef.current?.lng;

    if (!finalLat) {
      const geo = await geocodeAddress(location.trim())
        ?? (userAddress ? await geocodeAddress(userAddress) : null);
      if (geo) { finalLat = geo.lat; finalLng = geo.lng; }
    }

    setSaving(false);
    setDraft({
      ...draft,
      name: name.trim(),
      brand: brand.trim() || undefined,
      condition: selectedCondition ?? undefined,
      price: parseInt(price),
      size: size.trim(),
      location: location.trim(),
      lat: finalLat,
      lng: finalLng,
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
          <Field label="שם הפריט" required error={errors.has('name')}>
            <TextInput
              style={[styles.input, errors.has('name') && styles.inputError]}
              placeholder="לדוגמה: ג׳ינס ישר כחול"
              value={name}
              onChangeText={v => { setName(v); clearError('name'); }}
              textAlign="right"
            />
            {errors.has('name') && <Text style={styles.errorMsg}>שדה חובה — אנא הזן שם לפריט</Text>}
            {!draft.name && !errors.has('name') && (
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
          <Field label="מצב הפריט" required error={errors.has('condition')}>
            <View style={[styles.conditionList, errors.has('condition') && styles.listError]}>
              {CONDITIONS.map(c => {
                const active = selectedCondition === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.conditionRow, active && styles.conditionRowActive]}
                    onPress={() => { setSelectedCondition(c.value); clearError('condition'); }}
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
            {errors.has('condition') && <Text style={styles.errorMsg}>שדה חובה — בחר מצב פריט</Text>}
            {!draft.condition && !errors.has('condition') && (
              <Text style={styles.aiHint}>* AI לא זיהה — בחר ידנית</Text>
            )}
          </Field>

          {/* Price */}
          <Field label="מחיר (₪)" required error={errors.has('price')}>
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
                  style={[styles.input, errors.has('price') && styles.inputError]}
                  placeholder="לדוגמה: 120"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={v => { setPrice(v); clearError('price'); }}
                  textAlign="right"
                />
                {errors.has('price') && <Text style={styles.errorMsg}>שדה חובה — הזן מחיר</Text>}
                {suggestedPrice && (
                  <TouchableOpacity onPress={() => { setPriceMode('suggest'); setPrice(String(suggestedPrice)); }}>
                    <Text style={styles.backToSuggest}>← חזור להצעת AI (₪{suggestedPrice})</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Field>

          {/* Size */}
          <Field label="מידה" required error={errors.has('size')}>
            <SizeDropdown
              value={size}
              onChange={v => { setSize(v); clearError('size'); }}
              error={errors.has('size')}
            />
            {errors.has('size') && <Text style={styles.errorMsg}>שדה חובה — בחר מידה</Text>}
          </Field>

          {/* Location */}
          <Field label="מיקום כללי" required error={errors.has('location')}>
            <TextInput
              style={[styles.input, errors.has('location') && styles.inputError]}
              placeholder="לדוגמה: תל אביב, הרצליה..."
              value={location}
              onChangeText={v => { setLocation(v); clearError('location'); }}
              textAlign="right"
            />
            {errors.has('location') && <Text style={styles.errorMsg}>שדה חובה — הזן מיקום</Text>}
            <TouchableOpacity
              style={[styles.pinToggle, manualPin && styles.pinToggleActive]}
              onPress={() => setShowPinPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pinToggleText, manualPin && styles.pinToggleTextActive]}>
                {manualPin ? '📍 מיקום מדויק נקבע ✓' : '📍 דייק מיקום על המפה'}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <PinPickerModal
                visible={showPinPicker}
                defaultCenter={defaultPinCenter}
                value={manualPin}
                onChange={setManualPin}
                onClose={() => setShowPinPicker(false)}
              />
            )}
          </Field>

          <TouchableOpacity
            style={[styles.previewBtn, saving && styles.previewBtnDisabled]}
            onPress={goToPreview}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.previewBtnText}>{saving ? 'מאתר מיקום...' : 'תצוגה מקדימה →'}</Text>
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
  inputError: { borderColor: '#EF4444', borderWidth: 2 },
  listError: { borderColor: '#EF4444', borderWidth: 2 },
  errorMsg: { fontSize: 12, color: '#EF4444', fontWeight: '600', textAlign: 'right', marginTop: 4 },
  fieldLabelError: { color: '#EF4444' },
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

  pinToggle: {
    alignSelf: 'flex-end', marginTop: 8,
    backgroundColor: '#EEF2FF', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  pinToggleActive: { backgroundColor: '#D1FAE5' },
  pinToggleText: { fontSize: 13, color: '#6366F1', fontWeight: '700' },
  pinToggleTextActive: { color: '#059669' },

  // Pin picker modal
  pinOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  pinCard: {
    backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 560,
    padding: 20, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25, shadowRadius: 32, elevation: 20,
  },
  pinModalHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  pinCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  pinCloseBtnText: { fontSize: 16, color: '#374151', fontWeight: '700' },
  pinModalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  pinModalHint: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  pinModalFooter: { flexDirection: 'row-reverse', gap: 10, marginTop: 4 },
  pinClearBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  pinClearText: { fontSize: 14, color: '#EF4444', fontWeight: '700' },
  pinConfirmBtn: {
    flex: 1, backgroundColor: '#6366F1', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  pinConfirmBtnGrey: { backgroundColor: '#9CA3AF' },
  pinConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
