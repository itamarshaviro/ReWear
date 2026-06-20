import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Category } from '@/data/mock';

type Gender = 'men' | 'women';

type ItemOption = {
  label: string;
  emoji: string;
  category: (g: Gender) => Category;
  genders: Gender[];
};

const ITEM_OPTIONS: ItemOption[] = [
  { label: 'חולצה',       emoji: '👕', category: g => g === 'men' ? 'mens-shirts'   : 'womens-shirts',  genders: ['men', 'women'] },
  { label: "ג'קט / מעיל", emoji: '🧥', category: g => g === 'men' ? 'mens-shirts'   : 'womens-shirts',  genders: ['men', 'women'] },
  { label: 'מכנסיים',     emoji: '👖', category: g => g === 'men' ? 'mens-pants' : 'womens-pants',      genders: ['men', 'women'] },
  { label: 'שמלה',        emoji: '👗', category: () => 'womens-dresses',                                genders: ['women'] },
  { label: 'חצאית',       emoji: '🩱', category: () => 'womens-dresses',                                genders: ['women'] },
  { label: 'גופייה / טופ',emoji: '🎽', category: g => g === 'men' ? 'mens-tops' : 'womens-tops',        genders: ['men', 'women'] },
  { label: 'נעליים',      emoji: '👟', category: g => g === 'men' ? 'mens-shoes' : 'womens-shoes',      genders: ['men', 'women'] },
  { label: 'אביזר',       emoji: '💍', category: () => 'accessories',                                   genders: ['men', 'women'] },
];

export default function ClassifyScreen() {
  const [gender, setGender] = useState<Gender | null>(null);
  const [selectedOption, setSelectedOption] = useState<ItemOption | null>(null);

  const visibleOptions = gender
    ? ITEM_OPTIONS.filter(o => o.genders.includes(gender))
    : ITEM_OPTIONS;

  function handleGender(g: Gender) {
    setGender(g);
    // Clear item selection if it's not valid for the new gender
    if (selectedOption && !selectedOption.genders.includes(g)) {
      setSelectedOption(null);
    }
  }

  function handleContinue() {
    if (!gender || !selectedOption) return;
    const category = selectedOption.category(gender);
    router.push({
      pathname: '/seller/upload',
      params: { preCategory: category, preGender: gender, preLabel: selectedOption.label },
    });
  }

  const canContinue = gender !== null && selectedOption !== null;

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
              onPress={() => handleGender('women')}
              activeOpacity={0.8}
            >
              <Text style={styles.genderEmoji}>👩</Text>
              <Text style={[styles.genderText, gender === 'women' && styles.genderTextActive]}>נשים</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'men' && styles.genderBtnActive]}
              onPress={() => handleGender('men')}
              activeOpacity={0.8}
            >
              <Text style={styles.genderEmoji}>👨</Text>
              <Text style={[styles.genderText, gender === 'men' && styles.genderTextActive]}>גברים</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2 — Item type */}
        <View style={styles.section}>
          <Text style={[styles.stepLabel, !gender && styles.stepLabelDim]}>שלב 2 · סוג פריט</Text>
          <View style={styles.grid}>
            {visibleOptions.map(option => {
              const isSelected = selectedOption?.label === option.label &&
                selectedOption?.emoji === option.emoji;
              return (
                <TouchableOpacity
                  key={option.label + option.emoji}
                  style={[styles.itemCard, isSelected && styles.itemCardActive, !gender && styles.itemCardDisabled]}
                  onPress={() => gender && setSelectedOption(option)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.itemEmoji}>{option.emoji}</Text>
                  <Text style={[styles.itemLabel, isSelected && styles.itemLabelActive]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary pill */}
        {canContinue && (
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {gender === 'men' ? 'גברים' : 'נשים'} · {selectedOption!.emoji} {selectedOption!.label}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Continue button */}
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },

  scroll: { padding: 20, gap: 24, paddingBottom: 16 },

  section: { gap: 12 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: '#6366F1', textAlign: 'right', letterSpacing: 0.5 },
  stepLabelDim: { color: '#C4B5FD' },

  // Gender
  genderRow: { flexDirection: 'row-reverse', gap: 12 },
  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  genderBtnActive: {
    backgroundColor: '#EEF2FF', borderColor: '#6366F1',
    shadowColor: '#6366F1', shadowOpacity: 0.2,
  },
  genderEmoji: { fontSize: 36 },
  genderText: { fontSize: 17, fontWeight: '700', color: '#6B7280' },
  genderTextActive: { color: '#6366F1' },

  // Item grid
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  itemCard: {
    width: '47%', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 8,
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 2, borderColor: '#E5E7EB',
    gap: 6, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  itemCardActive: {
    backgroundColor: '#EEF2FF', borderColor: '#6366F1',
    shadowColor: '#6366F1', shadowOpacity: 0.18,
  },
  itemCardDisabled: { opacity: 0.4 },
  itemEmoji: { fontSize: 32 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  itemLabelActive: { color: '#6366F1', fontWeight: '800' },
  checkMark: {
    position: 'absolute', top: 8, left: 8,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkMarkText: { fontSize: 11, color: '#fff', fontWeight: '800' },

  // Summary
  summaryPill: {
    alignSelf: 'center', backgroundColor: '#EEF2FF', borderRadius: 100,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  summaryText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },

  // Footer
  footer: { padding: 20, paddingTop: 12 },
  continueBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  continueBtnDisabled: { backgroundColor: '#C4B5FD', shadowOpacity: 0.1 },
  continueBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
