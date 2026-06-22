import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.hero}>
          <Text style={styles.logo}>ReWear</Text>
          <Text style={styles.tagline}>קנה ומכור בגדים יד שנייה 👗</Text>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>✨</Text>
            <Text style={styles.cardTitle}>הירשם</Text>
            <Text style={styles.cardSub}>חשבון חדש, בחינם תמיד</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>יצירת חשבון</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, styles.cardAlt]}>
            <Text style={styles.cardIcon}>👋</Text>
            <Text style={styles.cardTitle}>התחבר</Text>
            <Text style={styles.cardSub}>כבר יש לי חשבון</Text>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>התחברות</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          בלחיצה על כפתור זה אתה מסכים לתנאי השירות שלנו
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 40,
  },
  hero: { alignItems: 'center', gap: 10 },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#6366F1',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  cards: { width: '100%', gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  cardAlt: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  cardIcon: { fontSize: 32, marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  primaryBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '800', color: '#6366F1' },
  footer: {
    fontSize: 11,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 16,
  },
});
