import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { AI_RESULTS_BY_CATEGORY } from '@/data/mock';

type Phase = 'pick' | 'analyzing' | 'done';

export default function UploadScreen() {
  const { setDraft } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('pick');

  async function pickImage(source: 'camera' | 'gallery') {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('נדרשת הרשאה', 'אנא אפשר גישה למצלמה בהגדרות.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.85 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('נדרשת הרשאה', 'אנא אפשר גישה לגלריה בהגדרות.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85 });
    }

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setPhase('analyzing');

    // Simulate AI analysis
    setTimeout(() => setPhase('done'), 2400);
  }

  function continueToComplete() {
    if (!imageUri) return;
    // Pick a random AI result for the demo
    const categories = Object.keys(AI_RESULTS_BY_CATEGORY) as Array<keyof typeof AI_RESULTS_BY_CATEGORY>;
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const aiResult = AI_RESULTS_BY_CATEGORY[randomCat];
    setDraft({ imageUri, ...aiResult });
    router.push('/seller/complete');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <Text style={styles.title}>פרסם פריט</Text>
        <View style={{ width: 40 }} />
      </View>

      {phase === 'pick' && (
        <View style={styles.pickArea}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>📸</Text>
          </View>
          <Text style={styles.pickTitle}>הוסף תמונה של הפריט</Text>
          <Text style={styles.pickSub}>ה-AI ימלא אוטומטית את הפרטים</Text>

          <View style={styles.pickButtons}>
            <TouchableOpacity style={[styles.pickBtn, styles.cameraBtn]} onPress={() => pickImage('camera')} activeOpacity={0.85}>
              <Text style={styles.pickBtnEmoji}>📷</Text>
              <Text style={[styles.pickBtnLabel, styles.cameraBtnText]}>צלם עכשיו</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pickBtn, styles.galleryBtn]} onPress={() => pickImage('gallery')} activeOpacity={0.85}>
              <Text style={styles.pickBtnEmoji}>🖼️</Text>
              <Text style={[styles.pickBtnLabel, styles.galleryBtnText]}>בחר מגלריה</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>* במכשיר נייד תוכל גם לצלם</Text>
          )}
        </View>
      )}

      {(phase === 'analyzing' || phase === 'done') && imageUri && (
        <View style={styles.analysisArea}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
          </View>

          {phase === 'analyzing' ? (
            <View style={styles.analyzingCard}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.analyzingTitle}>ה-AI מנתח את הפריט...</Text>
              <Text style={styles.analyzingSub}>מזהה קטגוריה, מותג ומצב</Text>
            </View>
          ) : (
            <View style={styles.doneCard}>
              <Text style={styles.doneIcon}>✨</Text>
              <Text style={styles.doneTitle}>ניתוח הושלם!</Text>
              <Text style={styles.doneSub}>הפרטים מולאו אוטומטית.{'\n'}תוכל לערוך בשלב הבא.</Text>
              <TouchableOpacity style={styles.continueBtn} onPress={continueToComplete} activeOpacity={0.85}>
                <Text style={styles.continueBtnText}>המשך להשלמת הפרסום</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
  pickArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  heroIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  heroEmoji: { fontSize: 56 },
  pickTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  pickSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  pickButtons: { width: '100%', gap: 14, marginTop: 8 },
  pickBtn: { borderRadius: 20, paddingVertical: 22, paddingHorizontal: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 },
  cameraBtn: { backgroundColor: '#6366F1' },
  galleryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB' },
  pickBtnEmoji: { fontSize: 26 },
  pickBtnLabel: { fontSize: 17, fontWeight: '700' },
  cameraBtnText: { color: '#fff' },
  galleryBtnText: { color: '#374151' },
  webNote: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  analysisArea: { flex: 1, padding: 20, gap: 20 },
  imageContainer: {
    height: 260, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  preview: { width: '100%', height: '100%' },
  analyzingCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 12,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  analyzingTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  analyzingSub: { fontSize: 14, color: '#6B7280' },
  doneCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 10,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  doneIcon: { fontSize: 40 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  doneSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  continueBtn: {
    marginTop: 8, backgroundColor: '#6366F1', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
