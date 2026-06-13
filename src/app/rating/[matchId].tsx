import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/app-context';
import { Stars } from '@/components/stars';

export default function RatingScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { chats, submitRating } = useApp();
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');

  const chat = chats.find(c => c.id === matchId);

  function handleSubmit() {
    if (score === 0) {
      Alert.alert('נדרש דירוג', 'בחר בין 1 ל-5 כוכבים.');
      return;
    }
    submitRating(matchId ?? '', score, review.trim(), 'seller');
    Alert.alert('תודה!', 'הדירוג שלך נשמר בהצלחה.', [
      { text: 'אישור', onPress: () => router.replace('/') },
    ]);
  }

  const LABELS: Record<number, string> = {
    1: 'גרוע',
    2: 'סביר',
    3: 'טוב',
    4: 'מצוין',
    5: 'מושלם!',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>דרג את העסקה</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.heroArea}>
            <Text style={styles.heroEmoji}>⭐</Text>
            <Text style={styles.heroTitle}>איך הייתה העסקה?</Text>
            {chat && (
              <Text style={styles.heroSub}>
                {chat.itemName} · {chat.otherPartyName}
              </Text>
            )}
          </View>

          {/* Stars */}
          <View style={styles.starsArea}>
            <Stars score={score} interactive onPress={setScore} size={48} />
            {score > 0 && (
              <Text style={styles.scoreLabel}>{LABELS[score]}</Text>
            )}
          </View>

          {/* Score breakdown chips */}
          <View style={styles.scoreChips}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.scoreChip, score === n && styles.scoreChipActive]}
                onPress={() => setScore(n)}
                activeOpacity={0.75}
              >
                <Text style={[styles.scoreChipText, score === n && styles.scoreChipTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review text */}
          <View style={styles.reviewField}>
            <Text style={styles.reviewLabel}>ביקורת (אופציונלי)</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="ספר לנו על העסקה..."
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
              textAlign="right"
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, score === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>שלח דירוג</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/')} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>דלג על הדירוג</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  content: { flex: 1, padding: 24, gap: 24 },
  heroArea: { alignItems: 'center', gap: 8 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  starsArea: { alignItems: 'center', gap: 12 },
  scoreLabel: { fontSize: 22, fontWeight: '800', color: '#F59E0B' },
  scoreChips: { flexDirection: 'row-reverse', gap: 10, justifyContent: 'center' },
  scoreChip: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  scoreChipActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  scoreChipText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  scoreChipTextActive: { color: '#fff' },
  reviewField: { gap: 8 },
  reviewLabel: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'right' },
  reviewInput: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB',
    padding: 16, fontSize: 15, color: '#111827', minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0.05 },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
