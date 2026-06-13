import { useState } from 'react';
import {
  Platform,
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
import { TabBar } from '@/components/tab-bar';
import { CATEGORIES, CATEGORY_INFO, itemCoordinates } from '@/data/mock';
import type { Category, ClothingItem } from '@/data/mock';

// react-native-maps only works on native
let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;
let Callout: React.ComponentType<any> | null = null;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
}

const TEL_AVIV = {
  latitude: 32.0853,
  longitude: 34.7818,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

function CategoryChip({ cat, active, onPress }: { cat: Category | 'all'; active: boolean; onPress: () => void }) {
  const info = cat !== 'all' ? CATEGORY_INFO[cat] : null;
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {cat === 'all' ? 'הכל' : `${info!.emoji} ${info!.label}`}
      </Text>
    </TouchableOpacity>
  );
}

function ItemCard({ item }: { item: ClothingItem }) {
  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => router.push('/buyer/feed')}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.itemCardImg} contentFit="cover" />
      <View style={styles.itemCardInfo}>
        <Text style={styles.itemCardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemCardBrand}>{item.brand}</Text>
        <View style={styles.itemCardFooter}>
          <Text style={styles.itemCardDist}>{item.distance} ק"מ</Text>
          <Text style={styles.itemCardPrice}>₪{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const { allListings } = useApp();
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const filtered = filterCat === 'all'
    ? allListings
    : allListings.filter(i => i.category === filterCat);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>מפה</Text>
        </View>
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackEmoji}>🗺️</Text>
          <Text style={styles.webFallbackTitle}>המפה זמינה במכשיר נייד</Text>
          <Text style={styles.webFallbackSub}>פתח את האפליקציה ב-iOS או Android</Text>
        </View>
        <TabBar />
      </SafeAreaView>
    );
  }

  const MV = MapView!;
  const Mk = Marker!;
  const Cl = Callout!;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>מפה</Text>
        <Text style={styles.subtitle}>{filtered.length} פריטים</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        <CategoryChip cat="all" active={filterCat === 'all'} onPress={() => setFilterCat('all')} />
        {CATEGORIES.map(c => (
          <CategoryChip key={c.id} cat={c.id} active={filterCat === c.id} onPress={() => setFilterCat(c.id)} />
        ))}
      </ScrollView>

      {/* Map */}
      <MV style={styles.map} initialRegion={TEL_AVIV}>
        {filtered.map((item, idx) => {
          const coord = itemCoordinates(item.distance, idx);
          const catInfo = CATEGORY_INFO[item.category];
          return (
            <Mk
              key={item.id}
              coordinate={coord}
              onPress={() => setSelectedItem(item)}
            >
              <View style={styles.pin}>
                <Text style={styles.pinEmoji}>{catInfo.emoji}</Text>
                <Text style={styles.pinPrice}>₪{item.price}</Text>
              </View>
              <Cl tooltip>
                <View style={styles.callout}>
                  <Image source={{ uri: item.imageUrl }} style={styles.calloutImg} contentFit="cover" />
                  <Text style={styles.calloutName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.calloutPrice}>₪{item.price}</Text>
                </View>
              </Cl>
            </Mk>
          );
        })}
      </MV>

      {/* Selected item card */}
      {selectedItem && (
        <View style={styles.selectedCard}>
          <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <ItemCard item={selectedItem} />
        </View>
      )}

      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    paddingHorizontal: 20, paddingVertical: 10,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9CA3AF' },
  filterBar: {
    paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  map: { flex: 1 },
  pin: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: '#6366F1',
    paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  pinEmoji: { fontSize: 16 },
  pinPrice: { fontSize: 11, fontWeight: '800', color: '#6366F1' },
  callout: { width: 140, alignItems: 'center', gap: 4 },
  calloutImg: { width: 130, height: 90, borderRadius: 8 },
  calloutName: { fontSize: 12, fontWeight: '700', color: '#111827', textAlign: 'center' },
  calloutPrice: { fontSize: 14, fontWeight: '900', color: '#6366F1' },
  selectedCard: {
    position: 'absolute', bottom: 80, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
  },
  closeBtn: {
    position: 'absolute', top: 10, left: 12, zIndex: 1,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  itemCard: { flexDirection: 'row-reverse', gap: 14, padding: 14 },
  itemCardImg: { width: 80, height: 80, borderRadius: 14 },
  itemCardInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  itemCardName: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  itemCardBrand: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  itemCardFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  itemCardDist: { fontSize: 12, color: '#9CA3AF' },
  itemCardPrice: { fontSize: 18, fontWeight: '900', color: '#6366F1' },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  webFallbackEmoji: { fontSize: 64 },
  webFallbackTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  webFallbackSub: { fontSize: 14, color: '#6B7280' },
});
