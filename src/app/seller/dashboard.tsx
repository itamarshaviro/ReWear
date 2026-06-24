import { useEffect, useRef, useCallback } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/app-context';
import { CONDITION_LABELS } from '@/data/mock';
import type { InterestRequest, Chat, ClothingItem } from '@/data/mock';

function ListingCard({ item }: { item: ClothingItem }) {
  return (
    <View style={styles.listingCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.listingImage} contentFit="cover" />
      <View style={styles.listingInfo}>
        <Text style={styles.listingName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.listingBrand}>{item.brand}</Text>
        <View style={styles.listingMeta}>
          <Text style={styles.listingPrice}>₪{item.price}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.size}</Text></View>
        </View>
        <Text style={styles.listingCond}>{CONDITION_LABELS[item.condition]}</Text>
      </View>
    </View>
  );
}

function RequestCard({ request, onAccept, onHold, onDecline }: {
  request: InterestRequest;
  onAccept: () => void;
  onHold: () => void;
  onDecline: () => void;
}) {
  if (request.status !== 'pending') return null;
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}>
        <Image source={{ uri: request.itemImage }} style={styles.requestThumb} contentFit="cover" />
        <View style={styles.requestInfo}>
          <Text style={styles.requestTitle}>יש מעוניין! 👀</Text>
          <Text style={styles.requestItem} numberOfLines={1}>{request.itemName}</Text>
          <Text style={styles.requestQuestion}>הפריט עדיין זמין?</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
          <Text style={styles.declineBtnText}>לא רלוונטי</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.holdBtn} onPress={onHold} activeOpacity={0.8}>
          <Text style={styles.holdBtnText}>תפוס כרגע</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>פנוי! 💬</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChatCard({ chat }: { chat: Chat }) {
  const last = chat.messages[chat.messages.length - 1];
  return (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chat.id } })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: chat.itemImage }} style={styles.chatThumb} contentFit="cover" />
      <View style={styles.chatInfo}>
        <View style={styles.chatRow}>
          <Text style={styles.chatTime}>{last?.timestamp ?? ''}</Text>
          <Text style={styles.chatName}>{chat.otherPartyName}</Text>
        </View>
        <Text style={styles.chatItem}>{chat.itemName}</Text>
        <Text style={styles.chatLast} numberOfLines={1}>{last?.text ?? ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { myListings, requests, chats, respondToRequest, isPremium, upgradePremium, listingCount, limit, refreshRequests } = useApp();
  const { uploaded } = useLocalSearchParams<{ uploaded?: string }>();
  const toastAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => { refreshRequests(); }, []));

  useEffect(() => {
    if (uploaded !== '1') return;
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(toastAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [uploaded]);

  const pending = requests.filter(r => r.status === 'pending');
  const acceptedChats = chats;

  async function handleAccept(requestId: string) {
    await respondToRequest(requestId, 'accept');
    router.push({ pathname: '/chat/[id]', params: { id: requestId } });
  }
  async function handleHold(requestId: string) {
    await respondToRequest(requestId, 'hold');
    router.push({ pathname: '/chat/[id]', params: { id: requestId } });
  }
  function handleDecline(requestId: string) { respondToRequest(requestId, 'decline'); }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View pointerEvents="none" style={[styles.toast, {
        opacity: toastAnim,
        transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
      }]}>
        <Text style={styles.toastText}>✅ הפריט הועלה בהצלחה ומופיע בדשבורד!</Text>
      </Animated.View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הפריטים שלי</Text>
        <TouchableOpacity
          style={isPremium ? styles.premiumBadge : styles.freeBadge}
          onPress={isPremium ? undefined : () => router.push('/seller/upgrade')}
        >
          <Text style={isPremium ? styles.premiumBadgeText : styles.freeBadgeText}>
            {isPremium ? '⭐ פרמיום' : `${listingCount}/${limit} · שדרג`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending requests */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.notifDot} />
              <Text style={styles.sectionTitle}>בקשות ממתינות ({pending.length})</Text>
            </View>
            {pending.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                onAccept={() => handleAccept(req.id)}
                onHold={() => handleHold(req.id)}
                onDecline={() => handleDecline(req.id)}
              />
            ))}
          </View>
        )}

        {/* Active chats */}
        {acceptedChats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>צ׳אטים פעילים</Text>
            {acceptedChats.map(chat => (
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </View>
        )}

        {/* My listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/seller/my-items')} style={styles.manageBtn}>
              <Text style={styles.manageBtnText}>ניהול ←</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>הפריטים שפרסמתי</Text>
          </View>
          {myListings.length === 0 ? (
            <View style={styles.emptyListings}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyText}>עדיין לא פרסמת פריטים</Text>
            </View>
          ) : (
            myListings.map(item => <ListingCard key={item.id} item={item} />)
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/seller/classify')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>הוסף פריט</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  toast: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 99,
    backgroundColor: '#22C55E', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  toastText: { fontSize: 15, fontWeight: '700', color: '#fff', textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  premiumBadge: { backgroundColor: '#FEF9C3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  premiumBadgeText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  freeBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  freeBadgeText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  manageBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  manageBtnText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  content: { padding: 20, gap: 24, paddingBottom: 100 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F43F5E' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'right' },
  // Listing card
  listingCard: {
    backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row-reverse',
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  listingImage: { width: 90, height: 110 },
  listingInfo: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  listingName: { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'right' },
  listingBrand: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  listingMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  listingPrice: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  listingCond: { fontSize: 12, color: '#6366F1', fontWeight: '600', textAlign: 'right' },
  // Request card
  requestCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 14,
    borderWidth: 1.5, borderColor: '#E0E7FF',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  requestTop: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  requestThumb: { width: 64, height: 64, borderRadius: 12 },
  requestInfo: { flex: 1, gap: 2 },
  requestTitle: { fontSize: 15, fontWeight: '800', color: '#6366F1', textAlign: 'right' },
  requestItem: { fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right' },
  requestQuestion: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  requestActions: { flexDirection: 'row', gap: 8 },
  declineBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2',
  },
  declineBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  holdBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCD34D', backgroundColor: '#FFFBEB',
  },
  holdBtnText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  acceptBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  // Chat card
  chatCard: {
    backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row-reverse',
    padding: 12, gap: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  chatThumb: { width: 52, height: 52, borderRadius: 10 },
  chatInfo: { flex: 1, gap: 3 },
  chatRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  chatTime: { fontSize: 11, color: '#9CA3AF' },
  chatItem: { fontSize: 12, color: '#6366F1', fontWeight: '600', textAlign: 'right' },
  chatLast: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  // Empty state
  emptyListings: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#6B7280' },
  // FAB
  fab: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    backgroundColor: '#6366F1', borderRadius: 100,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 28,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  fabIcon: { fontSize: 22, color: '#fff', fontWeight: '700', marginTop: -2 },
  fabText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
