import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Stars } from '@/components/stars';

const DEMO_REVIEWS = [
  { id: 'r1', score: 5, review: 'מוכר מעולה! הפריט הגיע בדיוק כמו בתמונה, עסקה חלקה ומהירה.', reviewer: 'ליאור כ.', date: '12.06.25' },
  { id: 'r2', score: 4, review: 'שירות טוב, הפריט היה במצב טוב. ממליץ!', reviewer: 'יעל מ.', date: '05.06.25' },
  { id: 'r3', score: 5, review: 'הגיב מהר, היה נחמד וסבלני. בהחלט אקנה שוב.', reviewer: 'אמיר ש.', date: '28.05.25' },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function ReviewCard({ score, review, reviewer, date }: { score: number; review: string; reviewer: string; date: string }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewDate}>{date}</Text>
        <View style={styles.reviewTop}>
          <Stars score={score} size={14} />
          <Text style={styles.reviewerName}>{reviewer}</Text>
        </View>
      </View>
      {review ? <Text style={styles.reviewText}>{review}</Text> : null}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { myListings, ratings, getItemStatus } = useApp();

  if (!user) {
    router.replace('/auth/register');
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const activeCount = myListings.filter(l => getItemStatus(l.id) === 'active').length;
  const soldCount = myListings.filter(l => getItemStatus(l.id) === 'sold').length;

  // Merge real submitted ratings + demo received ratings for display
  const allReviews = [...DEMO_REVIEWS];
  ratings.forEach(r => {
    if (r.review) {
      allReviews.unshift({
        id: r.id,
        score: r.score,
        review: r.review,
        reviewer: 'קונה אנונימי',
        date: new Date().toLocaleDateString('he-IL').split('.').reverse().join('.'),
      });
    }
  });

  const avgScore = allReviews.length > 0
    ? allReviews.reduce((s, r) => s + r.score, 0) / allReviews.length
    : 0;

  function handleLogout() {
    Alert.alert('התנתקות', 'האם אתה בטוח שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: () => { logout(); router.replace('/auth/register'); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>הפרופיל שלי</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Avatar name={fullName} />
          <Text style={styles.userName}>{fullName}</Text>
          {user.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ מאומת</Text>
            </View>
          )}
          <View style={styles.ratingRow}>
            <Stars score={avgScore} size={20} />
            <Text style={styles.ratingNum}>{avgScore.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({allReviews.length} ביקורות)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{activeCount}</Text>
            <Text style={styles.statLabel}>פריטים פעילים</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMid]}>
            <Text style={styles.statNum}>{soldCount}</Text>
            <Text style={styles.statLabel}>נמכרו</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{allReviews.length}</Text>
            <Text style={styles.statLabel}>ביקורות</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>פרטים אישיים</Text>
          <InfoRow label="אימייל" value={user.email} />
          {user.phone ? <InfoRow label="טלפון" value={user.phone} /> : null}
          {user.address ? <InfoRow label="כתובת" value={user.address} /> : null}
        </View>

        {/* Reviews */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ביקורות שקיבלתי</Text>
          {allReviews.length === 0 ? (
            <Text style={styles.emptyText}>עדיין אין ביקורות</Text>
          ) : (
            allReviews.map(r => (
              <ReviewCard key={r.id} score={r.score} review={r.review} reviewer={r.reviewer} date={r.date} />
            ))
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/seller/dashboard')}>
          <Text style={styles.dashboardBtnText}>הדשבורד שלי →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>התנתק</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },

  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  verifiedBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4,
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 4 },
  ratingNum: { fontSize: 18, fontWeight: '800', color: '#111827' },
  ratingCount: { fontSize: 13, color: '#9CA3AF' },

  // Stats
  statsRow: {
    flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statBoxMid: { borderRightWidth: 1, borderLeftWidth: 1, borderColor: '#F3F4F6' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#6366F1' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'right' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },

  // Info row
  infoRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  infoLabel: { fontSize: 13, color: '#9CA3AF', width: 60 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'right' },

  // Review card
  reviewCard: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, gap: 6,
  },
  reviewHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  reviewTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#374151' },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewText: { fontSize: 13, color: '#4B5563', textAlign: 'right', lineHeight: 18 },

  // Buttons
  dashboardBtn: {
    backgroundColor: '#EEF2FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  dashboardBtnText: { fontSize: 15, fontWeight: '700', color: '#6366F1' },
  logoutBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
