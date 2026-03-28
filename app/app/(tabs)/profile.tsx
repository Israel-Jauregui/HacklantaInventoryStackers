import {
  View,
  Text,
  StyleSheet,
  Switch,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, severityColor, severityLabel } from '@/constants/theme';
import type { Report } from '@/data/mockReports';

/* emoji lookup for avatar presets */
const AVATAR_EMOJIS: Record<string, string> = {
  '1': '🦸', '2': '🛣️', '3': '🔧', '4': '🏗️', '5': '🦺', '6': '🚧',
  '7': '🎯', '8': '⚡', '9': '🌟', '10': '🏆', '11': '🦅', '12': '🔥',
};

export default function ProfileScreen() {
  const { deviceUuid, displayName, avatarUri, isAdmin, setIsAdmin, reports } = useApp();
  const router = useRouter();

  const myReports = reports.filter((r) => r.userId === deviceUuid);
  const openCount = myReports.filter((r) => r.status === 'open').length;
  const fixedCount = myReports.filter((r) => r.status === 'fixed').length;
  const shortId = deviceUuid ? deviceUuid.slice(0, 8).toUpperCase() : '--------';

  const handleReportPress = (report: Report) => {
    router.push({ pathname: '/details', params: { id: report.id } });
  };

  const renderReport = ({ item }: { item: Report }) => {
    const isOpen = item.status === 'open';
    return (
      <TouchableOpacity
        style={styles.reportCard}
        activeOpacity={0.7}
        onPress={() => handleReportPress(item)}
      >
        {/* Left: severity dot */}
        <View style={[styles.sevDot, { backgroundColor: severityColor(item.severityScore) }]} />

        {/* Center: info */}
        <View style={styles.reportInfo}>
          <Text style={styles.reportAddr}>{item.location.address}</Text>
          <Text style={styles.reportMeta}>
            {item.id} · {severityLabel(item.severityScore)} ({item.severityScore.toFixed(1)})
          </Text>
        </View>

        {/* Right: status badge */}
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isOpen ? 'rgba(255,252,0,0.12)' : 'rgba(52,199,89,0.12)',
              borderColor: isOpen ? 'rgba(255,252,0,0.25)' : 'rgba(52,199,89,0.25)',
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: isOpen ? Colors.yellow : Colors.green },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={14} color={Colors.muted} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>StreetSense</Text>
        <TouchableOpacity
          style={styles.avatar}
          activeOpacity={0.7}
          onPress={() => router.push('/edit-profile')}
        >
          {avatarUri && AVATAR_EMOJIS[avatarUri] ? (
            <Text style={styles.avatarEmoji}>{AVATAR_EMOJIS[avatarUri]}</Text>
          ) : (
            <Ionicons name="person" size={18} color={Colors.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Name + ID Card ── */}
      <View style={styles.idCard}>
        <TouchableOpacity
          style={styles.idIconWrap}
          activeOpacity={0.7}
          onPress={() => router.push('/edit-profile')}
        >
          {avatarUri && AVATAR_EMOJIS[avatarUri] ? (
            <Text style={{ fontSize: 22 }}>{AVATAR_EMOJIS[avatarUri]}</Text>
          ) : (
            <Ionicons name="finger-print" size={22} color={Colors.yellow} />
          )}
        </TouchableOpacity>
        <View style={styles.idTextWrap}>
          <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.idValue}>{shortId}</Text>
        </View>
        <TouchableOpacity
          hitSlop={12}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="create-outline" size={18} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{myReports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.yellow }]}>{openCount}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.green }]}>{fixedCount}</Text>
          <Text style={styles.statLabel}>Fixed</Text>
        </View>
      </View>

      {/* ── My Reports List ── */}
      <Text style={styles.sectionTitle}>MY PAST REPORTS</Text>
      <FlatList
        data={myReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No reports yet. Go snap a pothole!</Text>
          </View>
        }
      />

      {/* ── Admin Toggle ── */}
      <View style={styles.adminSection}>
        <View style={styles.adminRow}>
          <View style={styles.adminLeft}>
            <View style={styles.adminIcon}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.yellow} />
            </View>
            <View>
              <Text style={styles.adminTitle}>City Official Mode</Text>
              <Text style={styles.adminSub}>
                {isAdmin ? 'You can mark reports as fixed' : 'Enable to manage reports'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAdmin}
            onValueChange={setIsAdmin}
            trackColor={{ false: Colors.dark4, true: Colors.yellow }}
            thumbColor={Colors.white}
            ios_backgroundColor={Colors.dark4}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.yellow,
    letterSpacing: 0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark3,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 18 },

  /* ── ID Card ── */
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark2,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  idIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,252,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idTextWrap: {
    flex: 1,
  },
  displayName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  idLabel: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  idValue: {
    color: Colors.yellow,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statNumber: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
  statLabel: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  /* ── Section Title ── */
  sectionTitle: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  /* ── Report Cards ── */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sevDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportAddr: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  reportMeta: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
  },

  /* ── Admin Toggle ── */
  adminSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,252,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  adminSub: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
