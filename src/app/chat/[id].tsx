import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/app-context';
import type { ChatMessage } from '@/data/mock';

function Bubble({ msg }: { msg: ChatMessage }) {
  const isSeller = msg.from === 'seller';
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, sendMessage } = useApp();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const chat = chats.find(c => c.id === id);

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>הצ׳אט לא נמצא</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>חזור</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(chat!.id, trimmed, 'seller');
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{chat.otherPartyName}</Text>
          <Text style={styles.headerItem} numberOfLines={1}>{chat.itemName}</Text>
        </View>
        <Image source={{ uri: chat.itemImage }} style={styles.headerThumb} contentFit="cover" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => <Bubble msg={item} />}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

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
            multiline
            onSubmitEditing={send}
            returnKeyType="send"
          />
        </View>
      </KeyboardAvoidingView>
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
  headerInfo: { flex: 1, alignItems: 'center', gap: 2 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  headerItem: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  headerThumb: { width: 40, height: 40, borderRadius: 10 },
  messages: { padding: 16, gap: 10 },
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
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18, color: '#6B7280' },
  backLink: { fontSize: 16, color: '#6366F1', fontWeight: '700' },
});
