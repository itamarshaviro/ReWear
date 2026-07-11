import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

const REASONS_USER = ['נוכל / הונאה', 'התנהגות פוגענית', 'ספאם', 'אחר'];
const REASONS_ITEM = ['פריט מזויף', 'תמונה לא מייצגת', 'מחיר מטעה', 'תוכן לא הולם', 'אחר'];

type Props = {
  visible: boolean;
  onClose: () => void;
  reportedUserId?: string;
  reportedItemId?: string;
};

export function ReportModal({ visible, onClose, reportedUserId, reportedItemId }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails]   = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const reasons = reportedUserId ? REASONS_USER : REASONS_ITEM;

  async function submit() {
    if (!selected || !user?.dbId) return;
    setLoading(true);
    if (isSupabaseConfigured()) {
      await (supabase.from('reports') as any).insert({
        reporter_id: user.dbId,
        reported_user_id: reportedUserId ?? null,
        reported_item_id: reportedItemId ?? null,
        reason: selected,
        details: details.trim() || null,
      });
    }
    setLoading(false);
    setSent(true);
  }

  function handleClose() {
    setSelected(null);
    setDetails('');
    setSent(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {sent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentEmoji}>✅</Text>
              <Text style={styles.sentTitle}>תודה על הדיווח</Text>
              <Text style={styles.sentSub}>נבדוק את הדיווח בהקדם</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>סגור</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{reportedUserId ? 'דיווח על משתמש' : 'דיווח על פריט'}</Text>
              <Text style={styles.sub}>מה הסיבה לדיווח?</Text>

              <View style={styles.reasons}>
                {reasons.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reason, selected === r && styles.reasonSelected]}
                    onPress={() => setSelected(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.reasonText, selected === r && styles.reasonTextSelected]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="פרטים נוספים (אופציונלי)"
                placeholderTextColor="#9CA3AF"
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
                textAlign="right"
              />

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, (!selected || loading) && styles.submitBtnDisabled]}
                  onPress={submit}
                  disabled={!selected || loading}
                >
                  <Text style={styles.submitText}>{loading ? 'שולח...' : 'שלח דיווח'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right' },
  sub: { fontSize: 13, color: '#6B7280', textAlign: 'right', marginTop: -8 },

  reasons: { gap: 8 },
  reason: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  reasonSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  reasonText: { fontSize: 14, color: '#374151', textAlign: 'right', fontWeight: '600' },
  reasonTextSelected: { color: '#6366F1' },

  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#111827',
    minHeight: 72, textAlignVertical: 'top',
  },

  actions: { flexDirection: 'row-reverse', gap: 10 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  submitBtn: {
    flex: 2, backgroundColor: '#EF4444', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#FCA5A5' },
  submitText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  sentBox: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  sentEmoji: { fontSize: 48 },
  sentTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sentSub: { fontSize: 14, color: '#6B7280' },
  closeBtn: {
    marginTop: 8, backgroundColor: '#6366F1', borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 12,
  },
  closeBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
