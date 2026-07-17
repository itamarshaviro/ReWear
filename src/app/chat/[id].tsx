import { useRef, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/context/app-context';
import { ActivityIndicator } from 'react-native';
import type { ChatMessage } from '@/data/mock';
import { ReportModal } from '@/components/report-modal';
import { enhanceImage } from '@/lib/cloudinary';

type ListItem =
  | { type: 'message'; msg: ChatMessage }
  | { type: 'date'; label: string; key: string };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(d: string): string {
  const today = todayStr();
  const yesterday = (() => {
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    return `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
  })();
  if (d === today) return 'היום';
  if (d === yesterday) return 'אתמול';
  const dt = new Date(d);
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `יום ${days[dt.getDay()]}, ${dt.getDate()} ב${months[dt.getMonth()]}`;
}

function buildListItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = msg.date ?? todayStr();
    if (d !== lastDate) {
      items.push({ type: 'date', label: formatDateLabel(d), key: `date-${d}` });
      lastDate = d;
    }
    items.push({ type: 'message', msg });
  }
  return items;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateSepRow}>
      <View style={styles.dateSepLine} />
      <Text style={styles.dateSepText}>{label}</Text>
      <View style={styles.dateSepLine} />
    </View>
  );
}

function Bubble({ msg, onImagePress }: { msg: ChatMessage; onImagePress?: (url: string) => void }) {
  const isSeller = msg.from === 'seller';
  if (msg.type === 'image' && msg.imageUrl) {
    return (
      <View style={[styles.bubbleRow, isSeller ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.imageBubble, isSeller ? styles.imageBubbleSeller : styles.imageBubbleBuyer]}>
          <TouchableOpacity onPress={() => onImagePress?.(msg.imageUrl!)} activeOpacity={0.9}>
            <Image source={{ uri: msg.imageUrl }} style={styles.chatImage} contentFit="cover" />
          </TouchableOpacity>
          {!!msg.text && (
            <Text style={[styles.bubbleText, isSeller ? styles.sellerText : styles.buyerText, { paddingHorizontal: 10, paddingBottom: 4 }]}>
              {msg.text}
            </Text>
          )}
          <Text style={[styles.bubbleTime, isSeller ? styles.sellerTime : styles.buyerTime, { paddingHorizontal: 10, paddingBottom: 6 }]}>
            {msg.timestamp}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.bubbleRow, isSeller ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      <View style={[styles.bubble, isSeller ? styles.sellerBubble : styles.buyerBubble]}>
        <Text style={[styles.bubbleText, isSeller ? styles.sellerText : styles.buyerText]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, isSeller ? styles.sellerTime : styles.buyerTime]}>
          {msg.timestamp}
        </Text>
      </View>
    </View>
  );
}

function SoldBubble({
  msg,
  isSeller,
  isConfirmed,
  onConfirm,
  onDecline,
}: {
  msg: ChatMessage;
  isSeller: boolean;
  isConfirmed: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.soldBubbleWrap}>
      <View style={styles.soldBubble}>
        <Text style={styles.soldBubbleTitle}>📦 הפריט נמכר ✅</Text>
        {isConfirmed ? (
          <Text style={styles.soldBubbleDone}>העסקה אושרה!</Text>
        ) : isSeller ? (
          <Text style={styles.soldBubblePending}>ממתין לאישור הקונה...</Text>
        ) : (
          <>
            <Text style={styles.soldBubbleQuestion}>המוכר סימן שהפריט נמכר לך. מאשר?</Text>
            <View style={styles.soldBubbleBtns}>
              <TouchableOpacity style={styles.soldBubbleNo} onPress={onDecline} activeOpacity={0.8}>
                <Text style={styles.soldBubbleNoText}>לא</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.soldBubbleYes} onPress={onConfirm} activeOpacity={0.85}>
                <Text style={styles.soldBubbleYesText}>כן, קניתי ✓</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <Text style={styles.soldBubbleTime}>{msg.timestamp}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, sendMessage, markSold, buyerConfirmSold, buyerDeclineSold, refreshChats, markChatRead } = useApp();
  const [text, setText] = useState('');
  const [loadingRetry, setLoadingRetry] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const listRef = useRef<FlatList<ListItem>>(null);

  const chat = chats.find(c => c.id === id);

  useEffect(() => {
    if (!chat && !loadingRetry) {
      setLoadingRetry(true);
      refreshChats().finally(() => setLoadingRetry(false));
    }
  }, [chat]);

  // Mark chat as read when opened
  useEffect(() => {
    if (id) markChatRead(id);
  }, [id]);

  // Poll for buyer confirmation when seller is waiting
  useEffect(() => {
    if (!chat?.sellerMarkedSold || chat?.isClosed) return;
    const interval = setInterval(() => { refreshChats(); }, 4000);
    return () => clearInterval(interval);
  }, [chat?.sellerMarkedSold, chat?.isClosed]);

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          {loadingRetry
            ? <ActivityIndicator size="large" color="#6366F1" />
            : <>
                <Text style={styles.notFoundText}>הצ׳אט לא נמצא</Text>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/seller/dashboard')}>
                  <Text style={styles.backLink}>חזור</Text>
                </TouchableOpacity>
              </>
          }
        </View>
      </SafeAreaView>
    );
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(chat!.id, trimmed, chat!.isSeller ? 'seller' : 'buyer');
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function pickAndSendImage() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('הרשאה נדרשת', 'יש לאפשר גישה לגלריה');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploadingImage(true);
    try {
      const { enhancedUri } = await enhanceImage(uri);
      const caption = text.trim();
      await sendMessage(chat!.id, caption, chat!.isSeller ? 'seller' : 'buyer', enhancedUri);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      Alert.alert('שגיאה', 'העלאת התמונה נכשלה, נסה שוב');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleMarkSold() {
    const doMark = () => markSold(chat!.id);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm(`לסמן את "${chat!.itemName}" כנמכר? הקונה יצטרך לאשר.`)) doMark();
      return;
    }
    Alert.alert('סמן כנמכר', `לסמן את "${chat!.itemName}" כנמכר?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'כן, שלח לאישור', onPress: doMark },
    ]);
  }

  async function handleBuyerConfirm() {
    const doConfirm = async () => {
      await buyerConfirmSold(chat!.id);
      router.push(`/rating/${chat!.id}`);
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm(`לאשר שרכשת את "${chat!.itemName}"?`)) await doConfirm();
      return;
    }
    Alert.alert('אישור רכישה', `לאשר שרכשת את "${chat!.itemName}"?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'כן, קניתי!', onPress: doConfirm },
    ]);
  }

  function handleBuyerDecline() {
    const doDecline = () => buyerDeclineSold(chat!.id);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('בטוח שלא רכשת את הפריט?')) doDecline();
      return;
    }
    Alert.alert('דחיית אישור', 'בטוח שלא רכשת את הפריט?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'כן, לא קניתי', style: 'destructive', onPress: doDecline },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/seller/dashboard')} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={() => chat.otherPartyDbId && router.push({ pathname: '/profile/[userId]', params: { userId: chat.otherPartyDbId } })} activeOpacity={0.7}>
            <Text style={[styles.headerName, styles.headerNameLink]}>{chat.otherPartyName}</Text>
          </TouchableOpacity>
          <Text style={styles.headerItem} numberOfLines={1}>{chat.itemName}</Text>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setReportVisible(true)}>
          <Text style={styles.reportBtnText}>⚑</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Image source={{ uri: chat.itemImage }} style={styles.headerThumb} contentFit="cover" />
          {!chat.isClosed && chat.isSeller && !chat.sellerMarkedSold && (
            <TouchableOpacity style={styles.soldBtn} onPress={handleMarkSold} activeOpacity={0.8}>
              <Text style={styles.soldBtnText}>נמכר</Text>
            </TouchableOpacity>
          )}
          {!chat.isClosed && chat.isSeller && chat.sellerMarkedSold && (
            <View style={styles.soldPendingBadge}>
              <Text style={styles.soldPendingText}>ממתין לאישור</Text>
            </View>
          )}
        </View>
      </View>

      {chat.isClosed && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedBannerText}>✅ עסקה הושלמה</Text>
          <TouchableOpacity onPress={() => router.push(`/rating/${chat.id}`)}>
            <Text style={styles.rateLink}>דרג →</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={buildListItems(chat.messages)}
          keyExtractor={item => item.type === 'date' ? item.key : item.msg.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            if (item.type === 'date') return <DateSeparator label={item.label} />;
            if (item.msg.type === 'sold_notification') {
              return (
                <SoldBubble
                  msg={item.msg}
                  isSeller={!!chat.isSeller}
                  isConfirmed={!!chat.isClosed}
                  onConfirm={handleBuyerConfirm}
                  onDecline={handleBuyerDecline}
                />
              );
            }
            return <Bubble msg={item.msg} onImagePress={setPreviewImage} />;
          }}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {!chat.isClosed && (
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.sendBtn} onPress={send} activeOpacity={0.85}>
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="הקלד הודעה..."
              textAlign="right"
              onSubmitEditing={send}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.cameraBtn} onPress={pickAndSendImage} activeOpacity={0.8} disabled={uploadingImage}>
              {uploadingImage
                ? <ActivityIndicator size="small" color="#6366F1" />
                : <Text style={styles.cameraIcon}>📷</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportedUserId={chat.otherPartyDbId}
      />

      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity style={styles.previewOverlay} onPress={() => setPreviewImage(null)} activeOpacity={1}>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.previewImage} contentFit="contain" />
          )}
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(null)}>
            <Text style={styles.previewCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  backText: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  reportBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  reportBtnText: { fontSize: 18, color: '#9CA3AF' },
  headerInfo: { flex: 1, alignItems: 'center', gap: 2 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  headerNameLink: { color: '#6366F1', textDecorationLine: 'underline' },
  headerItem: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  headerThumb: { width: 40, height: 40, borderRadius: 10 },
  soldBtn: {
    backgroundColor: '#22C55E', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  soldBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  soldPendingBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  soldPendingText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  closedBanner: {
    backgroundColor: '#D1FAE5', paddingHorizontal: 20, paddingVertical: 10,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  closedBannerText: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  rateLink: { fontSize: 14, fontWeight: '700', color: '#059669' },
  messages: { padding: 16, gap: 10 },
  dateSepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dateSepText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', paddingHorizontal: 4 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  sellerBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  buyerBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  sellerText: { color: '#fff', textAlign: 'right' },
  buyerText: { color: '#111827', textAlign: 'right' },
  bubbleTime: { fontSize: 10, textAlign: 'right' },
  sellerTime: { color: 'rgba(255,255,255,0.65)' },
  buyerTime: { color: '#9CA3AF' },
  // Sold notification bubble
  soldBubbleWrap: { alignItems: 'center', marginVertical: 6 },
  soldBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '90%',
    gap: 10,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  soldBubbleTitle: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center' },
  soldBubbleQuestion: { fontSize: 14, color: '#374151', textAlign: 'center' },
  soldBubblePending: { fontSize: 13, color: '#D97706', fontWeight: '600', textAlign: 'center' },
  soldBubbleDone: { fontSize: 14, color: '#059669', fontWeight: '700', textAlign: 'center' },
  soldBubbleBtns: { flexDirection: 'row-reverse', gap: 10, width: '100%' },
  soldBubbleYes: {
    flex: 2, backgroundColor: '#6366F1', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  soldBubbleYesText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  soldBubbleNo: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  soldBubbleNoText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  soldBubbleTime: { fontSize: 10, color: '#9CA3AF' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111827', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '800' },
  cameraBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  cameraIcon: { fontSize: 20 },
  // Image bubble
  imageBubble: {
    maxWidth: '78%', borderRadius: 18, overflow: 'hidden', gap: 0,
  },
  imageBubbleSeller: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  imageBubbleBuyer: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  chatImage: { width: 220, height: 220 },
  // Full-screen image preview
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '95%', height: '80%' },
  previewClose: {
    position: 'absolute', top: 50, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewCloseText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18, color: '#6B7280' },
  backLink: { fontSize: 16, color: '#6366F1', fontWeight: '700' },
});
