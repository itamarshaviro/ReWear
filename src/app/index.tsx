import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Redirect } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { TabBar } from '@/components/tab-bar';
import { Logo } from '@/components/logo';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();
  const { allListings, unreadRatingsCount } = useApp();

  const matchCount = useMemo(() => {
    const brands = user?.preferences?.brands ?? [];
    if (!brands.length) return 0;
    return allListings.filter(item => brands.includes(item.brand)).length;
  }, [allListings, user?.preferences?.brands]);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/seller/dashboard')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>👗</Text>
        </TouchableOpacity>
        <Logo width={150} height={70} />
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>👤</Text>
          {unreadRatingsCount > 0 ? (
            <View style={styles.matchDot}>
              <Text style={styles.matchDotText}>{unreadRatingsCount > 9 ? '9+' : unreadRatingsCount}</Text>
            </View>
          ) : matchCount > 0 ? (
            <View style={styles.matchDot}>
              <Text style={styles.matchDotText}>{matchCount}</Text>
            </View>
          ) : (
            <View style={styles.userDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>שלום, {user.firstName}! 👋</Text>
        <Text style={styles.greetingSub}>מה תרצה לעשות היום?</Text>
      </View>

      {/* Role cards */}
      <View style={styles.cards}>
        <TouchableOpacity
          style={[styles.roleCard, styles.buyerCard]}
          onPress={() => router.push('/buyer/category')}
          activeOpacity={0.85}
        >
          <Text style={styles.roleEmoji}>🛍️</Text>
          <Text style={[styles.roleTitle, styles.lightText]}>אני קונה</Text>
          <Text style={[styles.roleDesc, styles.lightMuted]}>גלה פריטים ייחודיים{'\n'}קרוב אליך</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, styles.sellerCard]}
          onPress={() => router.push('/seller/classify')}
          activeOpacity={0.85}
        >
          <Text style={styles.roleEmoji}>👗</Text>
          <Text style={[styles.roleTitle, styles.darkText]}>אני מוכר</Text>
          <Text style={[styles.roleDesc, styles.darkMuted]}>פרסם פריט בקלות{'\n'}בעזרת AI</Text>
        </TouchableOpacity>
      </View>


      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#F8F7FF', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  logo: { fontSize: 22, fontWeight: '900', color: '#6366F1', letterSpacing: -0.5 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22 },
  userDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E',
  },
  matchDot: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#6366F1', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  matchDotText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  greeting: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4, gap: 4 },
  greetingText: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'right' },
  greetingSub: { fontSize: 14, color: '#6B7280', textAlign: 'right' },
  cards: { flex: 1, gap: 16, paddingHorizontal: 24, justifyContent: 'center' },
  roleCard: {
    borderRadius: 24, padding: 32, alignItems: 'center', gap: 10,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 8,
  },
  buyerCard: { backgroundColor: '#6366F1' },
  sellerCard: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.07,
  },
  roleEmoji: { fontSize: 48 },
  roleTitle: { fontSize: 22, fontWeight: '800' },
  roleDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  lightText: { color: '#fff' },
  lightMuted: { color: 'rgba(255,255,255,0.72)' },
  darkText: { color: '#111827' },
  darkMuted: { color: '#6B7280' },
  subFooter: {
    textAlign: 'center', fontSize: 12, color: '#9CA3AF',
    paddingVertical: 12,
  },
});
