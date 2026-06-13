import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CATEGORY_INFO, ALL_SIZES } from '@/data/mock';
import type { Category } from '@/data/mock';

const DISTANCES = [5, 10, 20, 50];
const MAX_PRICES = [50, 100, 200, 300, 500];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function FiltersScreen() {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const [distance, setDistance] = useState(10);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(200);

  const catInfo = CATEGORY_INFO[category];

  function toggleSize(size: string) {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  }

  function apply() {
    router.push({
      pathname: '/buyer/feed',
      params: {
        category,
        distance: String(distance),
        sizes: selectedSizes.join(','),
        maxPrice: String(maxPrice),
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{catInfo?.emoji} {catInfo?.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="מרחק מהבית">
          <View style={styles.chips}>
            {DISTANCES.map(d => (
              <Chip key={d} label={`${d} ק"מ`} selected={distance === d} onPress={() => setDistance(d)} />
            ))}
          </View>
        </Section>

        <Section title="מידה">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {ALL_SIZES.map(s => (
              <Chip key={s} label={s} selected={selectedSizes.includes(s)} onPress={() => toggleSize(s)} />
            ))}
          </ScrollView>
          {selectedSizes.length > 0 && (
            <Text style={styles.hint}>נבחרו: {selectedSizes.join(', ')}</Text>
          )}
        </Section>

        <Section title="מחיר מקסימלי">
          <View style={styles.chips}>
            {MAX_PRICES.map(p => (
              <Chip
                key={p}
                label={p === 500 ? '₪500+' : `עד ₪${p}`}
                selected={maxPrice === p}
                onPress={() => setMaxPrice(p)}
              />
            ))}
          </View>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={apply} activeOpacity={0.85}>
          <Text style={styles.applyText}>הצג פריטים</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  backText: {
    fontSize: 22,
    color: '#6366F1',
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  content: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  chipsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  footer: {
    padding: 20,
    paddingBottom: 28,
  },
  applyBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  applyText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
});
