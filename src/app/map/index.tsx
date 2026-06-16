import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Location from 'expo-location';
import { useApp } from '@/context/app-context';
import { TabBar } from '@/components/tab-bar';
import { CATEGORIES, CATEGORY_INFO, itemCoordinates } from '@/data/mock';
import type { Category, ClothingItem } from '@/data/mock';

// react-native-maps only available in native dev builds
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
    // native maps not available
  }
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const TEL_AVIV = { latitude: 32.0853, longitude: 34.7818 };

type UserLocation = { latitude: number; longitude: number };

// ── GPS hook ──────────────────────────────────────────────────────────────────
function useUserLocation(): { location: UserLocation | null; loading: boolean; denied: boolean } {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) { setDenied(true); setLoading(false); }
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch {
        // GPS failed — fall back to Tel Aviv
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { location, loading, denied };
}

// ── Category filter chip ──────────────────────────────────────────────────────
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

// ── Bottom item card ──────────────────────────────────────────────────────────
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

// ── Web map — Google Static Maps API ─────────────────────────────────────────
function WebMapView({ items, center }: { items: ClothingItem[]; center: UserLocation }) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const hasKey = GOOGLE_MAPS_KEY.length > 0;

  const staticMapUrl = hasKey
    ? (() => {
        const userPin = `markers=color:red%7Clabel:★%7C${center.latitude},${center.longitude}`;
        const itemPins = items.slice(0, 30).map((item, idx) => {
          const c = itemCoordinates(item.distance, idx);
          return `markers=color:0x6366F1%7Csize:small%7C${c.latitude},${c.longitude}`;
        }).join('&');
        return (
          `https://maps.googleapis.com/maps/api/staticmap` +
          `?center=${center.latitude},${center.longitude}&zoom=13&size=800x600&scale=2` +
          `&style=feature:poi|visibility:off` +
          `&style=feature:transit|visibility:off` +
          `&${userPin}&${itemPins}` +
          `&key=${GOOGLE_MAPS_KEY}`
        );
      })()
    : null;

  return (
    <View style={styles.webContainer}>
      {/* Big map at top */}
      {hasKey ? (
        <View style={styles.mapImageWrapper}>
          <Image source={{ uri: staticMapUrl! }} style={styles.mapImage} contentFit="cover" />
          {/* You-are-here badge */}
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>📍 המיקום שלך</Text>
          </View>
          {/* Item count chip */}
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{items.length} פריטים קרובים</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noKeyBox}>
          <Text style={styles.noKeyEmoji}>🗺️</Text>
          <Text style={styles.noKeyTitle}>נדרש Google Maps API Key</Text>
          <Text style={styles.noKeyText}>הוסף EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ל-.env</Text>
        </View>
      )}

      {/* Items list */}
      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsListContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listSectionTitle}>פריטים באזורך</Text>
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

// ── Native map ─────────────────────────────────────────────────────────────────
function NativeMapView({ items, center }: { items: ClothingItem[]; center: UserLocation }) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  if (!MapView) {
    return (
      <View style={styles.unavailable}>
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
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        showsUserLocation
        showsMyLocationButton
        provider={GOOGLE_MAPS_KEY ? PROVIDER_GOOGLE : undefined}
      >
        {items.map((item, idx) => {
          const coord = itemCoordinates(item.distance, idx);
          const catInfo = CATEGORY_INFO[item.category];
          return (
            <Mk key={item.id} coordinate={coord} onPress={() => setSelectedItem(item)}>
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
  const { location, loading, denied } = useUserLocation();

  const center = location ?? TEL_AVIV;

  const filtered = filterCat === 'all'
    ? allListings
    : allListings.filter(i => i.category === filterCat);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Compact header */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <Text style={styles.title}>מפה</Text>
          {loading && <ActivityIndicator size="small" color="#6366F1" style={{ marginRight: 6 }} />}
          {!loading && location && (
            <View style={styles.gpsBadge}>
              <Text style={styles.gpsBadgeText}>● GPS</Text>
            </View>
          )}
          {!loading && denied && (
            <View style={[styles.gpsBadge, styles.gpsBadgeFallback]}>
              <Text style={[styles.gpsBadgeText, styles.gpsBadgeFallbackText]}>תל אביב</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{filtered.length} פריטים</Text>
      </View>

      {/* Compact category strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        style={styles.filterScroll}
      >
        <CategoryChip cat="all" active={filterCat === 'all'} onPress={() => setFilterCat('all')} />
        {CATEGORIES.map(c => (
          <CategoryChip key={c.id} cat={c.id} active={filterCat === c.id} onPress={() => setFilterCat(c.id)} />
        ))}
      </ScrollView>

      {/* Map — takes all remaining space */}
      <View style={{ flex: 1 }}>
        {Platform.OS === 'web'
          ? <WebMapView items={filtered} center={center} />
          : <NativeMapView items={filtered} center={center} />
        }
      </View>

      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },

  // Header — single compact row
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  gpsBadge: {
    backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 100,
  },
  gpsBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  gpsBadgeFallback: { backgroundColor: '#FEF3C7' },
  gpsBadgeFallbackText: { color: '#92400E' },
  subtitle: { fontSize: 13, color: '#9CA3AF' },

  // Category strip — compact, no wasted height
  filterScroll: { maxHeight: 40, flexGrow: 0 },
  filterBar: {
    paddingHorizontal: 16, paddingVertical: 4, gap: 6, flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },

  // Web layout
  webContainer: { flex: 1 },
  mapImageWrapper: {
    height: '52%',   // big map — more than half the space
    position: 'relative',
  },
  mapImage: { width: '100%', height: '100%' },
  locationBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  locationBadgeText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  countChip: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
  },
  countChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  noKeyBox: {
    height: 200, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  noKeyEmoji: { fontSize: 48 },
  noKeyTitle: { fontSize: 16, fontWeight: '800', color: '#3730A3' },
  noKeyText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },

  // Items list (below map on web)
  itemsList: { flex: 1 },
  itemsListContent: { padding: 14, gap: 10 },
  listSectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#6366F1',
    textAlign: 'right', marginBottom: 2,
  },

  // Item card
  itemCard: {
    backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row-reverse',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  itemCardImg: { width: 84, height: 96 },
  itemCardInfo: { flex: 1, padding: 12, gap: 3, justifyContent: 'center' },
  itemCardTopRow: {
    flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'space-between',
  },
  itemCardName: { fontSize: 14, fontWeight: '700', color: '#111827', flexShrink: 1, textAlign: 'right' },
  itemCardPrice: { fontSize: 16, fontWeight: '900', color: '#6366F1' },
  itemCardBrand: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  itemCardFooter: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  itemCardCat: { fontSize: 12, color: '#6B7280' },
  itemCardDist: { fontSize: 12, color: '#9CA3AF' },

  // Native map
  unavailable: {
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

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#6B7280' },
});
