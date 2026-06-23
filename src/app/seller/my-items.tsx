import { useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { CONDITION_LABELS } from '@/data/mock';
import type { ClothingItem } from '@/data/mock';
import { Stars } from '@/components/stars';

type FilterTab = 'all' | 'active' | 'pending' | 'sold';

const STATUS_LABELS: Record<'active' | 'pending' | 'sold', string> = {
  active: 'פעיל',
  pending: 'ממתין',
  sold: 'נמכר',
};
const STATUS_COLORS: Record<'active' | 'pending' | 'sold', string> = {
  active: '#22C55E',
  pending: '#F59E0B',
  sold: '#9CA3AF',
};

export default function MyItemsScreen() {
  const { myListings, requests, ratings, getItemStatus, getLikesCount, deleteListing, markListingAsSold } = useApp();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  // Stats
  const totalItems = myListings.length;
  const soldCount = myListings.filter(i => getItemStatus(i.id) === 'sold').length;
  const pendingCount = myListings.filter(i => getItemStatus(i.id) === 'pending').length;
  const totalLikes = myListings.reduce((sum, i) => sum + getLikesCount(i.id), 0);
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
    : null;

  const filtered = myListings.filter(i => {
    if (filter === 'all') return true;
    return getItemStatus(i.id) === filter;
  });

  function handleDelete(item: ClothingItem) {
    Alert.alert(
      'מחיקת פריט',
      `למחוק את "${item.name}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: () => deleteListing(item.id) },
      ]
    );
  }

  function handleMarkSold(item: ClothingItem) {
    Alert.alert(
      'סמן כנמכר',
      `לסמן את "${item.name}" כנמכר?`,
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'כן, נמכר!', onPress: () => markListingAsSold(item.id) },
      ]
    );
  }

  function startEdit(item: ClothingItem) {
    setEditingId(item.id);
    setEditPrice(String(item.price));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditPrice('');
  }

  // Price edit is demo-only (in-memory); real edit would call updateListing
  function confirmEdit() {
    cancelEdit();
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',     label: `הכל (${totalItems})` },
    { key: 'active',  label: `פעילים (${totalItems - soldCount - pendingCount})` },
    { key: 'pending', label: `ממתינים (${pendingCount})` },
    { key: 'sold',    label: `נמכרו (${soldCount})` },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/seller/dashboard')} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הפריטים שלי</Text>
        <TouchableOpacity onPress={() => router.push('/seller/upload')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ הוסף</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        <StatCard label="פריטים" value={String(totalItems)} emoji="📦" color="#6366F1" />
        <StatCard label="נמכרו" value={String(soldCount)} emoji="✅" color="#22C55E" />
        <StatCard label="ממתינים" value={String(pendingCount)} emoji="⏳" color="#F59E0B" />
        <StatCard label="לייקים" value={String(totalLikes)} emoji="❤️" color="#F43F5E" />
        {avgRating && <StatCard label="דירוג" value={avgRating} emoji="⭐" color="#F59E0B" />}
      </ScrollView>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, filter === t.key && styles.tabActive]}
            onPress={() => setFilter(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>אין פריטים בקטגוריה זו</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/seller/upload')}>
            <Text style={styles.emptyBtnText}>פרסם פריט ראשון</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = getItemStatus(item.id);
            const likes = getLikesCount(item.id);
            const isEditing = editingId === item.id;

            return (
              <View style={styles.card}>
                <View style={styles.cardMain}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImg} contentFit="cover" />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTop}>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] + '20' }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
                          {STATUS_LABELS[status]}
                        </Text>
                      </View>
                      {likes > 0 && (
                        <View style={styles.likesBadge}>
                          <Text style={styles.likesText}>❤️ {likes}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardBrand}>{item.brand}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardPrice}>₪{item.price}</Text>
                      <Text style={styles.cardSize}>{item.size}</Text>
                    </View>
                    <Text style={styles.cardCond}>{CONDITION_LABELS[item.condition]}</Text>
                  </View>
                </View>

                {/* Edit inline */}
                {isEditing && (
                  <View style={styles.editRow}>
                    <TouchableOpacity style={styles.editCancelBtn} onPress={cancelEdit}>
                      <Text style={styles.editCancelText}>ביטול</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editSaveBtn} onPress={confirmEdit}>
                      <Text style={styles.editSaveText}>שמור</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.editInput}
                      value={editPrice}
                      onChangeText={setEditPrice}
                      keyboardType="numeric"
                      placeholder="מחיר חדש"
                      textAlign="right"
                    />
                    <Text style={styles.editLabel}>₪ מחיר:</Text>
                  </View>
                )}

                {/* Action buttons */}
                {status !== 'sold' && !isEditing && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarkSold(item)} activeOpacity={0.8}>
                      <Text style={styles.actionBtnText}>✅ נמכר</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnEdit]} onPress={() => startEdit(item)} activeOpacity={0.8}>
                      <Text style={styles.actionBtnEditText}>✎ ערוך</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={() => handleDelete(item)} activeOpacity={0.8}>
                      <Text style={styles.actionBtnDeleteText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {status === 'sold' && (
                  <View style={styles.soldActions}>
                    <Stars score={ratings.filter(r => r.chatId).length > 0 ? 5 : 0} size={16} />
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={() => handleDelete(item)} activeOpacity={0.8}>
                      <Text style={styles.actionBtnDeleteText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji, color }: { label: string; value: string; emoji: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  addBtn: { backgroundColor: '#EEF2FF', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },

  // Stats
  statsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center', gap: 4, minWidth: 80,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  // Tabs
  tabs: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  tabActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },

  // Empty
  emptyArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#6B7280' },
  emptyBtn: { backgroundColor: '#6366F1', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Item card
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardMain: { flexDirection: 'row-reverse', gap: 0 },
  cardImg: { width: 100, height: 120 },
  cardInfo: { flex: 1, padding: 12, gap: 3 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 2 },
  statusBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  likesBadge: { backgroundColor: '#FEE2E2', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  likesText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  cardName: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  cardBrand: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  cardMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  cardPrice: { fontSize: 16, fontWeight: '900', color: '#16A34A' },
  cardSize: { fontSize: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, color: '#4B5563', fontWeight: '600' },
  cardCond: { fontSize: 12, color: '#6366F1', fontWeight: '600', textAlign: 'right' },

  // Actions
  actions: {
    flexDirection: 'row-reverse', gap: 8, padding: 12, paddingTop: 0,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4,
  },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#D1FAE5',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  actionBtnEdit: { backgroundColor: '#EEF2FF' },
  actionBtnEditText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  actionBtnDelete: { backgroundColor: '#FEE2E2', flex: 0, paddingHorizontal: 16 },
  actionBtnDeleteText: { fontSize: 16 },
  soldActions: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4,
  },

  // Inline edit
  editRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    padding: 12, backgroundColor: '#F9FAFB',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  editLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  editInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: '#111827',
  },
  editSaveBtn: { backgroundColor: '#6366F1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  editSaveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  editCancelBtn: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  editCancelText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
});
