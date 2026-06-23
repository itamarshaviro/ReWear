import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ACCESSORIES_SUBS,
  WINTER_MENS_SUBS,
  WINTER_WOMENS_SUBS,
} from '@/data/mock';
import type { Category, SubCategory } from '@/data/mock';

type Gender = 'men' | 'women';

type SellerCat = {
  id: Category;
  label: string;
  emoji: string;
  genders: Gender[];
  subs?: SubCategory[];
};

const SELLER_CATS: SellerCat[] = [
  { id: 'mens-pants',     label: 'מכנסי גברים',      emoji: '👖', genders: ['men'] },
  { id: 'womens-pants',   label: 'מכנסי נשים',       emoji: '👖', genders: ['women'] },
  { id: 'mens-shirts',    label: 'חולצות גברים',     emoji: '👔', genders: ['men'] },
  { id: 'womens-shirts',  label: 'חולצות נשים',      emoji: '👚', genders: ['women'] },
  { id: 'mens-tops',      label: 'גופיות גברים',     emoji: '🎽', genders: ['men'] },
  { id: 'womens-tops',    label: 'גופיות נשים',      emoji: '🎽', genders: ['women'] },
  { id: 'mens-shoes',     label: 'נעלי גברים',       emoji: '👟', genders: ['men'] },
  { id: 'womens-shoes',   label: 'נעלי נשים',        emoji: '👠', genders: ['women'] },
  { id: 'womens-dresses', label: 'שמלות נשים',       emoji: '👗', genders: ['women'] },
  { id: 'mens-winter',    label: 'ביגוד חורף גברים', emoji: '🧥', genders: ['men'],   subs: WINTER_MENS_SUBS },
  { id: 'womens-winter',  label: 'ביגוד חורף נשים',  emoji: '🧥', genders: ['women'], subs: WINTER_WOMENS_SUBS },
  { id: 'accessories',    label: 'אביזרים',           emoji: '👜', genders: ['men', 'women'], subs: ACCESSORIES_SUBS },
];

export default function ClassifyScreen() {
  const [gender, setGender]           = useState<Gender | null>(null);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [expanded, setExpanded]       = useState<Category | null>(null);

  const visible = gender ? SELLER_CATS.filter(c => c.genders.includes(gender)) : [];

  function handleGender(g: Gender) {
    setGender(g);
    setSelectedCat(null);
    setSelectedSub(null);
    setExpanded(null);
  }

  function handleCat(cat: SellerCat) {
    if (cat.subs) {
      setExpanded(prev => prev === cat.id ? null : cat.id);
      setSelectedCat(null);
      setSelectedSub(null);
    } else {
      setSelectedCat(cat.id);
      setSelectedSub(null);
      setExpanded(null);
    }
  }

  function handleSub(sub: SubCategory) {
    setSelectedCat(sub.parentCategory);
    setSelectedSub(sub.key);
  }

  function handleContinue() {
    if (!selectedCat) return;
    router.push({
      pathname: '/seller/upload',
      params: { preCategory: selectedCat, preGender: gender ?? 'men' },
    });
  }

  const canContinue = selectedCat !== null;

  // Pair categories into rows of 2 (men left, women right visually via row-reverse)
  const rows: SellerCat[][] = [];
  for (let i = 0; i < visible.length; i += 2) {
    rows.push(visible.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>מה אתה מוכר?</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Step 1 — Gender */}
        <View style={styles.section}>
          <Text style={styles.stepLabel}>שלב 1 · מגדר</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'women' && styles.genderBtnActive]}
              onPress={() => handleGender('women')} activeOpacity={0.8}
            >
              <Text style={styles.genderEmoji}>👩</Text>
              <Text style={[styles.genderText, gender === 'women' && styles.genderTextActive]}>נשים</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'men' && styles.genderBtnActive]}
              onPress={() => handleGender('men')} activeOpacity={0.8}
            >
              <Text style={styles.genderEmoji}>👨</Text>
              <Text style={[styles.genderText, gender === 'men' && styles.genderTextActive]}>גברים</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2 — Category grid */}
        {gender && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>שלב 2 · סוג פריט</Text>
            <View style={styles.grid}>
              {rows.map((pair, ri) => (
                <View key={ri}>
                  <View style={styles.row}>
                    {pair.map(cat => {
                      const isSelected = selectedCat === cat.id && !cat.subs;
                      const isExpanded = expanded === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.card,
                            (isSelected || isExpanded) && styles.cardActive,
                          ]}
                          onPress={() => handleCat(cat)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.emoji}>{cat.emoji}</Text>
                          <Text style={styles.label}>{cat.label}</Text>
                          {cat.subs && (
                            <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
                          )}
                          {isSelected && (
                            <View style={styles.check}>
                              <Text style={styles.checkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    {pair.length === 1 && <View style={styles.cardPlaceholder} />}
                  </View>

                  {/* Sub-categories */}
                  {pair.map(cat =>
                    cat.subs && expanded === cat.id ? (
                      <View key={`subs-${cat.id}`} style={styles.subGrid}>
                        {cat.subs.map(sub => {
                          const subSelected = selectedSub === sub.key && selectedCat === sub.parentCategory;
                          return (
                            <TouchableOpacity
                              key={sub.key}
                              style={[styles.subCard, subSelected && styles.subCardActive]}
                              onPress={() => handleSub(sub)}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.subEmoji}>{sub.emoji}</Text>
                              <Text style={[styles.subLabel, subSelected && styles.subLabelActive]}>
                                {sub.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {canContinue ? 'המשך לצילום →' : 'בחר מגדר וסוג פריט'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  scroll: { padding: 16, gap: 24, paddingBottom: 16 },
  section: { gap: 12 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: '#6366F1', textAlign: 'right', letterSpacing: 0.5 },

  genderRow: { flexDirection: 'row-reverse', gap: 12 },
  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  genderBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1', shadowColor: '#6366F1', shadowOpacity: 0.2 },
  genderEmoji: { fontSize: 36 },
  genderText: { fontSize: 17, fontWeight: '700', color: '#6B7280' },
  genderTextActive: { color: '#6366F1' },

  grid: { gap: 12 },
  row: { flexDirection: 'row-reverse', gap: 12 },
  card: {
    flex: 1, alignItems: 'center', paddingVertical: 22, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', gap: 7,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, position: 'relative',
  },
  cardActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  cardPlaceholder: { flex: 1 },
  emoji: { fontSize: 34 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'center' },
  arrow: { fontSize: 10, color: '#6366F1', fontWeight: '700' },
  check: {
    position: 'absolute', top: 8, left: 8,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontSize: 11, color: '#fff', fontWeight: '800' },

  subGrid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    gap: 8, marginTop: 8, marginBottom: 2,
  },
  subCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    alignItems: 'center', gap: 5, minWidth: '30%', flexGrow: 1,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  subCardActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  subEmoji: { fontSize: 26 },
  subLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  subLabelActive: { color: '#6366F1' },

  footer: { padding: 20, paddingTop: 12 },
  continueBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  continueBtnDisabled: { backgroundColor: '#C4B5FD', shadowOpacity: 0.1 },
  continueBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
