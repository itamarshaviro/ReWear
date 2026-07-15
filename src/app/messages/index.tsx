import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { TabBar } from '@/components/tab-bar';
import type { InterestRequest, Chat } from '@/data/mock';

function MatchCard({ req, onAccept, onHold, onDecline }: {
  req: InterestRequest;
  onAccept: () => void;
  onHold: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchDot} />
        <Text style={styles.matchLabel}>התאמה חדשה!</Text>
      </View>

      <View style={styles.matchBody}>
        <Image source={{ uri: req.itemImage }} style={styles.matchThumb} contentFit="cover" />
        <View style={styles.matchInfo}>
          <Text style={styles.matchBuyer}>{req.buyerName}</Text>
          <Text style={styles.matchItem} numberOfLines={1}>
            {req.buyerGender === 'female' ? 'מעוניינת' : req.buyerGender === 'male' ? 'מעוניין' : 'מעוניין/ת'} ב: {req.itemName}
          </Text>
          <Text style={styles.matchQuestion}>הפריט עדיין זמין?</Text>
          <Text style={styles.matchTime}>{req.createdAt}</Text>
        </View>
      </View>

      <View style={styles.matchActions}>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
          <Text style={styles.declineBtnText}>❌ לא, נמכר</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.holdBtn} onPress={onHold} activeOpacity={0.8}>
          <Text style={styles.holdBtnText}>⏸ תפוס כרגע</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>✅ זמין! פתח צ׳אט</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChatRow({ chat, onDelete }: { chat: Chat; onDelete: () => void }) {
  const last = chat.messages[chat.messages.length - 1];

  function confirmDelete() {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('למחוק את הצ\'אט הזה?')) onDelete();
    } else {
      Alert.alert('מחיקת צ\'אט', `למחוק את השיחה עם ${chat.otherPartyName}?`, [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: onDelete },
      ]);
    }
  }

  return (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chat.id } })}
      onLongPress={confirmDelete}
      activeOpacity={0.8}
    >
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteBtnIcon}>🗑</Text>
      </TouchableOpacity>
      <View style={styles.chatRight}>
        <Text style={styles.chatName}>{chat.otherPartyName}</Text>
        <Image source={{ uri: chat.itemImage }} style={styles.chatThumb} contentFit="cover" />
      </View>
      <View style={styles.chatMeta}>
        <View style={styles.chatItemRow}>
          <Text style={styles.chatItem} numberOfLines={1}>{chat.itemName}</Text>
          {chat.itemPrice != null && (
            <Text style={styles.chatPrice}>₪{chat.itemPrice}</Text>
          )}
        </View>
        <Text style={styles.chatLast} numberOfLines={1}>{last?.text ?? ''}</Text>
        <Text style={styles.chatTime}>{last?.timestamp ?? ''}</Text>
      </View>
      {chat.isClosed && (
        <View style={styles.closedBadge}>
          <Text style={styles.closedBadgeText}>הושלם</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const { requests, chats, respondToRequest, refreshChats, refreshRequests, deleteChat } = useApp();
  const { user } = useAuth();
  const [showArchive, setShowArchive] = useState(false);

  useFocusEffect(useCallback(() => {
    refreshChats();
    refreshRequests();
  }, []));

  const pending = requests.filter(r => r.status === 'pending');
  const activeChats = chats.filter(c => !c.isClosed);
  const archivedChats = chats.filter(c => c.isClosed);

  async function handleAccept(requestId: string) {
    await respondToRequest(requestId, 'accept');
    router.push({ pathname: '/chat/[id]', params: { id: requestId } });
  }
  async function handleHold(requestId: string) {
    await respondToRequest(requestId, 'hold');
    router.push({ pathname: '/chat/[id]', params: { id: requestId } });
  }
  function handleDecline(requestId: string) {
    respondToRequest(requestId, 'decline');
  }

  const hasContent = pending.length > 0 || activeChats.length > 0 || archivedChats.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>הודעות</Text>
        {user && (
          <Text style={styles.subtitle}>{user.firstName} {user.lastName}</Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, !hasContent && styles.contentCenter]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending match requests */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🔔 התאמות ממתינות ({pending.length})
            </Text>
            {pending.map(req => (
              <MatchCard
                key={req.id}
                req={req}
                onAccept={() => handleAccept(req.id)}
                onHold={() => handleHold(req.id)}
                onDecline={() => handleDecline(req.id)}
              />
            ))}
          </View>
        )}

        {/* Active chats */}
        {activeChats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 שיחות פעילות</Text>
            <View style={styles.chatList}>
              {activeChats.map(chat => (
                <ChatRow key={chat.id} chat={chat} onDelete={() => deleteChat(chat.id)} />
              ))}
            </View>
          </View>
        )}

        {/* Archive */}
        {archivedChats.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.archiveHeader}
              onPress={() => setShowArchive(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.archiveArrow}>{showArchive ? '▲' : '▼'}</Text>
              <Text style={styles.sectionTitle}>📦 ארכיון ({archivedChats.length})</Text>
            </TouchableOpacity>
            {showArchive && (
              <View style={[styles.chatList, styles.archiveList]}>
                {archivedChats.map(chat => (
                  <ChatRow key={chat.id} chat={chat} onDelete={() => deleteChat(chat.id)} />
                ))}
              </View>
            )}
          </View>
        )}

        {!hasContent && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💌</Text>
            <Text style={styles.emptyTitle}>אין הודעות עדיין</Text>
            <Text style={styles.emptySub}>
              כשמישהו יתעניין בפריט שלך{'\n'}או תשלח לייק לפריט — זה יופיע כאן
            </Text>
            <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/')}>
              <Text style={styles.discoverBtnText}>צא לגלות פריטים →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', textAlign: 'right' },
  subtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'right' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 24, paddingBottom: 16 },
  contentCenter: { flex: 1, justifyContent: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#374151', textAlign: 'right' },
  // Match card
  matchCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 14,
    borderWidth: 1.5, borderColor: '#E0E7FF',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  matchHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  matchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F43F5E' },
  matchLabel: { fontSize: 12, fontWeight: '700', color: '#F43F5E', textAlign: 'right' },
  matchBody: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  matchThumb: { width: 60, height: 60, borderRadius: 12 },
  matchInfo: { flex: 1, gap: 3 },
  matchBuyer: { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'right' },
  matchItem: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  matchQuestion: { fontSize: 13, fontWeight: '600', color: '#6366F1', textAlign: 'right' },
  matchTime: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
  matchActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FFF1F2',
  },
  declineBtnText: { fontSize: 13, fontWeight: '700', color: '#E11D48' },
  holdBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCD34D', backgroundColor: '#FFFBEB',
  },
  holdBtnText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  acceptBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // Chat rows
  chatList: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  archiveList: {
    opacity: 0.85,
  },
  chatRow: {
    flexDirection: 'row-reverse', padding: 14, gap: 12, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  chatRight: { alignItems: 'center', gap: 6 },
  chatThumb: { width: 52, height: 52, borderRadius: 10 },
  chatMeta: { flex: 1, gap: 3 },
  chatName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  chatTime: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
  chatItemRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  chatItem: { fontSize: 12, color: '#6366F1', fontWeight: '600', textAlign: 'right', flex: 1 },
  chatPrice: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  chatLast: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  closedBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  closedBadgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  archiveHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
  },
  deleteBtn: { paddingHorizontal: 4, justifyContent: 'center' },
  deleteBtnIcon: { fontSize: 16, opacity: 0.4 },
  archiveArrow: { fontSize: 11, color: '#9CA3AF' },
  // Empty state
  empty: { alignItems: 'center', gap: 14, paddingVertical: 48 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  discoverBtn: {
    marginTop: 8, backgroundColor: '#6366F1',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100,
  },
  discoverBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
