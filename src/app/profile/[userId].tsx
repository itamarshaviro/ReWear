import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Stars } from '@/components/stars';

type PublicUser = {
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  isVerified: boolean;
  soldCount: number;
};

type Review = {
  id: string;
  score: number;
  review: string;
  reviewer: string;
  date: string;
};

function ReviewCard({ score, review, reviewer, date }: Review) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewDate}>{date}</Text>
        <Stars score={score} size={14} />
        <Text style={styles.reviewerName}>{reviewer}</Text>
      </View>
      {!!review && <Text style={styles.reviewText}>{review}</Text>}
    </View>
  );
}

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setLoading(true);
      // Load user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData } = await (supabase.from('users') as any)
        .select('first_name, last_name, profile_photo, is_verified, items_sold')
        .eq('id', userId)
        .single();

      if (userData) {
        setProfile({
          firstName: userData.first_name,
          lastName: userData.last_name,
          profilePhoto: userData.profile_photo ?? undefined,
          isVerified: userData.is_verified ?? false,
          soldCount: userData.items_sold ?? 0,
        });
      }

      // Load reviews
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviewData } = await (supabase.from('reviews') as any)
        .select('id, score, review, created_at, users:reviewer_id(first_name, last_name)')
        .eq('seller_id', userId)
        .eq('is_report', false)
        .order('created_at', { ascending: false });

      if (reviewData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setReviews(reviewData.map((r: any) => {
          const u = r.users as { first_name?: string; last_name?: string } | null;
          const firstName = u?.first_name ?? '';
          const lastInitial = u?.last_name ? u.last_name[0] + '.' : '';
          const d = new Date(r.created_at);
          const date = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(-2)}`;
          return {
            id: r.id,
            score: r.score,
            review: r.review ?? '',
            reviewer: firstName ? `${firstName} ${lastInitial}`.trim() : 'קונה',
            date,
          };
        }));
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const avgScore = reviews.length ? reviews.reduce((s, r) => s + r.score, 0) / reviews.length : 0;
  const trustScore = reviews.length > 0 ? Math.round(avgScore / 5 * 100) : 0;

  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פרופיל</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      ) : !profile ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>משתמש לא נמצא</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {profile.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <Text style={styles.fullName}>{profile.firstName} {profile.lastName}</Text>
            {profile.isVerified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ מאומת</Text></View>
            )}
            {reviews.length > 0 ? (
              <View style={styles.ratingRow}>
                <Stars score={avgScore} size={18} />
                <Text style={styles.ratingNum}>{avgScore.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({reviews.length} ביקורות)</Text>
              </View>
            ) : (
              <Text style={styles.noRatingText}>עדיין אין ביקורות</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{reviews.length}</Text>
              <Text style={styles.statLabel}>ביקורות</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, styles.statNumGreen]}>{trustScore}%</Text>
              <Text style={styles.statLabel}>אמינות</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{profile.soldCount}</Text>
              <Text style={styles.statLabel}>נמכרו</Text>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ביקורות שקיבל/ה</Text>
            {reviews.length > 0 ? (
              reviews.map(r => <ReviewCard key={r.id} {...r} />)
            ) : (
              <Text style={styles.emptyText}>עדיין אין ביקורות</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#9CA3AF' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  verifiedBadge: { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#BBF7D0' },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingNum: { fontSize: 16, fontWeight: '800', color: '#111827' },
  ratingCount: { fontSize: 13, color: '#6B7280' },
  noRatingText: { fontSize: 13, color: '#9CA3AF' },
  statsRow: {
    flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#111827' },
  statNumGreen: { color: '#16A34A' },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'right' },
  reviewCard: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, gap: 6 },
  reviewHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#374151', flex: 1, textAlign: 'right' },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewText: { fontSize: 14, color: '#6B7280', textAlign: 'right', lineHeight: 20 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
});
