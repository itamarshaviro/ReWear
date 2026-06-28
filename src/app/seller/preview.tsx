import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { CATEGORY_INFO, CONDITION_LABELS, CONDITION_COLORS } from '@/data/mock';
import { Stars } from '@/components/stars';

export default function PreviewScreen() {
  const { draft, setDraft, addListing } = useApp();

  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!draft && !published) {
      router.replace('/');
    }
  }, [draft, published]);

  if (published) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successScreen}>
          <Text style={styles.successEmoji}>😊</Text>
          <Text style={styles.successTitle}>הפריט עלה בהצלחה!</Text>
          <Text style={styles.successSub}>הפריט שלך פורסם וכבר זמין לקונים 🎉</Text>
          <TouchableOpacity
            style={styles.successPrimaryBtn}
            onPress={() => router.replace({ pathname: '/seller/dashboard', params: { uploaded: '1' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.successPrimaryBtnText}>ראה את הפריטים שלי 👗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successSecondaryBtn}
            onPress={() => router.replace('/')}
            activeOpacity={0.75}
          >
            <Text style={styles.successSecondaryBtnText}>חזור לדף הבית</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!draft) return null;

  const catInfo = draft.category ? CATEGORY_INFO[draft.category] : null;
  const condLabel = draft.condition ? CONDITION_LABELS[draft.condition] : '';
  const condColor = draft.condition ? CONDITION_COLORS[draft.condition] : '#9CA3AF';

  async function publish() {
    if (!draft) return;
    await addListing({
      name: draft.name ?? 'פריט',
      brand: draft.brand ?? '',
      category: draft.category ?? 'accessories',
      condition: draft.condition ?? 'good',
      color: draft.color,
      description: draft.description ?? '',
      price: draft.price ?? 0,
      size: draft.size ?? '',
      location: draft.location ?? '',
      imageUrl: draft.imageUri,
    });
    setDraft(null);
    setPublished(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>תצוגה מקדימה</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>כך הפריט ייראה בעדכון</Text>

        {/* Feed card preview */}
        <View style={styles.card}>
          <Image source={{ uri: draft.imageUri }} style={styles.cardImage} contentFit="contain" />

          {/* Overlaid condition badge */}
          <View style={[styles.condBadge, { backgroundColor: condColor }]}>
            <Text style={styles.condBadgeText}>{condLabel}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={styles.cardPrice}>₪{draft.price}</Text>
              <Text style={styles.cardName} numberOfLines={1}>{draft.name}</Text>
            </View>
            <View style={styles.cardMeta}>
              {draft.brand ? <Text style={styles.cardBrand}>{draft.brand}</Text> : null}
              {catInfo ? <Text style={styles.cardCat}>{catInfo.emoji} {catInfo.label}</Text> : null}
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.footerRight}>
                {draft.color && <Text style={styles.cardColor}>● {draft.color}</Text>}
                <Text style={styles.cardSize}>{draft.size}</Text>
              </View>
              <View style={styles.footerLeft}>
                <Stars score={5} size={14} />
                <Text style={styles.cardLoc}>📍 {draft.location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {draft.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descLabel}>תיאור</Text>
            <Text style={styles.descText}>{draft.description}</Text>
          </View>
        ) : null}

        {/* Summary rows */}
        <View style={styles.summaryBox}>
          <SummaryRow label="מחיר" value={`₪${draft.price}`} />
          <SummaryRow label="מידה"   value={draft.size ?? ''} />
          <SummaryRow label="מיקום"  value={draft.location ?? ''} />
          <SummaryRow label="מצב"    value={condLabel} color={condColor} />
          {draft.brand && <SummaryRow label="מותג" value={draft.brand} />}
          {draft.color && <SummaryRow label="צבע"  value={draft.color} />}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>ערוך</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn} onPress={publish} activeOpacity={0.85}>
            <Text style={styles.publishBtnText}>פרסם סופית 🚀</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
  content: { padding: 20, gap: 16 },
  sectionLabel: { fontSize: 13, color: '#9CA3AF', textAlign: 'right', marginBottom: -4 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 8,
  },
  cardImage: { width: '100%', height: 280, backgroundColor: '#F3F4F6' },
  condBadge: {
    position: 'absolute', top: 14, left: 14,
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
  },
  condBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cardBody: { padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'space-between' },
  cardName: { fontSize: 17, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'right' },
  cardPrice: { fontSize: 20, fontWeight: '900', color: '#6366F1' },
  cardMeta: { flexDirection: 'row-reverse', gap: 10 },
  cardBrand: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  cardCat: { fontSize: 13, color: '#9CA3AF' },
  cardFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  footerRight: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  footerLeft: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  cardColor: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  cardSize: { fontSize: 13, color: '#374151', fontWeight: '700' },
  cardLoc: { fontSize: 12, color: '#9CA3AF' },
  descBox: { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 14, gap: 4 },
  descLabel: { fontSize: 12, fontWeight: '700', color: '#6366F1', textAlign: 'right' },
  descText: { fontSize: 14, color: '#374151', textAlign: 'right', lineHeight: 21 },
  summaryBox: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  summaryLabel: { fontSize: 13, color: '#9CA3AF' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row-reverse', gap: 12, marginTop: 4 },
  editBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 17, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB',
  },
  editBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  publishBtn: {
    flex: 2, backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 17, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  publishBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },

  // Success screen
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 36, gap: 16,
  },
  successEmoji: { fontSize: 90, marginBottom: 8 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center' },
  successSub: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  successPrimaryBtn: {
    width: '100%', backgroundColor: '#6366F1', borderRadius: 18,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  successPrimaryBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  successSecondaryBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
  },
  successSecondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
});
