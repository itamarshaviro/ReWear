import { useState, useMemo, useEffect } from 'react';
import {
  Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Stars } from '@/components/stars';

const CLOUDINARY_CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(uri: string): Promise<string> {
  const form = new FormData();
  form.append('file', { uri, type: 'image/jpeg', name: 'profile.jpg' } as never);
  form.append('upload_preset', CLOUDINARY_PRESET ?? '');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST', body: form,
  });
  const json = await res.json();
  return json.secure_url as string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEMO_REVIEWS = [
  { id: 'r1', score: 5, review: 'מוכר מעולה! הפריט הגיע בדיוק כמו בתמונה, עסקה חלקה ומהירה.', reviewer: 'ליאור כ.', date: '12.06.25' },
  { id: 'r2', score: 4, review: 'שירות טוב, הפריט היה במצב טוב. ממליץ!', reviewer: 'יעל מ.', date: '05.06.25' },
  { id: 'r3', score: 5, review: 'הגיב מהר, היה נחמד וסבלני. בהחלט אקנה שוב.', reviewer: 'אמיר ש.', date: '28.05.25' },
];


type ProfileTab = 'seller' | 'buyer';

// ── Small components ──────────────────────────────────────────────────────────

function Avatar({ name, photoUrl, onPress }: { name: string; photoUrl?: string; onPress: () => void }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.avatarWrapper}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.avatarPhoto} contentFit="cover" />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.avatarEditBadge}>
        <Text style={styles.avatarEditIcon}>✎</Text>
      </View>
    </TouchableOpacity>
  );
}

function ReviewCard({ score, review, reviewer, date }: {
  score: number; review: string; reviewer: string; date: string;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewDate}>{date}</Text>
        <View style={styles.reviewTop}>
          <Stars score={score} size={13} />
          <Text style={styles.reviewerName}>{reviewer}</Text>
        </View>
      </View>
      {review ? <Text style={styles.reviewText}>{review}</Text> : null}
    </View>
  );
}

function TrustBar({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const label = score >= 90 ? 'מצוין' : score >= 75 ? 'טוב מאוד' : score >= 60 ? 'טוב' : 'בסיסי';
  return (
    <View style={styles.trustSection}>
      <View style={styles.trustLabelRow}>
        <Text style={[styles.trustPct, { color }]}>{score}%</Text>
        <Text style={styles.trustLabel}>אמינות · {label}</Text>
      </View>
      <View style={styles.trustTrack}>
        <View style={[styles.trustFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}


// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout, updatePreferences, updateProfilePhoto } = useAuth();
  const { myListings, ratings, getItemStatus, allListings } = useApp();

  const [tab, setTab] = useState<ProfileTab>('seller');
  const [uploading, setUploading] = useState(false);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('נדרשת הרשאה', 'יש לאפשר גישה לגלריה בהגדרות');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri);
      await updateProfilePhoto(url);
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו להעלות את התמונה');
    } finally {
      setUploading(false);
    }
  }

  const selBrands = user?.preferences?.brands ?? [];

  useEffect(() => {
    if (!user) router.replace('/auth/register');
  }, [user]);

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;

  // Seller stats
  const soldCount   = myListings.filter(l => getItemStatus(l.id) === 'sold').length;
  const activeCount = myListings.filter(l => getItemStatus(l.id) === 'active').length;

  const allReviews = [...DEMO_REVIEWS];
  ratings.forEach(r => {
    if (r.review) {
      allReviews.unshift({ id: r.id, score: r.score, review: r.review, reviewer: 'קונה', date: '15.06.25' });
    }
  });
  const avgScore = allReviews.reduce((s, r) => s + r.score, 0) / (allReviews.length || 1);

  // Trust score: avg rating (out of 100) + bonus for sales
  const trustScore = Math.min(Math.round(avgScore * 20) + Math.min(soldCount * 3, 15), 99);

  // Response time (demo — faster as more sales)
  const responseTime = soldCount >= 5 ? '~1 שעה' : soldCount >= 2 ? '~3 שעות' : '~12 שעות';

  // Smart matches — items in the feed matching buyer's brand preferences
  const matchedItems = useMemo(() => {
    if (!selBrands.length) return [];
    return allListings.filter(item => selBrands.includes(item.brand)).slice(0, 6);
  }, [allListings, selBrands]);

  function handleLogout() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('האם אתה בטוח שברצונך להתנתק?')
      : true;
    if (confirmed) {
      logout(); // on web: signs out + navigates; on native: sets user null
      if (Platform.OS !== 'web') router.replace('/auth');
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>הפרופיל שלי</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Avatar name={fullName} photoUrl={user.profilePhoto} onPress={handlePickPhoto} />
          {uploading && <Text style={styles.uploadingText}>מעלה תמונה...</Text>}
          <Text style={styles.userName}>{fullName}</Text>
          {user.isVerified && (
            <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ מאומת</Text></View>
          )}
          <View style={styles.ratingRow}>
            <Stars score={avgScore} size={18} />
            <Text style={styles.ratingNum}>{avgScore.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({allReviews.length} ביקורות)</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'buyer' && styles.tabActive]}
            onPress={() => setTab('buyer')}
          >
            {matchedItems.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{matchedItems.length}</Text></View>
            )}
            <Text style={[styles.tabText, tab === 'buyer' && styles.tabTextActive]}>🛍️ קונה</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'seller' && styles.tabActive]}
            onPress={() => setTab('seller')}
          >
            <Text style={[styles.tabText, tab === 'seller' && styles.tabTextActive]}>🏷️ מוכר</Text>
          </TouchableOpacity>
        </View>

        {/* ── SELLER TAB ── */}
        {tab === 'seller' && (
          <>
            {/* Trust score */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>אמינות מוכר</Text>
              <TrustBar score={trustScore} />
            </View>

            {/* Seller stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{activeCount}</Text>
                <Text style={styles.statLabel}>פעילים</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxBorder]}>
                <Text style={styles.statNum}>{soldCount}</Text>
                <Text style={styles.statLabel}>נמכרו</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxBorder]}>
                <Text style={styles.statNum}>{responseTime}</Text>
                <Text style={styles.statLabel}>זמן תגובה</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{allReviews.length}</Text>
                <Text style={styles.statLabel}>ביקורות</Text>
              </View>
            </View>

            {/* Reviews */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ביקורות שקיבלתי</Text>
              {allReviews.map(r => (
                <ReviewCard key={r.id} {...r} />
              ))}
            </View>

            {!user.isPremium ? (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/seller/upgrade')}>
                <Text style={styles.upgradeBtnText}>⭐ שדרג לפרמיום · ₪20/חודש</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.premiumActiveBadge}>
                <Text style={styles.premiumActiveBadgeText}>⭐ פרמיום פעיל</Text>
              </View>
            )}

            <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/seller/dashboard')}>
              <Text style={styles.dashboardBtnText}>הדשבורד שלי →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── BUYER TAB ── */}
        {tab === 'buyer' && (
          <>
            {/* Preferences summary + edit button */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>העדפות קנייה</Text>
              {selBrands.length > 0 ? (
                <Text style={styles.cardSub}>
                  {selBrands.length === 1 ? selBrands[0] : `${selBrands.length} מותגים נבחרו`}
                  {(user?.preferences?.topSizes?.length ?? 0) > 0 && ` · ${user!.preferences!.topSizes.join(', ')}`}
                </Text>
              ) : (
                <Text style={styles.cardSub}>לא הוגדרו העדפות עדיין</Text>
              )}
              <TouchableOpacity style={styles.editPrefBtn} onPress={() => router.push('/profile/preferences')} activeOpacity={0.85}>
                <Text style={styles.editPrefBtnText}>{selBrands.length > 0 ? 'ערוך העדפות ←' : 'הגדר העדפות ←'}</Text>
              </TouchableOpacity>
            </View>

            {/* Matched items */}
            {matchedItems.length > 0 && (
              <View style={styles.card}>
                <View style={styles.matchHeader}>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>{matchedItems.length}</Text>
                  </View>
                  <Text style={styles.cardTitle}>פריטים שמתאימים לך 🔔</Text>
                </View>
                <Text style={styles.cardSub}>מהמותגים שבחרת</Text>
                {matchedItems.map(item => (
                  <TouchableOpacity key={item.id} style={styles.matchCard} activeOpacity={0.8}>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.matchBrand}>{item.brand} · ₪{item.price}</Text>
                    </View>
                    <Image source={{ uri: item.imageUrl }} style={styles.matchImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selBrands.length === 0 && (
              <View style={styles.emptyMatches}>
                <Text style={styles.emptyMatchesEmoji}>🔔</Text>
                <Text style={styles.emptyMatchesText}>הגדר העדפות וקבל התראות{'\n'}כשפריטים מתאימים עולים לאוויר</Text>
              </View>
            )}
          </>
        )}

        {/* Logout — always visible */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>התנתק</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },

  // Hero
  heroSection: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatarWrapper: { position: 'relative', width: 88, height: 88 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarPhoto: {
    width: 88, height: 88, borderRadius: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, left: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#6366F1', borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 12, color: '#fff' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  uploadingText: { fontSize: 12, color: '#9CA3AF' },
  userName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  verifiedBadge: { backgroundColor: '#D1FAE5', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  ratingNum: { fontSize: 16, fontWeight: '800', color: '#111827' },
  ratingCount: { fontSize: 13, color: '#9CA3AF' },

  // Tabs
  tabs: {
    flexDirection: 'row-reverse', backgroundColor: '#F3F4F6', borderRadius: 14,
    padding: 4, gap: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, position: 'relative' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#111827', fontWeight: '800' },
  tabBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#6366F1', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  cardSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: -6 },

  // Trust
  trustSection: { gap: 8 },
  trustLabelRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  trustLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  trustPct: { fontSize: 26, fontWeight: '900' },
  trustTrack: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  trustFill: { height: '100%', borderRadius: 10 },

  // Stats row
  statsRow: {
    flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statBoxBorder: { borderRightWidth: 1, borderColor: '#F3F4F6' },
  statNum: { fontSize: 15, fontWeight: '900', color: '#6366F1' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },

  // Reviews
  reviewCard: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, gap: 6 },
  reviewHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  reviewTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  reviewerName: { fontSize: 12, fontWeight: '700', color: '#374151' },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewText: { fontSize: 13, color: '#4B5563', textAlign: 'right', lineHeight: 18 },

  // Edit preferences button
  editPrefBtn: {
    backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  editPrefBtnText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },

  // Matched items
  matchHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  matchBadge: {
    backgroundColor: '#6366F1', borderRadius: 10, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  matchBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', paddingHorizontal: 4 },
  matchCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 14, overflow: 'hidden',
  },
  matchImage: { width: 64, height: 64 },
  matchInfo: { flex: 1, paddingRight: 12, gap: 3 },
  matchName: { fontSize: 14, fontWeight: '700', color: '#111827', textAlign: 'right' },
  matchBrand: { fontSize: 12, color: '#6B7280', textAlign: 'right' },

  // Empty state
  emptyMatches: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyMatchesEmoji: { fontSize: 40 },
  emptyMatchesText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  // Buttons
  upgradeBtn: {
    backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  upgradeBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  premiumActiveBadge: { backgroundColor: '#FEF9C3', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  premiumActiveBadgeText: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  dashboardBtn: { backgroundColor: '#EEF2FF', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  dashboardBtnText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  logoutBtn: { backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
