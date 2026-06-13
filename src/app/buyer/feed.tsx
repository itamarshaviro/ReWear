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
const CARD_HEIGHT = SH * 0.62;

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} מ׳` : `${km.toFixed(1)} ק"מ`;
}

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
      const rotate = interpolate(translateX.value, [-SW, SW], [-20, 20], Extrapolation.CLAMP);
      return { transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }], zIndex: 10 };
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

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.5], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.5, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const inner = (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
      {isTop && (
        <>
          <Animated.View style={[styles.likeTag, likeStyle]}>
            <Text style={styles.likeTagText}>אהבתי 💚</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeTag, nopeStyle]}>
            <Text style={styles.nopeTagText}>לא מתאים ✗</Text>
          </Animated.View>
        </>
      )}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.price}>₪{item.price}</Text>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.dist}>📍 {formatDist(item.distance)}</Text>
          <View style={styles.tags}>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.size}</Text></View>
            <View style={[styles.badge, styles.condBadge]}>
              <Text style={[styles.badgeText, styles.condBadgeText]}>{CONDITION_LABELS[item.condition]}</Text>
            </View>
            <Text style={styles.brand}>{item.brand}</Text>
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
    translateX.value = withTiming(SW * 1.5, { duration: 260 }, () => runOnJS(nextCard)());
  }, [translateX, nextCard]);

  const dislikeAction = useCallback(() => {
    'worklet';
    translateX.value = withTiming(-SW * 1.5, { duration: 260 }, () => runOnJS(nextCard)());
  }, [translateX, nextCard]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.35;
    })
    .onEnd(e => {
      if (e.translationX > SWIPE_THRESHOLD) likeAction();
      else if (e.translationX < -SWIPE_THRESHOLD) dislikeAction();
      else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  function handleLike() {
    if (filtered[idx]) {
      sendInterest(filtered[idx]);
      showToast('בקשה נשלחה למוכר! 💜');
    }
    likeAction();
  }

  const catInfo = category ? CATEGORY_INFO[category] : null;
  const visible = filtered.slice(idx, idx + 3);
  const isDone = idx >= filtered.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {catInfo ? `${catInfo.emoji} ${catInfo.label}` : 'פיד'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {toast !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <View style={styles.cardsArea}>
        {isDone || filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{filtered.length === 0 ? '🔍' : '🎉'}</Text>
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

      {!isDone && filtered.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.dislikeBtn]} onPress={dislikeAction} activeOpacity={0.8}>
            <Text style={styles.dislikeIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.likeBtn]} onPress={handleLike} activeOpacity={0.8}>
            <Text style={styles.likeIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backArrow: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  toast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 99,
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardsArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrapper: {
    position: 'absolute',
    width: SW - 32,
    height: CARD_HEIGHT,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  card: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' },
  cardImage: { width: '100%', height: '65%' },
  likeTag: {
    position: 'absolute', top: 28, left: 18,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 3, borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.12)',
    transform: [{ rotate: '-14deg' }],
  },
  likeTagText: { fontSize: 18, fontWeight: '800', color: '#16A34A' },
  nopeTag: {
    position: 'absolute', top: 28, right: 18,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 3, borderColor: '#F43F5E',
    backgroundColor: 'rgba(244,63,94,0.12)',
    transform: [{ rotate: '14deg' }],
  },
  nopeTagText: { fontSize: 18, fontWeight: '800', color: '#E11D48' },
  cardInfo: { flex: 1, padding: 16, gap: 10, justifyContent: 'center' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 20, fontWeight: '800', color: '#16A34A' },
  name: { fontSize: 17, fontWeight: '700', color: '#111827', flexShrink: 1, textAlign: 'right' },
  dist: { fontSize: 12, color: '#9CA3AF' },
  tags: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  condBadge: { backgroundColor: '#EEF2FF' },
  condBadgeText: { color: '#6366F1' },
  brand: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    paddingBottom: 28,
    paddingTop: 8,
  },
  btn: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14, shadowRadius: 8, elevation: 5,
  },
  dislikeBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#FCA5A5' },
  dislikeIcon: { fontSize: 26, color: '#F43F5E', fontWeight: '700' },
  likeBtn: { backgroundColor: '#22C55E' },
  likeIcon: { fontSize: 28, color: '#fff' },
  empty: { alignItems: 'center', gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  backFilterBtn: { marginTop: 8, backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  backFilterText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
