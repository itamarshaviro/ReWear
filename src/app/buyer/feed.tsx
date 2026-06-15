import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { PanGesture } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/app-context';
import { CATEGORY_INFO, CONDITION_LABELS } from '@/data/mock';
import type { Category, ClothingItem } from '@/data/mock';

const { width: SW, height: SH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SW * 0.38;
const CARD_HEIGHT = SH * 0.64;

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} מ׳` : `${km.toFixed(1)} ק"מ`;
}

const COND_COLORS: Record<string, string> = {
  new: '#10B981',
  like_new: '#6366F1',
  good: '#F59E0B',
  fair: '#94A3B8',
  poor: '#DC2626',
};

type CardProps = {
  item: ClothingItem;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  pan: PanGesture;
  isTop: boolean;
  depth: number;
};

function SwipeCard({ item, translateX, translateY, pan, isTop, depth }: CardProps) {
  const animStyle = useAnimatedStyle(() => {
    if (isTop) {
      const rotate = interpolate(translateX.value, [-SW, SW], [-12, 12], Extrapolation.CLAMP);
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
        zIndex: 10,
      };
    }
    const p = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const base = 1 - depth * 0.05;
    return {
      transform: [
        { scale: interpolate(p, [0, 1], [base, Math.min(base + 0.04, 1)]) },
        { translateY: interpolate(p, [0, 1], [depth * 14, depth * 4]) },
      ],
      zIndex: 10 - depth,
    };
  });

  // "רוצה" tag fades in on right swipe — indigo brand color
  const wantStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  // "דלגתי" tag fades in on left swipe — neutral slate
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.5, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const condColor = COND_COLORS[item.condition] ?? '#94A3B8';

  const inner = (
    <View style={styles.card}>
      {/* Full-bleed image */}
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />

      {/* Swipe intention tags — fashion language, not LIKE/NOPE */}
      {isTop && (
        <>
          <Animated.View style={[styles.wantTag, wantStyle]}>
            <Text style={styles.wantTagText}>רוצה 🛍️</Text>
          </Animated.View>
          <Animated.View style={[styles.skipTag, skipStyle]}>
            <Text style={styles.skipTagText}>הבא ←</Text>
          </Animated.View>
        </>
      )}

      {/* Dark overlay gradient (simulated) */}
      <View style={styles.overlayBottom}>
        <View style={styles.overlayFade1} />
        <View style={styles.overlayFade2} />
        <View style={styles.overlayFade3} />
      </View>

      {/* Info on top of the image */}
      <View style={styles.cardInfo}>
        <View style={styles.infoTopRow}>
          <Text style={styles.price}>₪{item.price}</Text>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.infoBottomRow}>
          <Text style={styles.dist}>📍 {formatDist(item.distance)}</Text>
          <View style={styles.tags}>
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeBadgeText}>{item.size}</Text>
            </View>
            <View style={[styles.condDot, { backgroundColor: condColor }]} />
            <Text style={styles.condLabel}>{CONDITION_LABELS[item.condition]}</Text>
            <Text style={styles.brandLabel}>{item.brand}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.cardWrapper, animStyle]}>
      {isTop ? <GestureDetector gesture={pan}>{inner}</GestureDetector> : inner}
    </Animated.View>
  );
}

export default function FeedScreen() {
  const { category, distance, sizes, maxPrice } = useLocalSearchParams<{
    category: Category;
    distance: string;
    sizes: string;
    maxPrice: string;
  }>();
  const { allListings, sendInterest } = useApp();

  const maxDist = parseFloat(distance ?? '50');
  const sizeList = sizes ? sizes.split(',').filter(Boolean) : [];
  const maxP = parseInt(maxPrice ?? '9999');

  const filtered = allListings.filter(item => {
    if (category && item.category !== category) return false;
    if (item.distance > maxDist) return false;
    if (sizeList.length > 0 && !sizeList.includes(item.size)) return false;
    if (item.price > maxP) return false;
    return true;
  });

  const [idx, setIdx] = useState(0);
  const [toast, setToast] = useState('');
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const nextCard = useCallback(() => {
    setIdx(prev => prev + 1);
    translateX.value = 0;
    translateY.value = 0;
  }, [translateX, translateY]);

  const likeAction = useCallback(() => {
    'worklet';
    translateX.value = withTiming(SW * 1.5, { duration: 280 }, () => runOnJS(nextCard)());
  }, [translateX, nextCard]);

  const dislikeAction = useCallback(() => {
    'worklet';
    translateX.value = withTiming(-SW * 1.5, { duration: 240 }, () => runOnJS(nextCard)());
  }, [translateX, nextCard]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.28;
    })
    .onEnd(e => {
      if (e.translationX > SWIPE_THRESHOLD) likeAction();
      else if (e.translationX < -SWIPE_THRESHOLD) dislikeAction();
      else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      }
    });

  function handleLike() {
    if (filtered[idx]) {
      sendInterest(filtered[idx]);
      showToast('הפריט נשמר — המוכר יקבל הודעה 🛍️');
    }
    likeAction();
  }

  const catInfo = category ? CATEGORY_INFO[category] : null;
  const visible = filtered.slice(idx, idx + 3);
  const isDone = idx >= filtered.length;
  const remaining = Math.max(0, filtered.length - idx);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {catInfo ? `${catInfo.emoji} ${catInfo.label}` : 'פיד'}
        </Text>
        {/* Item counter chip — not Tinder progress bar */}
        {!isDone && filtered.length > 0 ? (
          <View style={styles.counterChip}>
            <Text style={styles.counterText}>{remaining} פריטים</Text>
          </View>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      {/* Toast notification */}
      {toast !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Cards area */}
      <View style={styles.cardsArea}>
        {isDone || filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{filtered.length === 0 ? '🔍' : '✨'}</Text>
            <Text style={styles.emptyTitle}>{filtered.length === 0 ? 'לא נמצאו פריטים' : 'ראית הכל!'}</Text>
            <Text style={styles.emptySub}>נסה לשנות את הסינון או חזור מאוחר יותר</Text>
            <TouchableOpacity style={styles.backFilterBtn} onPress={() => router.back()}>
              <Text style={styles.backFilterText}>שנה סינון</Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...visible].reverse().map((item, i) => {
            const depth = visible.length - 1 - i;
            return (
              <SwipeCard
                key={item.id}
                item={item}
                translateX={translateX}
                translateY={translateY}
                pan={pan}
                isTop={depth === 0}
                depth={depth}
              />
            );
          })
        )}
      </View>

      {/* Action bar — pill buttons, not Tinder circles */}
      {!isDone && filtered.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.skipBtn} onPress={dislikeAction} activeOpacity={0.75}>
            <Text style={styles.skipBtnIcon}>←</Text>
            <Text style={styles.skipBtnText}>דלג</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.wantBtn} onPress={handleLike} activeOpacity={0.87}>
            <Text style={styles.wantBtnText}>רוצה את זה</Text>
            <Text style={styles.wantBtnIcon}>🛍️</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFF8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  backArrow: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  counterChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 100,
  },
  counterText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },

  toast: {
    position: 'absolute', top: 100, alignSelf: 'center', zIndex: 99,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 100,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  cardsArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  cardWrapper: {
    position: 'absolute',
    width: SW - 32,
    height: CARD_HEIGHT,
    borderRadius: 28,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },

  card: { flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1A1A2E' },

  // Full-bleed image covers whole card
  cardImage: { position: 'absolute', width: '100%', height: '100%' },

  // Swipe indication tags — fashion language
  wantTag: {
    position: 'absolute', top: 32, left: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 2.5, borderColor: '#6366F1',
    backgroundColor: 'rgba(99,102,241,0.18)',
    transform: [{ rotate: '-8deg' }],
  },
  wantTagText: { fontSize: 17, fontWeight: '900', color: '#EEF2FF', letterSpacing: 0.5 },

  skipTag: {
    position: 'absolute', top: 32, right: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 2.5, borderColor: '#94A3B8',
    backgroundColor: 'rgba(148,163,184,0.18)',
    transform: [{ rotate: '8deg' }],
  },
  skipTagText: { fontSize: 17, fontWeight: '900', color: '#F1F5F9', letterSpacing: 0.5 },

  // Simulated gradient overlay at bottom
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  overlayFade1: { position: 'absolute', bottom: 120, left: 0, right: 0, height: 40, backgroundColor: 'rgba(10,8,20,0.0)' },
  overlayFade2: { position: 'absolute', bottom: 60, left: 0, right: 0, height: 60, backgroundColor: 'rgba(10,8,20,0.38)' },
  overlayFade3: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'rgba(10,8,20,0.72)' },

  // Info overlay on the image
  cardInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 18, gap: 10,
  },
  infoTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  price: { fontSize: 22, fontWeight: '900', color: '#F5D060' },
  name: {
    fontSize: 18, fontWeight: '700', color: '#FFFFFF',
    flexShrink: 1, textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  infoBottomRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dist: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  tags: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  sizeBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  sizeBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  condDot: { width: 7, height: 7, borderRadius: 4 },
  condLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  brandLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  // Bottom action bar — pill buttons, asymmetric, NOT Tinder circles
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 14,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
  },
  skipBtnIcon: { fontSize: 16, color: '#94A3B8', fontWeight: '700' },
  skipBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },

  wantBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  wantBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  wantBtnIcon: { fontSize: 18 },

  // Empty state
  empty: { alignItems: 'center', gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  backFilterBtn: {
    marginTop: 8, backgroundColor: '#6366F1',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100,
  },
  backFilterText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
