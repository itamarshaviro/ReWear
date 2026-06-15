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

// react-native-maps only available on native builds (not Expo Go web)
let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;
let Callout: React.ComponentType<any> | null = null;
let PROVIDER_GOOGLE: string | null = null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Callout = maps.Callout;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch {
    // native maps not available (Expo Go SDK mismatch)
  }
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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

function ItemCard({ item, onPress }: { item: ClothingItem; onPress: () => void }) {
  const catInfo = CATEGORY_INFO[item.category];
  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemCardImg} contentFit="cover" />
      <View style={styles.itemCardInfo}>
        <View style={styles.itemCardTopRow}>
          <Text style={styles.itemCardPrice}>₪{item.price}</Text>
          <Text style={styles.itemCardName} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={styles.itemCardBrand}>{item.brand}</Text>
        <View style={styles.itemCardFooter}>
          <Text style={styles.itemCardCat}>{catInfo.emoji} {catInfo.label}</Text>
          <Text style={styles.itemCardDist}>📍 {item.distance.toFixed(1)} ק"מ</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Web map using Google Maps Static API ──────────────────────────────────────
function WebMapView({ items }: { items: ClothingItem[] }) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const hasKey = GOOGLE_MAPS_KEY.length > 0;

  const staticMapUrl = hasKey
    ? (() => {
        const markerParts = items.slice(0, 30).map((item, idx) => {
          const c = itemCoordinates(item.distance, idx);
          return `markers=color:0x6366F1%7Csize:small%7C${c.latitude},${c.longitude}`;
        });
        return (
          `https://maps.googleapis.com/maps/api/staticmap` +
          `?center=32.0853,34.7818&zoom=12&size=800x500&scale=2` +
          `&style=feature:poi|visibility:off` +
          `&style=feature:transit|visibility:off` +
          `&${markerParts.join('&')}` +
          `&key=${GOOGLE_MAPS_KEY}`
        );
      })()
    : null;

  return (
    <View style={styles.webContainer}>
      {/* Map area */}
      {hasKey ? (
        <View style={styles.staticMapWrapper}>
          <Image
            source={{ uri: staticMapUrl! }}
            style={styles.staticMap}
            contentFit="cover"
          />
          <View style={styles.staticMapOverlay}>
            <Text style={styles.staticMapOverlayText}>
              {items.length} פריטים באזורך
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noKeyBanner}>
          <Text style={styles.noKeyEmoji}>🗺️</Text>
          <Text style={styles.noKeyTitle}>נדרש Google Maps API Key</Text>
          <Text style={styles.noKeyText}>
            הוסף את המפתח ל-.env{'\n'}
            <Text style={styles.noKeyCode}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...</Text>
          </Text>
        </View>
      )}

      {/* Items list */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>{items.length} פריטים</Text>
      </View>
      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsListContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onPress={() => setSelectedItem(item === selectedItem ? null : item)}
          />
        ))}
        {items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>לא נמצאו פריטים בקטגוריה זו</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Native map using react-native-maps ────────────────────────────────────────
function NativeMapView({ items }: { items: ClothingItem[] }) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  if (!MapView) {
    return (
      <View style={styles.nativeUnavailable}>
        <Text style={styles.noKeyEmoji}>🗺️</Text>
        <Text style={styles.noKeyTitle}>המפה אינה זמינה</Text>
        <Text style={styles.noKeyText}>בנה development build להפעלת המפה</Text>
      </View>
    );
  }

  const MV = MapView;
  const Mk = Marker!;
  const Cl = Callout!;

  return (
    <View style={{ flex: 1 }}>
      <MV
        style={styles.nativeMap}
        initialRegion={TEL_AVIV}
        provider={GOOGLE_MAPS_KEY ? PROVIDER_GOOGLE : undefined}
      >
        {items.map((item, idx) => {
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

      {selectedItem && (
        <View style={styles.selectedCard}>
          <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <ItemCard item={selectedItem} onPress={() => router.push('/buyer/feed')} />
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MapScreen() {
  const { allListings } = useApp();
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');

  const filtered = filterCat === 'all'
    ? allListings
    : allListings.filter(i => i.category === filterCat);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>מפה</Text>
        <Text style={styles.subtitle}>{filtered.length} פריטים</Text>
      </View>

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

      <View style={{ flex: 1 }}>
        {Platform.OS === 'web'
          ? <WebMapView items={filtered} />
          : <NativeMapView items={filtered} />
        }
      </View>

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
  filterBar: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },

  // Web map
  webContainer: { flex: 1 },
  staticMapWrapper: { height: 240, position: 'relative' },
  staticMap: { width: '100%', height: '100%' },
  staticMapOverlay: {
    position: 'absolute', bottom: 10, right: 12,
    backgroundColor: 'rgba(99,102,241,0.85)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
  },
  staticMapOverlayText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  noKeyBanner: {
    height: 200, backgroundColor: '#EEF2FF', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  noKeyEmoji: { fontSize: 48 },
  noKeyTitle: { fontSize: 16, fontWeight: '800', color: '#3730A3' },
  noKeyText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  noKeyCode: { fontSize: 12, fontFamily: 'monospace', color: '#6366F1', backgroundColor: '#EEF2FF' },
  listHeader: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  listHeaderText: { fontSize: 13, fontWeight: '700', color: '#6366F1', textAlign: 'right' },
  itemsList: { flex: 1 },
  itemsListContent: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },

  // Item card
  itemCard: {
    backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row-reverse',
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  itemCardImg: { width: 88, height: 100 },
  itemCardInfo: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  itemCardTopRow: {
    flexDirection: 'row-reverse', alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  itemCardName: { fontSize: 14, fontWeight: '700', color: '#111827', flexShrink: 1, textAlign: 'right' },
  itemCardPrice: { fontSize: 16, fontWeight: '900', color: '#6366F1' },
  itemCardBrand: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  itemCardFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  itemCardCat: { fontSize: 12, color: '#6B7280' },
  itemCardDist: { fontSize: 12, color: '#9CA3AF' },

  // Native map
  nativeMap: { flex: 1 },
  nativeUnavailable: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
  },
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

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#6B7280' },
});
