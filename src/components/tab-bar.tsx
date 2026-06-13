import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, router } from 'expo-router';
import { useApp } from '@/context/app-context';

type Tab = {
  path: string;
  label: string;
  icon: string;
  badge?: number;
};

export function TabBar() {
  const pathname = usePathname();
  const { requests, chats } = useApp();

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const totalBadge = pendingCount + chats.length;

  const tabs: Tab[] = [
    { path: '/',         label: 'גלה',     icon: '🏠' },
    { path: '/messages', label: 'הודעות',  icon: '💬', badge: totalBadge > 0 ? totalBadge : undefined },
  ];

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <View style={styles.bar}>
      {tabs.map(tab => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.push(tab.path as never)}
            activeOpacity={0.75}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{tab.icon}</Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 9 ? '9+' : String(tab.badge)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
            {active && <View style={styles.activeBar} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
    position: 'relative',
  },
  iconWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  label: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  labelActive: { color: '#6366F1', fontWeight: '700' },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6366F1',
  },
});
