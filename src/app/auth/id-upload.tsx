import { useState } from 'react';
import {
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
import { useAuth } from '@/context/auth-context';

export default function IdUploadScreen() {
  const { setIdImage } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function pick(source: 'camera' | 'gallery') {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('נדרשת הרשאה', 'אפשר גישה למצלמה בהגדרות.'); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.9 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('נדרשת הרשאה', 'אפשר גישה לגלריה בהגדרות.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.9 });
    }

    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  }

  function proceed() {
    if (imageUri) setIdImage(imageUri);
    router.push('/auth/address');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map(s => (
            <View key={s} style={[styles.step, s <= 3 && styles.stepDone]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.icon}>🪪</Text>
          <Text style={styles.title}>צילום תעודת זהות</Text>
          <Text style={styles.sub}>
            לצורך אימות זהות בלבד.{'\n'}
            הפרטים מוצפנים ומאובטחים.
          </Text>
        </View>

        {imageUri ? (
          <View style={styles.idPreview}>
            <Image source={{ uri: imageUri }} style={styles.idImage} contentFit="cover" />
            <View style={styles.idOverlay}>
              <Text style={styles.idOverlayText}>✓ תמונה נטענה</Text>
            </View>
          </View>
        ) : (
          <View style={styles.idPlaceholder}>
            <Text style={styles.idPlaceholderEmoji}>🆔</Text>
            <Text style={styles.idPlaceholderText}>תצוגה מקדימה של התעודה</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.pickBtn, styles.cameraBtn]} onPress={() => pick('camera')} activeOpacity={0.85}>
            <Text style={styles.pickEmoji}>📷</Text>
            <Text style={[styles.pickLabel, { color: '#fff' }]}>צלם עכשיו</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickBtn, styles.galleryBtn]} onPress={() => pick('gallery')} activeOpacity={0.85}>
            <Text style={styles.pickEmoji}>🖼️</Text>
            <Text style={[styles.pickLabel, { color: '#374151' }]}>בחר מגלריה</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, !imageUri && styles.nextBtnOutline]}
          onPress={proceed}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, !imageUri && styles.nextBtnTextOutline]}>
            {imageUri ? 'המשך →' : 'דלג (אופציונלי)'}
          </Text>
        </TouchableOpacity>
      </View>
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
  stepRow: { flexDirection: 'row', gap: 6 },
  step: { width: 28, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDone: { backgroundColor: '#6366F1' },
  content: { flex: 1, padding: 24, gap: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 8 },
  icon: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  idPreview: {
    height: 180, borderRadius: 16, overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  idImage: { width: '100%', height: '100%' },
  idOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(99,102,241,0.85)', paddingVertical: 8, alignItems: 'center',
  },
  idOverlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  idPlaceholder: {
    height: 180, borderRadius: 16, borderWidth: 2,
    borderColor: '#E5E7EB', borderStyle: 'dashed',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  idPlaceholderEmoji: { fontSize: 40 },
  idPlaceholderText: { fontSize: 14, color: '#9CA3AF' },
  buttons: { flexDirection: 'row', gap: 12 },
  pickBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cameraBtn: { backgroundColor: '#6366F1' },
  galleryBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  pickEmoji: { fontSize: 20 },
  pickLabel: { fontSize: 15, fontWeight: '700' },
  nextBtn: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  nextBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#D1D5DB', shadowOpacity: 0 },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  nextBtnTextOutline: { color: '#6B7280' },
});
