import { useEffect, useRef, useState } from 'react';
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

// Web-only: interactive Google Maps
let GoogleMap: React.ComponentType<any> | null = null;
let GMarker: React.ComponentType<any> | null = null;
let useJsApiLoader: ((...args: any[]) => any) | null = null;
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const gmaps = require('@react-google-maps/api');
    GoogleMap = gmaps.GoogleMap;
    GMarker = gmaps.Marker;
    useJsApiLoader = gmaps.useJsApiLoader;
  } catch { /* not available */ }
}

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

// ── Web map — Interactive Google Maps ────────────────────────────────────────
function WebMapView({ items, center }: { items: ClothingItem[]; center: UserLocation }) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  const loaderResult = useJsApiLoader
    ? useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY, id: 'rewear-map' })
    : { isLoaded: false };
  const isLoaded = loaderResult.isLoaded;

  if (!GoogleMap || !GOOGLE_MAPS_KEY) {
    return (
      <View style={styles.noKeyBox}>
        <Text style={styles.noKeyEmoji}>🗺️</Text>
        <Text style={styles.noKeyTitle}>נדרש Google Maps API Key</Text>
        <Text style={styles.noKeyText}>הוסף EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ל-.env</Text>
      </View>
    );
  }

  const GM = GoogleMap!;
  const Mk = GMarker!;

  function zoomIn() {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() + 1);
  }
  function zoomOut() {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() - 1);
  }

  // Items sorted: selected first
  const sortedItems = selectedItem
    ? [selectedItem, ...items.filter(i => i.id !== selectedItem.id)]
    : items;

  return (
    <View style={styles.webContainer}>
      {/* Left pane — map (50%) */}
      <View style={styles.mapPane}>
        {isLoaded ? (
          <GM
            mapContainerStyle={{ width: '100%', height: '100%' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onLoad={(map: any) => {
              map.setCenter({ lat: center.latitude, lng: center.longitude });
              map.setZoom(13);
              mapRef.current = map;
            }}
            options={{
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              zoomControl: false,
            }}
          >
            <Mk
              position={{ lat: center.latitude, lng: center.longitude }}
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
              title="המיקום שלך"
            />
            {items.map((item, idx) => {
              const c = (typeof item.lat === 'number' && typeof item.lng === 'number')
                ? { latitude: item.lat, longitude: item.lng }
                : itemCoordinates(item.distance, idx);
              const isSelected = selectedItem?.id === item.id;
              return (
                <Mk
                  key={item.id}
                  position={{ lat: c.latitude, lng: c.longitude }}
                  title={`${item.name} — ₪${item.price}`}
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                  icon={isSelected ? { url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png' } : undefined}
                />
              );
            })}
          </GM>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        )}

        {/* Zoom buttons */}
        {isLoaded && (
          <View style={styles.zoomBtns}>
            <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} activeOpacity={0.75}>
              <Text style={styles.zoomBtnText}>+</Text>
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} activeOpacity={0.75}>
              <Text style={styles.zoomBtnText}>−</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Right pane — items list (50%) */}
      <View style={styles.listPane}>
        <View style={styles.listHeader}>
          <Text style={styles.listSectionTitle}>
            {items.length} פריטים באזורך
          </Text>
        </View>
        <ScrollView
          style={styles.itemsList}
          contentContainerStyle={styles.itemsListContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedItems.map(item => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedItem(isSelected ? null : item)}
                activeOpacity={0.85}
                style={[styles.itemCardWrap, isSelected && styles.itemCardWrapSelected]}
              >
                <ItemCard item={item} onPress={() => router.push('/buyer/feed')} />
              </TouchableOpacity>
            );
          })}
          {items.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>לא נמצאו פריטים בקטגוריה זו</Text>
            </View>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
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
          const coord = (typeof item.lat === 'number' && typeof item.lng === 'number')
            ? { latitude: item.lat, longitude: item.lng }
            : itemCoordinates(item.distance, idx);
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
  const { otherListings: allListings, setUserLocation } = useApp();
  const [filterCats, setFilterCats] = useState<Set<Category>>(new Set());
  const { location, loading, denied } = useUserLocation();

  useEffect(() => {
    if (location) setUserLocation(location);
  }, [location]);

  const center = location ?? TEL_AVIV;

  const filtered = filterCats.size === 0
    ? allListings
    : allListings.filter(i => filterCats.has(i.category));

  function toggleCat(cat: Category) {
    setFilterCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

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

      {/* Compact category strip — multi-select */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        style={styles.filterScroll}
      >
        <CategoryChip cat="all" active={filterCats.size === 0} onPress={() => setFilterCats(new Set())} />
        {CATEGORIES.map(c => (
          <CategoryChip key={c.id} cat={c.id} active={filterCats.has(c.id)} onPress={() => toggleCat(c.id)} />
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

  // Web layout — side by side
  webContainer: { flex: 1, flexDirection: 'row' },
  mapPane: { flex: 1 },
  listPane: {
    width: '42%',
    borderLeftWidth: 1, borderLeftColor: '#E5E7EB',
    backgroundColor: '#F8F7FF',
  },
  listHeader: {
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  listSectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#6366F1', textAlign: 'right',
  },
  itemCardWrap: { borderRadius: 16, overflow: 'hidden' },
  itemCardWrapSelected: {
    borderWidth: 2, borderColor: '#6366F1',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },

  noKeyBox: {
    flex: 1, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  noKeyEmoji: { fontSize: 48 },
  noKeyTitle: { fontSize: 16, fontWeight: '800', color: '#3730A3' },
  noKeyText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },

  // Items list
  itemsList: { flex: 1 },
  itemsListContent: { padding: 10, gap: 8 },

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
  // Zoom buttons (web)
  zoomBtns: {
    position: 'absolute', right: 12, top: '50%',
    backgroundColor: '#fff', borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  zoomBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  zoomBtnText: { fontSize: 20, fontWeight: '300', color: '#374151', lineHeight: 24 },
  zoomDivider: { height: 1, backgroundColor: '#E5E7EB' },

  // Native map selected card overlay
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
