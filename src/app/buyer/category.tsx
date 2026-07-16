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

type CategoryDef = {
  id: Category;
  label: string;
  emoji: string;
  subs?: SubCategory[];
};

const CATEGORIES: CategoryDef[] = [
  { id: 'mens-pants',     label: 'מכנסי גברים',      emoji: '👖' },
  { id: 'womens-pants',   label: 'מכנסי נשים',       emoji: '🩳' },
  { id: 'mens-shirts',    label: 'חולצות גברים',     emoji: '👔' },
  { id: 'womens-shirts',  label: 'חולצות נשים',      emoji: '👚' },
  { id: 'mens-tops',      label: 'גופיות גברים',     emoji: '🎽' },
  { id: 'womens-tops',    label: 'גופיות נשים',      emoji: '🩱' },
  { id: 'mens-shoes',     label: 'נעלי גברים',       emoji: '👟' },
  { id: 'womens-shoes',   label: 'נעלי נשים',        emoji: '👠' },
  { id: 'mens-winter',    label: 'ביגוד חורף גברים', emoji: '🧥', subs: WINTER_MENS_SUBS },
  { id: 'womens-winter',  label: 'ביגוד חורף נשים',  emoji: '🧣', subs: WINTER_WOMENS_SUBS },
  { id: 'accessories',    label: 'אביזרים',           emoji: '👜', subs: ACCESSORIES_SUBS },
  { id: 'womens-dresses', label: 'שמלות נשים',       emoji: '👗' },
];

export default function CategoryScreen() {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [expanded, setExpanded] = useState<Category | null>(null);

  function toggle(cat: Category) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function handlePress(cat: CategoryDef) {
    if (cat.subs) {
      setExpanded(prev => prev === cat.id ? null : cat.id);
    } else {
      toggle(cat.id);
    }
  }

  function handleSubPress(parentCategory: Category) {
    toggle(parentCategory);
    setExpanded(null);
  }

  function navigate() {
    if (selected.size === 0) return;
    router.push({
      pathname: '/buyer/filters',
      params: { categories: [...selected].join(',') },
    });
  }

  const rows: CategoryDef[][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    rows.push(CATEGORIES.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>מה אתה מחפש?</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>בחר קטגוריה אחת או יותר</Text>

      <ScrollView
        contentContainerStyle={[styles.grid, selected.size > 0 && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((pair, ri) => (
          <View key={ri}>
            <View style={styles.row}>
              {pair.map(cat => {
                const isSelected = selected.has(cat.id);
                const isExpanded = expanded === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.card, (isSelected || isExpanded) && styles.cardActive]}
                    onPress={() => handlePress(cat)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
                    <Text style={styles.emoji}>{cat.emoji}</Text>
                    <Text style={[styles.label, isSelected && styles.labelActive]}>{cat.label}</Text>
                    {cat.subs && (
                      <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {pair.length === 1 && <View style={styles.cardPlaceholder} />}
            </View>

            {pair.map(cat =>
              cat.subs && expanded === cat.id ? (
                <View key={`subs-${cat.id}`} style={styles.subGrid}>
                  {cat.subs.map(sub => {
                    const isSubSelected = selected.has(sub.parentCategory);
                    return (
                      <TouchableOpacity
                        key={sub.key}
                        style={[styles.subCard, isSubSelected && styles.subCardActive]}
                        onPress={() => handleSubPress(sub.parentCategory)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.subEmoji}>{sub.emoji}</Text>
                        <Text style={[styles.subLabel, isSubSelected && styles.subLabelActive]}>{sub.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null
            )}
          </View>
        ))}
      </ScrollView>

      {selected.size > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={navigate} activeOpacity={0.85}>
            <Text style={styles.applyText}>
              הצג פריטים · {selected.size} {selected.size === 1 ? 'קטגוריה' : 'קטגוריות'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  title: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 4 },
  grid: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row-reverse', gap: 14 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 24, alignItems: 'center', gap: 8,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  cardPlaceholder: { flex: 1 },
  checkBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontSize: 12, color: '#fff', fontWeight: '800' },
  emoji: { fontSize: 36 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'center' },
  labelActive: { color: '#6366F1' },
  arrow: { fontSize: 10, color: '#6366F1', fontWeight: '700' },
  subGrid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    gap: 10, marginTop: 10, marginBottom: 4, paddingHorizontal: 4,
  },
  subCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', gap: 6, minWidth: '28%', flexGrow: 1,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  subCardActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  subEmoji: { fontSize: 28 },
  subLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  subLabelActive: { color: '#6366F1' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 32,
    backgroundColor: '#F8F7FF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  applyBtn: {
    backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  applyText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
