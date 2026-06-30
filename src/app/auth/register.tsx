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
import { useMaps } from '@/context/maps-context';

const PET_OPTIONS = ['🐶 כלב', '🐱 חתול', '🐹 שרקן', '🐰 ארנב', '🐦 ציפור', '🐠 דג', '🦎 זוחל', 'אחר'];
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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

// Each suggestion stores display label + the street name to save
type Suggestion = { display: string; value: string };

// Google Places autocomplete field (web-only)
function AutocompleteField({ label, value, onChange, onSelect, placeholder, types, cityBias, required }: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  onSelect: (t: string) => void;
  placeholder: string;
  types: string[];
  cityBias?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  async function fetchSuggestions(input: string) {
    if (input.length < 2) { setSuggestions([]); setOpen(false); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const places = (window as any).google?.maps?.places;
      if (!places) return;

      const isStreet = types.includes('route');
      // For streets: search just the street name (no city appended — avoids confusing results)
      // cityBias is only used to filter by city in the display
      const query = input;

      if (places.AutocompleteService) {
        const service = new places.AutocompleteService();
        service.getPlacePredictions(
          { input: query, componentRestrictions: { country: 'il' }, types, language: 'he' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (preds: any[] | null, status: string) => {
            if (status === 'OK' && preds) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let results: any[] = preds;
              // For street search: filter to results in the selected city
              if (isStreet && cityBias) {
                const city = cityBias.trim().toLowerCase();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filtered = preds.filter((p: any) =>
                  p.description.toLowerCase().includes(city) ||
                  p.terms?.some((t: any) => t.value.toLowerCase().includes(city))
                );
                if (filtered.length > 0) results = filtered;
              }
              const sugs: Suggestion[] = results.slice(0, 5).map((p: any) => ({
                // display: full address so user can confirm city context
                display: isStreet
                  ? p.description  // "הרצל, תל אביב-יפו, ישראל"
                  : (p.terms?.[0]?.value ?? p.description.split(',')[0]),
                // value saved: street name only (first comma-separated part)
                value: (p.terms?.[0]?.value ?? p.description.split(',')[0]).trim(),
              }));
              setSuggestions(sugs);
              setOpen(sugs.length > 0);
            } else { setSuggestions([]); setOpen(false); }
          }
        );
        return;
      }

      // Fallback: new AutocompleteSuggestion API
      if (places.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
        const { suggestions: preds } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          includedRegionCodes: ['il'],
          includedPrimaryTypes: isStreet ? ['route'] : ['locality'],
          language: 'he',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let results: any[] = preds;
        if (isStreet && cityBias) {
          const city = cityBias.trim().toLowerCase();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filtered = preds.filter((s: any) =>
            (s.placePrediction?.text?.text ?? '').toLowerCase().includes(city)
          );
          if (filtered.length > 0) results = filtered;
        }
        const sugs: Suggestion[] = (results as any[]).slice(0, 5).map((s: any) => {
          const full = s.placePrediction?.text?.text ?? '';
          return { display: isStreet ? full : full.split(',')[0].trim(), value: full.split(',')[0].trim() };
        }).filter(s => s.value);
        setSuggestions(sugs);
        setOpen(sugs.length > 0);
      }
    } catch { /* ignore */ }
  }

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.asterisk}> *</Text>}
        </Text>
      </View>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={t => { onChange(t); fetchSuggestions(t); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          textAlign="right"
          autoCorrect={false}
          autoComplete="off"
        />
      </View>
      {open && suggestions.length > 0 && (
        <View style={styles.acList}>
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.acItem, i < suggestions.length - 1 && styles.acItemBorder]}
              onPress={() => { onSelect(s.value); onChange(s.value); setOpen(false); setSuggestions([]); }}
              activeOpacity={0.75}
            >
              <Text style={styles.acText}>📍 {s.display}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [age,         setAge]         = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [city,        setCity]        = useState('');
  const [street,      setStreet]      = useState('');
  const [buildingNum, setBuildingNum] = useState('');
  const [zip,         setZip]         = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [favPet,      setFavPet]      = useState<string | null>(null);

  const { isLoaded: mapsLoaded } = useMaps();
  const useAutocomplete = Platform.OS === 'web' && !!GOOGLE_MAPS_KEY && mapsLoaded;

  async function handleRegister() {
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('אנא הזן שם פרטי ושם משפחה.'); return; }
    if (!email.trim() || !email.includes('@'))  { setError('אנא הזן כתובת מייל תקינה.'); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) { setError('אנא הזן מספר טלפון תקין.'); return; }
    if (age && (parseInt(age) < 13 || parseInt(age) > 120)) { setError('אנא הזן גיל בין 13 ל-120.'); return; }
    if (password.length < 8)  { setError('הסיסמא חייבת להכיל לפחות 8 תווים.'); return; }
    if (password !== confirm) { setError('הסיסמא ואישור הסיסמא שונים.'); return; }
    if (!city.trim())         { setError('אנא הזן עיר.'); return; }
    if (!street.trim())       { setError('אנא הזן שם רחוב.'); return; }
    if (!buildingNum.trim())  { setError('אנא הזן מספר בניין.'); return; }

    setLoading(true);
    const result = await signUp({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim().toLowerCase(),
      password,
      phone:     phone.trim(),
      age:    age ? parseInt(age) : undefined,
      street: `${street.trim()} ${buildingNum.trim()}`.trim() || undefined,
      city:   city.trim() || undefined,
      zip:    zip.trim()  || undefined,
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
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>יצירת חשבון</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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

            {/* Favorite pet */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.optional}>אופציונלי</Text>
                <Text style={styles.label}>חיה אהובה</Text>
              </View>
              <View style={styles.petGrid}>
                {PET_OPTIONS.map((pet) => (
                  <TouchableOpacity
                    key={pet}
                    style={[styles.petChip, favPet === pet && styles.petChipSelected]}
                    onPress={() => setFavPet(favPet === pet ? null : pet)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.petChipText, favPet === pet && styles.petChipTextSelected]}>{pet}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי חשבון</Text>
            <Field label="אימייל" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="סיסמא" value={password} onChangeText={setPassword} placeholder="לפחות 8 תווים" secureTextEntry={!showPass} autoCapitalize="none" showToggle onToggle={() => setShowPass(p => !p)} />
            <Field label="אישור סיסמא" value={confirm} onChangeText={setConfirm} placeholder="הזן סיסמא שוב" secureTextEntry={!showPass} autoCapitalize="none" />
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>כתובת</Text>
            <Text style={styles.sectionHint}>המיקום ישמש כברירת מחדל לפרסום פריטים</Text>

            {/* City */}
            {useAutocomplete ? (
              <AutocompleteField
                label="עיר"
                value={city}
                onChange={v => { setCity(v); setStreet(''); }}
                onSelect={v => { setCity(v); setStreet(''); }}
                placeholder="תל אביב"
                types={['(cities)']}
                required
              />
            ) : (
              <Field label="עיר" value={city} onChangeText={setCity} placeholder="תל אביב" />
            )}

            {/* Street */}
            {useAutocomplete ? (
              <AutocompleteField
                label="רחוב"
                value={street}
                onChange={setStreet}
                onSelect={setStreet}
                placeholder="הרצל"
                types={['route']}
                cityBias={city}
                required
              />
            ) : (
              <Field label="רחוב" value={street} onChangeText={setStreet} placeholder="הרצל" />
            )}

            {/* Building number + ZIP */}
            <View style={styles.nameRow}>
              <View style={styles.nameCol}>
                <Field label="מיקוד" value={zip} onChangeText={setZip} placeholder="6100000" keyboardType="numeric" optional />
              </View>
              <View style={styles.nameCol}>
                <Field label="מספר בניין" value={buildingNum} onChangeText={setBuildingNum} placeholder="12" keyboardType="numeric" />
              </View>
            </View>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
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
  sectionHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: -8 },
  nameRow: { flexDirection: 'row-reverse', gap: 12 },
  nameCol: { flex: 1 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'right', flex: 1 },
  optional: { fontSize: 11, color: '#9CA3AF' },
  asterisk: { color: '#EF4444', fontWeight: '800' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F7FF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  inputText: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#111827', textAlign: 'right',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 13 },
  eyeIcon: { fontSize: 18 },
  petGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  petChip: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F8F7FF' },
  petChipSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  petChipText: { fontSize: 14, color: '#6B7280' },
  petChipTextSelected: { color: '#6366F1', fontWeight: '700' },
  // Autocomplete suggestions
  acList: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#6366F1',
    marginTop: 4, overflow: 'hidden',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
  },
  acItem: { paddingHorizontal: 16, paddingVertical: 13 },
  acItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  acText: { fontSize: 15, color: '#374151', textAlign: 'right' },
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
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'right', fontWeight: '600' },
});
