import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

const POPULAR_BRANDS = [
  'Nike', 'Adidas', 'Zara', 'H&M', 'Mango', "Levi's",
  'Puma', 'Tommy Hilfiger', 'Ralph Lauren', 'Calvin Klein',
  'New Balance', 'Converse', 'Vans', 'Pull&Bear', 'Bershka',
  'Stradivarius', 'ASOS', 'SHEIN', 'Primark', 'Guess',
  'Wrangler', 'Lee', 'Diesel', 'Pepe Jeans', 'Dr. Martens',
  'Skechers', 'Crocs', 'Champion', 'Under Armour', 'Reebok',
  'Lacoste', 'The North Face', 'Uniqlo', 'GAP', 'Urban Outfitters',
  'Rip Curl', 'Billabong', 'Quiksilver', 'Fox', 'Reserved',
  'Tally Weijl', 'Massimo Dutti', 'Victoria\'s Secret', 'Forever 21',
  'Koton', 'LC Waikiki', 'Defacto', 'River Island', 'Topshop', 'Intimissimi',
];

const TOP_SIZES    = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BOTTOM_SIZES = ['26', '28', '30', '32', '34', '36', '38'];
const SHOE_SIZES   = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
const DISTANCES    = [9999, 50, 20, 10, 5, 2, 1, 0.5, 0.2];

function distanceLabel(d: number) {
  if (d < 1) return `${(d * 1000) | 0} מ'`;
  if (d === 9999) return '50+ ק"מ';
  return `${d} ק"מ`;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

function SizeGroup({ label, sizes, selected, onToggle }: {
  label: string; sizes: string[]; selected: string[]; onToggle: (s: string) => void;
}) {
  return (
    <View style={styles.sizeGroup}>
      <Text style={styles.sizeLabel}>{label}</Text>
      <View style={styles.sizeRow}>
        {sizes.map(s => {
          const on = selected.includes(s);
          return (
            <TouchableOpacity
              key={s}
              style={[styles.sizeBtn, on && styles.sizeBtnOn]}
              onPress={() => onToggle(s)}
            >
              <Text style={[styles.sizeBtnText, on && styles.sizeBtnTextOn]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const PRICE_STEPS = [0, 20, 50, 100, 150, 200, 300, 500];

export default function PreferencesScreen() {
  const { user, updatePreferences } = useAuth();

  const [brands,      setBrands]      = useState<string[]>(user?.preferences?.brands      ?? []);
  const [topSizes,    setTopSizes]    = useState<string[]>(user?.preferences?.topSizes    ?? []);
  const [bottomSizes, setBottomSizes] = useState<string[]>(user?.preferences?.bottomSizes ?? []);
  const [shoeSizes,   setShoeSizes]   = useState<string[]>(user?.preferences?.shoeSizes   ?? []);
  const [minPrice,    setMinPrice]    = useState(user?.preferences?.minPrice ?? 0);
  const [maxPrice,    setMaxPrice]    = useState(user?.preferences?.maxPrice ?? 500);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(user?.preferences?.maxDistance);

  function stepMin(dir: 1 | -1) {
    const idx = PRICE_STEPS.indexOf(minPrice);
    const next = PRICE_STEPS[Math.max(0, Math.min(idx + dir, PRICE_STEPS.length - 1))];
    if (next < maxPrice) setMinPrice(next);
  }
  function stepMax(dir: 1 | -1) {
    const idx = PRICE_STEPS.indexOf(maxPrice);
    const next = PRICE_STEPS[Math.max(0, Math.min(idx + dir, PRICE_STEPS.length - 1))];
    if (next > minPrice) setMaxPrice(next);
  }

  function selectAllBrands() {
    setBrands(brands.length === POPULAR_BRANDS.length ? [] : [...POPULAR_BRANDS]);
  }

  function save() {
    updatePreferences({ brands, topSizes, bottomSizes, shoeSizes, minPrice, maxPrice, maxDistance });
    router.canGoBack() ? router.back() : router.replace('/');
  }

  const allBrandsSelected = brands.length === POPULAR_BRANDS.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>העדפות קנייה</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Distance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>מרחק מקסימלי</Text>
            {maxDistance !== undefined && (
              <TouchableOpacity onPress={() => setMaxDistance(undefined)}>
                <Text style={styles.clearBtn}>נקה</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.cardSub}>הצג לי פריטים עד מרחק זה (אופציונלי)</Text>
          <View style={styles.chipRow}>
            {DISTANCES.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, maxDistance === d && styles.chipOn]}
                onPress={() => setMaxDistance(prev => prev === d ? undefined : d)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, maxDistance === d && styles.chipTextOn]}>
                  {distanceLabel(d)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brands */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>מותגים אהובים</Text>
            <TouchableOpacity onPress={selectAllBrands} style={styles.selectAllBtn}>
              <Text style={styles.selectAllText}>{allBrandsSelected ? 'בטל הכל' : 'בחר הכל'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSub}>
            {brands.length === 0
              ? 'בחר מותגים ותקבל התראה כשעולה פריט מתאים (אופציונלי)'
              : `${brands.length} מותגים נבחרו`}
          </Text>
          <View style={styles.chipRow}>
            {POPULAR_BRANDS.map(brand => {
              const on = brands.includes(brand);
              return (
                <TouchableOpacity
                  key={brand}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => setBrands(prev => toggle(prev, brand))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{brand}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sizes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>המידות שלי</Text>
          <Text style={styles.cardSub}>ניתן לבחור מספר מידות בכל קטגוריה (אופציונלי)</Text>
          <SizeGroup label="חולצות / ג׳קטים" sizes={TOP_SIZES}    selected={topSizes}    onToggle={s => setTopSizes(prev    => toggle(prev, s))} />
          <SizeGroup label="מכנסיים"           sizes={BOTTOM_SIZES} selected={bottomSizes} onToggle={s => setBottomSizes(prev => toggle(prev, s))} />
          <SizeGroup label="נעליים"             sizes={SHOE_SIZES}   selected={shoeSizes}   onToggle={s => setShoeSizes(prev   => toggle(prev, s))} />
        </View>

        {/* Price */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>טווח מחיר</Text>
          <Text style={styles.cardSub}>הצג לי פריטים בטווח זה (אופציונלי)</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceBoxLabel}>עד</Text>
              <View style={styles.priceControl}>
                <TouchableOpacity style={styles.priceBtn} onPress={() => stepMax(1)}><Text style={styles.priceBtnText}>+</Text></TouchableOpacity>
                <Text style={styles.priceValue}>₪{maxPrice === 500 ? '500+' : maxPrice}</Text>
                <TouchableOpacity style={styles.priceBtn} onPress={() => stepMax(-1)}><Text style={styles.priceBtnText}>−</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceBox}>
              <Text style={styles.priceBoxLabel}>מ</Text>
              <View style={styles.priceControl}>
                <TouchableOpacity style={styles.priceBtn} onPress={() => stepMin(1)}><Text style={styles.priceBtnText}>+</Text></TouchableOpacity>
                <Text style={styles.priceValue}>₪{minPrice}</Text>
                <TouchableOpacity style={styles.priceBtn} onPress={() => stepMin(-1)}><Text style={styles.priceBtnText}>−</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>שמור העדפות</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  cardSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: -6 },
  clearBtn: { fontSize: 13, color: '#6366F1', fontWeight: '700' },
  selectAllBtn: {
    backgroundColor: '#EEF2FF', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  selectAllText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },

  // Chips
  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipOn: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextOn: { color: '#fff', fontWeight: '700' },

  // Sizes
  sizeGroup: { gap: 8 },
  sizeLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', textAlign: 'right' },
  sizeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  sizeBtn: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff',
  },
  sizeBtnOn: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  sizeBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  sizeBtnTextOn: { color: '#fff', fontWeight: '800' },

  // Price range
  priceRow: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  priceBox: { flex: 1, alignItems: 'center', gap: 8 },
  priceBoxLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  priceControl: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  priceBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  priceBtnText: { fontSize: 20, fontWeight: '700', color: '#6366F1', lineHeight: 22 },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#111827', minWidth: 64, textAlign: 'center' },
  priceDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },

  // Save
  saveBtn: {
    backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
