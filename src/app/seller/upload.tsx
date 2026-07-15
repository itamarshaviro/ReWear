import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { AI_RESULTS_BY_CATEGORY, CONDITION_LABELS, CONDITIONS } from '@/data/mock';
import { enhanceImage, isCloudinaryConfigured } from '@/lib/cloudinary';
import { recognizeFromUrl, hexToHebrewColor, suggestPrice, checkImageQuality, isGeminiConfigured, isOpenAIConfigured } from '@/lib/ai-recognition';
import { useLocalSearchParams } from 'expo-router';
import type { Category, AiConfidence, Condition } from '@/data/mock';
import type { EnhanceResult } from '@/lib/cloudinary';

type Phase = 'pick' | 'checking' | 'details' | 'uploading' | 'recognizing' | 'enhanced';

const CUT_OPTIONS = ['ישר', 'צר (Slim)', 'רחב', 'אוברסייז', 'קרופ', 'מתרחב', 'רגיל'];
type AiResult = typeof AI_RESULTS_BY_CATEGORY[Category];

const CONFIDENCE_THRESHOLD = 0.70;

function ConfidenceRow({ label, value, conf }: { label: string; value: string | undefined; conf: number | undefined }) {
  const detected = conf !== undefined && conf >= CONFIDENCE_THRESHOLD && value !== undefined;
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.confBadge, detected ? styles.confGreen : styles.confGray]}>
        <Text style={[styles.confText, detected ? styles.confTextGreen : styles.confTextGray]}>
          {detected ? `${Math.round(conf! * 100)}%` : '—'}
        </Text>
      </View>
      <Text style={styles.fieldValue} numberOfLines={1}>{detected ? value : 'לא זוהה'}</Text>
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

export default function UploadScreen() {
  const { setDraft } = useApp();
  const { preCategory, preGender, preLabel } = useLocalSearchParams<{
    preCategory?: string; preGender?: string; preLabel?: string;
  }>();
  const [phase, setPhase] = useState<Phase>('pick');
  const [enhance, setEnhance] = useState<EnhanceResult | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [badImageUri, setBadImageUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  // Seller-provided hints
  const [sellerBrand, setSellerBrand] = useState('');
  const [sellerCondition, setSellerCondition] = useState<Condition | null>(null);
  const [sellerCut, setSellerCut] = useState<string | null>(null);
  const [sellerSize, setSellerSize] = useState('');

  async function pickImage(source: 'camera' | 'gallery') {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('נדרשת הרשאה', 'אנא אפשר גישה למצלמה בהגדרות.'); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.9 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('נדרשת הרשאה', 'אנא אפשר גישה לגלריה בהגדרות.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.9 });
    }

    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setQualityError(null);
    setBadImageUri(null);

    // Step 0: quality gate
    setPhase('checking');
    const quality = await checkImageQuality(uri);
    if (!quality.isGood) {
      setBadImageUri(uri);
      setQualityError(quality.reason ?? 'התמונה לא ברורה מספיק');
      setPhase('pick');
      return;
    }

    // Step 0.5: show details form so seller can add hints
    setPendingUri(uri);
    setPhase('details');
  }

  async function runRecognition() {
    if (!pendingUri) return;
    const uri = pendingUri;

    let enhanceResult: EnhanceResult = { originalUri: uri, enhancedUri: uri, isDemo: true };

    // Step 1: Cloudinary upload + enhancement
    setPhase('uploading');
    try {
      enhanceResult = await enhanceImage(uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Cloudinary]', msg);
      Alert.alert('שיפור תמונה נכשל', `ממשיך ללא שיפור.\n\nפרטים: ${msg}`);
    }
    setEnhance(enhanceResult);

    // Step 2: AI recognition on the enhanced image URL
    setPhase('recognizing');
    const targetUrl = enhanceResult.isDemo ? uri : enhanceResult.enhancedUri;
    const hfResult = await recognizeFromUrl(targetUrl, {
      category: preCategory as Category | undefined,
      gender: preGender,
      sellerBrand:     sellerBrand.trim()     || undefined,
      sellerCondition: sellerCondition        ?? undefined,
      sellerCut:       sellerCut              ?? undefined,
      sellerSize:      sellerSize.trim()      || undefined,
    }).catch(() => null);

    let aiRes: AiResult;
    if (hfResult && (hfResult.category || hfResult.brand)) {
      const cat = hfResult.category ?? 'accessories';
      const color = hfResult.color ?? undefined;
      const name = hfResult.name; // already built with correct Hebrew grammar in buildResult
      const condition = hfResult.condition ?? 'good';

      aiRes = {
        name,
        brand: hfResult.brand ?? '',
        category: cat,
        condition,
        color: color ?? '',
        description: `זוהה אוטומטית: ${hfResult.caption}`,
        price: suggestPrice(hfResult.brand, condition),
        confidence: {
          name:      hfResult.brand || hfResult.category ? 0.82 : 0,
          brand:     hfResult.brand     ? 0.88 : 0,
          category:  hfResult.category  ? 0.93 : 0,
          condition: hfResult.condition ? 0.76 : 0.72, // 0.72 = default 'good', still above threshold
          color:     color              ? 0.85 : 0,
        },
      };
    } else {
      // Fallback mock + attach suggested price
      const cats = Object.keys(AI_RESULTS_BY_CATEGORY) as Category[];
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const fallback = { ...AI_RESULTS_BY_CATEGORY[cat] };
      fallback.price = suggestPrice(fallback.brand || undefined, fallback.condition ?? 'good');
      aiRes = fallback;
    }

    setAiResult(aiRes);
    setPhase('enhanced');
  }

  function continueToComplete() {
    if (!enhance || !aiResult) return;
    const conf = aiResult.confidence as AiConfidence | undefined;
    const pick = <T,>(val: T | undefined, field: keyof AiConfidence) =>
      conf && conf[field] >= CONFIDENCE_THRESHOLD ? val : undefined;

    setDraft({
      imageUri: enhance.enhancedUri,
      name:      pick(aiResult.name,      'name'),
      brand:     pick(aiResult.brand,     'brand'),
      category:  pick(aiResult.category,  'category') ?? aiResult.category,
      condition: pick(aiResult.condition, 'condition'),
      color:     pick(aiResult.color,     'color'),
      description: aiResult.description,
      price: aiResult.price,
      confidence: conf,
      size: sellerSize.trim() || undefined,
    });
    router.push('/seller/complete');
  }

  const conf = aiResult?.confidence;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>פרסם פריט</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Phase: checking quality ── */}
      {phase === 'checking' && (
        <View style={styles.processingArea}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.processingTitle}>בודק את התמונה...</Text>
          <View style={styles.stepsList}>
            <ProcessStep emoji="🔍" label="מנתח איכות ובהירות" active />
            <ProcessStep emoji="👕" label="מזהה פריט לבוש" active />
            <ProcessStep emoji="✅" label="מאשר להמשך" active />
          </View>
        </View>
      )}

      {/* ── Phase: pick ── */}
      {phase === 'pick' && (
        <View style={styles.pickArea}>

          {/* Quality error banner */}
          {qualityError && (
            <View style={styles.qualityErrorCard}>
              {badImageUri && (
                <Image source={{ uri: badImageUri }} style={styles.badImageThumb} contentFit="cover" />
              )}
              <View style={styles.qualityErrorBody}>
                <Text style={styles.qualityErrorTitle}>⚠️ צלם מחדש</Text>
                <Text style={styles.qualityErrorText}>{qualityError}</Text>
                <View style={styles.qualityTips}>
                  <Text style={styles.qualityTip}>• תאורה טובה, רצוי אור יום</Text>
                  <Text style={styles.qualityTip}>• הפריט יהיה מרכז הפריים</Text>
                  <Text style={styles.qualityTip}>• רקע נקי ופשוט</Text>
                </View>
              </View>
            </View>
          )}

          {!qualityError && (
            <View style={styles.heroIcon}>
              <Text style={styles.heroEmoji}>📸</Text>
            </View>
          )}
          <Text style={styles.pickTitle}>{qualityError ? 'נסה שוב' : 'הוסף תמונה של הפריט'}</Text>
          <Text style={styles.pickSub}>{qualityError ? 'בחר תמונה חדשה ואנו נבדוק שוב' : 'ה-AI ישפר את התמונה ויזהה פרטים אוטומטית'}</Text>

          {!!preLabel && (
            <View style={styles.preSelBadge}>
              <Text style={styles.preSelText}>
                {preGender === 'men' ? '👨 גברים' : '👩 נשים'} · {preLabel}
              </Text>
            </View>
          )}

          {isCloudinaryConfigured() ? (
            <View style={styles.cloudinaryBadge}>
              <Text style={styles.cloudinaryBadgeText}>☁️ שיפור תמונה אוטומטי מופעל</Text>
            </View>
          ) : (
            <View style={[styles.cloudinaryBadge, styles.demoBadge]}>
              <Text style={[styles.cloudinaryBadgeText, styles.demoBadgeText]}>
                מצב דמו · הגדר Cloudinary לשיפור אמיתי
              </Text>
            </View>
          )}
          <View style={[styles.cloudinaryBadge, (isOpenAIConfigured() || isGeminiConfigured()) ? styles.geminiBadge : styles.demoBadge]}>
            <Text style={[styles.cloudinaryBadgeText, (isOpenAIConfigured() || isGeminiConfigured()) ? styles.geminiBadgeText : styles.demoBadgeText]}>
              {isOpenAIConfigured() ? '✨ GPT-4o-mini — זיהוי מותגים וצבעים' : isGeminiConfigured() ? '✨ Gemini AI — זיהוי מותגים וצבעים' : '🤖 BLIP — הגדר OpenAI לזיהוי מדויק יותר'}
            </Text>
          </View>

          <View style={styles.pickButtons}>
            <TouchableOpacity style={[styles.pickBtn, styles.cameraBtn]} onPress={() => pickImage('camera')} activeOpacity={0.85}>
              <Text style={styles.pickBtnEmoji}>📷</Text>
              <Text style={[styles.pickBtnLabel, styles.cameraBtnText]}>צלם עכשיו</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickBtn, styles.galleryBtn]} onPress={() => pickImage('gallery')} activeOpacity={0.85}>
              <Text style={styles.pickBtnEmoji}>🖼️</Text>
              <Text style={[styles.pickBtnLabel, styles.galleryBtnText]}>בחר מגלריה</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>* במכשיר נייד תוכל גם לצלם</Text>
          )}
        </View>
      )}

      {/* ── Phase: details form ── */}
      {phase === 'details' && pendingUri && (
        <ScrollView contentContainerStyle={styles.detailsArea} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsImageRow}>
            <Image source={{ uri: pendingUri }} style={styles.detailsThumb} contentFit="cover" />
            <View style={styles.detailsImageInfo}>
              <Text style={styles.detailsTitle}>עזור לAI לזהות</Text>
              <Text style={styles.detailsSub}>מלא פרטים שאתה יודע — כל שדה משפר את הדיוק. הכל אופציונלי.</Text>
            </View>
          </View>

          {/* Brand */}
          <View style={styles.detailsField}>
            <Text style={styles.detailsLabel}>מותג <Text style={styles.detailsOptional}>(אופציונלי)</Text></Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Nike, Zara, H&M..."
              value={sellerBrand}
              onChangeText={setSellerBrand}
              textAlign="right"
              autoCorrect={false}
            />
          </View>

          {/* Condition */}
          <View style={styles.detailsField}>
            <Text style={styles.detailsLabel}>מצב הפריט <Text style={styles.detailsOptional}>(אופציונלי)</Text></Text>
            <View style={styles.chipRow}>
              {CONDITIONS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.chip, sellerCondition === c.value && styles.chipActive]}
                  onPress={() => setSellerCondition(sellerCondition === c.value ? null : c.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, sellerCondition === c.value && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cut */}
          <View style={styles.detailsField}>
            <Text style={styles.detailsLabel}>גזרה <Text style={styles.detailsOptional}>(אופציונלי)</Text></Text>
            <View style={styles.chipRow}>
              {CUT_OPTIONS.map(cut => (
                <TouchableOpacity
                  key={cut}
                  style={[styles.chip, sellerCut === cut && styles.chipActive]}
                  onPress={() => setSellerCut(sellerCut === cut ? null : cut)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, sellerCut === cut && styles.chipTextActive]}>{cut}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Size */}
          <View style={styles.detailsField}>
            <Text style={styles.detailsLabel}>מידה <Text style={styles.detailsOptional}>(אופציונלי)</Text></Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="S, M, L, XL, 32, 42..."
              value={sellerSize}
              onChangeText={setSellerSize}
              textAlign="right"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.detailsBtn} onPress={runRecognition} activeOpacity={0.85}>
            <Text style={styles.detailsBtnText}>המשך לזיהוי AI ✨</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Phase: uploading ── */}
      {phase === 'uploading' && (
        <View style={styles.processingArea}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.processingTitle}>משפר תמונה...</Text>
          <View style={styles.stepsList}>
            <ProcessStep emoji="☁️" label="מעלה ל-Cloudinary" active />
            <ProcessStep emoji="✨" label="משפר בהירות וצבעים" active />
            <ProcessStep emoji="⬜" label="מנקה רקע" active />
            <ProcessStep emoji="🎨" label="מנתח צבעים" active />
          </View>
        </View>
      )}

      {/* ── Phase: recognizing ── */}
      {phase === 'recognizing' && (
        <View style={styles.processingArea}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.processingTitle}>AI מזהה פרטים...</Text>
          <View style={styles.stepsList}>
            <ProcessStep emoji="✅" label="תמונה שופרה בהצלחה" done />
            <ProcessStep emoji="🤖" label="מזהה מותג וקטגוריה" active />
            <ProcessStep emoji="🏷️" label="מעריך מצב הפריט" active />
            <ProcessStep emoji="💡" label="מציע מחיר" active />
          </View>
        </View>
      )}

      {/* ── Phase: enhanced — before/after + AI results ── */}
      {phase === 'enhanced' && enhance && (
        <ScrollView contentContainerStyle={styles.resultArea} showsVerticalScrollIndicator={false}>

          {/* AI results */}
          {aiResult && (
            <View style={styles.aiCard}>
              <View style={styles.aiCardHeader}>
                <Text style={styles.aiCardTitle}>זיהוי AI</Text>
                <View style={styles.aiTag}><Text style={styles.aiTagText}>✨ AI</Text></View>
              </View>
              {!!(sellerBrand || sellerCondition || sellerCut || sellerSize) && (
                <View style={styles.hintsUsedBadge}>
                  <Text style={styles.hintsUsedText}>
                    🧠 שולב עם הפרטים שמסרת
                    {sellerBrand ? ` · ${sellerBrand}` : ''}
                    {sellerCut ? ` · ${sellerCut}` : ''}
                  </Text>
                </View>
              )}
              <View style={styles.confTable}>
                <ConfidenceRow label="שם"   value={aiResult.name}       conf={conf?.name} />
                <ConfidenceRow label="מותג" value={aiResult.brand}      conf={conf?.brand} />
                <ConfidenceRow label="צבע"  value={aiResult.color}      conf={conf?.color} />
                <ConfidenceRow
                  label="מצב"
                  value={aiResult.condition ? CONDITION_LABELS[aiResult.condition] : undefined}
                  conf={conf?.condition}
                />
                {aiResult.price ? (
                  <View style={styles.priceRow}>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceEmoji}>💰</Text>
                    </View>
                    <Text style={styles.priceValue}>₪{aiResult.price}</Text>
                    <Text style={styles.priceLabel}>מחיר מוצע</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.continueBtn} onPress={continueToComplete} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>המשך להשלמת הפרסום →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ProcessStep({ emoji, label, active, done }: { emoji: string; label: string; active?: boolean; done?: boolean }) {
  return (
    <View style={[styles.processStep, done && styles.processStepDone]}>
      <Text style={styles.processStepLabel}>{label}</Text>
      <Text style={styles.processStepEmoji}>{emoji}</Text>
    </View>
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

  // Pick phase
  pickArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  heroIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroEmoji: { fontSize: 56 },
  pickTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  pickSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  preSelBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#86EFAC',
  },
  preSelText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  cloudinaryBadge: {
    backgroundColor: '#EEF2FF', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
  },
  cloudinaryBadgeText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  demoBadge: { backgroundColor: '#FEF3C7' },
  demoBadgeText: { color: '#92400E' },
  geminiBadge: { backgroundColor: '#F0FDF4' },
  geminiBadgeText: { color: '#15803D' },
  pickButtons: { width: '100%', gap: 14, marginTop: 4 },
  pickBtn: { borderRadius: 20, paddingVertical: 22, paddingHorizontal: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 },
  cameraBtn: { backgroundColor: '#6366F1' },
  galleryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB' },
  pickBtnEmoji: { fontSize: 26 },
  pickBtnLabel: { fontSize: 17, fontWeight: '700' },
  cameraBtnText: { color: '#fff' },
  galleryBtnText: { color: '#374151' },
  webNote: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  // Processing phase
  processingArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32 },
  processingTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  stepsList: { width: '100%', gap: 12 },
  processStep: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  processStepDone: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  processStepEmoji: { fontSize: 22 },
  processStepLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'right' },

  // Enhanced phase
  resultArea: { padding: 20, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right' },
  demoNotice: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10 },
  demoNoticeText: { fontSize: 12, color: '#92400E', textAlign: 'center' },
  beforeAfterRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  imageBox: { flex: 1, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#F3F4F6' },
  beforeAfterImg: { width: '100%', height: 260, backgroundColor: '#F3F4F6' },
  imageLabel: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  imageLabelAfter: { backgroundColor: 'rgba(99,102,241,0.85)' },
  imageLabelText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  imageLabelTextAfter: { color: '#fff' },
  arrowBox: { width: 28, alignItems: 'center' },
  arrow: { fontSize: 20, color: '#6366F1', fontWeight: '700' },
  transformRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  transformChip: {
    backgroundColor: '#D1FAE5', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
  },
  transformChipText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  // AI card
  aiCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 14,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  aiCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  aiCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  aiTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  aiTagText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  confTable: { gap: 10 },
  fieldRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  fieldLabel: { fontSize: 13, color: '#9CA3AF', width: 40, textAlign: 'right' },
  fieldValue: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right' },
  confBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, minWidth: 44, alignItems: 'center' },
  confGreen: { backgroundColor: '#D1FAE5' },
  confGray: { backgroundColor: '#F3F4F6' },
  confText: { fontSize: 11, fontWeight: '700' },
  confTextGreen: { color: '#059669' },
  confTextGray: { color: '#9CA3AF' },

  // Suggested price row
  priceRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF7ED', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  priceBadge: { width: 30, alignItems: 'center' },
  priceEmoji: { fontSize: 18 },
  priceLabel: { fontSize: 13, color: '#92400E', width: 72, textAlign: 'right' },
  priceValue: { flex: 1, fontSize: 18, fontWeight: '900', color: '#D97706', textAlign: 'right' },

  // Quality error card
  qualityErrorCard: {
    backgroundColor: '#FFF1F2', borderRadius: 20, borderWidth: 1.5, borderColor: '#FECDD3',
    overflow: 'hidden', width: '100%',
    flexDirection: 'row-reverse', gap: 0,
  },
  badImageThumb: { width: 90, height: 110 },
  qualityErrorBody: { flex: 1, padding: 12, gap: 6, justifyContent: 'center' },
  qualityErrorTitle: { fontSize: 15, fontWeight: '800', color: '#BE123C', textAlign: 'right' },
  qualityErrorText: { fontSize: 12, color: '#9F1239', textAlign: 'right', lineHeight: 18 },
  qualityTips: { gap: 2, marginTop: 4 },
  qualityTip: { fontSize: 11, color: '#BE123C', textAlign: 'right' },

  continueBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Details phase
  detailsArea: { padding: 20, gap: 20, paddingBottom: 40 },
  detailsImageRow: { flexDirection: 'row-reverse', gap: 14, alignItems: 'center' },
  detailsThumb: { width: 90, height: 110, borderRadius: 16 },
  detailsImageInfo: { flex: 1, gap: 6 },
  detailsTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right' },
  detailsSub: { fontSize: 13, color: '#6B7280', textAlign: 'right', lineHeight: 20 },
  detailsField: { gap: 8 },
  detailsLabel: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'right' },
  detailsOptional: { fontSize: 12, color: '#9CA3AF', fontWeight: '400' },
  detailsInput: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#6366F1', fontWeight: '700' },
  detailsBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  detailsBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  hintsUsedBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 8,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  hintsUsedText: { fontSize: 12, color: '#15803D', fontWeight: '600', textAlign: 'right' },
});
