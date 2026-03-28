import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

/* ─── Mock data ─── */
interface Scout {
  id: string;
  alias: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
}

const LEADERBOARD: Scout[] = [
  { id: '1', alias: 'AsphaltAvenger',  score: 1340, rank: 1,  isCurrentUser: false },
  { id: '2', alias: 'PotholePatrol',   score: 1185, rank: 2,  isCurrentUser: false },
  { id: '3', alias: 'RoadWarrior',     score: 1020, rank: 3,  isCurrentUser: false },
  { id: '4', alias: 'CraterCrusher',   score: 870,  rank: 4,  isCurrentUser: false },
  { id: '5', alias: 'StreetSentinel',  score: 745,  rank: 5,  isCurrentUser: true },
  { id: '6', alias: 'PavePioneer',     score: 680,  rank: 6,  isCurrentUser: false },
  { id: '7', alias: 'CivicSniper',     score: 590,  rank: 7,  isCurrentUser: false },
  { id: '8', alias: 'TarTitan',        score: 430,  rank: 8,  isCurrentUser: false },
  { id: '9', alias: 'GridGuru',        score: 310,  rank: 9,  isCurrentUser: false },
  { id: '10', alias: 'BumpBuster',     score: 220,  rank: 10, isCurrentUser: false },
];

const currentUser = LEADERBOARD.find((u) => u.isCurrentUser)!;
const podium = LEADERBOARD.slice(0, 3);
const rest = LEADERBOARD.slice(3);

/* ─── Helpers ─── */
function rankBadge(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

/* ─── Podium card ─── */
function PodiumCard({ user, isFirst }: { user: Scout; isFirst: boolean }) {
  return (
    <View
      style={[
        styles.podiumCard,
        isFirst && styles.podiumCardFirst,
      ]}
    >
      {isFirst && (
        <Text style={styles.crownIcon}>👑</Text>
      )}
      <View
        style={[
          styles.podiumAvatar,
          isFirst && styles.podiumAvatarFirst,
        ]}
      >
        <Ionicons name="person" size={isFirst ? 26 : 20} color={isFirst ? Colors.black : Colors.muted} />
      </View>
      <Text style={styles.podiumMedal}>{rankBadge(user.rank)}</Text>
      <Text style={[styles.podiumAlias, isFirst && styles.podiumAliasFirst]} numberOfLines={1}>
        {user.alias}
      </Text>
      <Text style={[styles.podiumScore, isFirst && styles.podiumScoreFirst]}>
        {user.score.toLocaleString()} pts
      </Text>
    </View>
  );
}

/* ─── List row ─── */
function ScoutRow({ user }: { user: Scout }) {
  const isMe = user.isCurrentUser;
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={[styles.rowRank, isMe && styles.rowRankMe]}>#{user.rank}</Text>
      <View style={styles.rowMiddle}>
        <Text style={[styles.rowAlias, isMe && styles.rowAliasMe]} numberOfLines={1}>
          {user.alias}
        </Text>
      </View>
      <Text style={[styles.rowScore, isMe && styles.rowScoreMe]}>
        {user.score.toLocaleString()} pts
      </Text>
    </View>
  );
}

/* ─── Screen ─── */
export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Top City Scouts</Text>
          <Text style={styles.subtitle}>Weekly Leaderboard</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="trophy" size={18} color={Colors.yellow} />
        </View>
      </View>

      {/* Podium */}
      <View style={styles.podiumRow}>
        <PodiumCard user={podium[1]} isFirst={false} />
        <PodiumCard user={podium[0]} isFirst />
        <PodiumCard user={podium[2]} isFirst={false} />
      </View>

      {/* Scoring note */}
      <View style={styles.scoringNote}>
        <Ionicons name="sparkles" size={13} color={Colors.yellow} />
        <Text style={styles.scoringText}>10 pts per report + bonus for high severity</Text>
      </View>

      {/* List */}
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ScoutRow user={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky current-user bar */}
      <View style={styles.stickyBar}>
        <Text style={styles.stickyRank}>#{currentUser.rank}</Text>
        <View style={styles.stickyMiddle}>
          <Text style={styles.stickyAlias}>{currentUser.alias}</Text>
          <Text style={styles.stickyYou}>You</Text>
        </View>
        <Text style={styles.stickyScore}>{currentUser.score.toLocaleString()} pts</Text>
      </View>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,252,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Podium */
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.dark2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  podiumCardFirst: {
    borderColor: 'rgba(255,252,0,0.4)',
    backgroundColor: 'rgba(255,252,0,0.06)',
    paddingVertical: 20,
    marginBottom: 4,
  },
  crownIcon: { fontSize: 22, marginBottom: -2 },
  podiumAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarFirst: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.yellow,
  },
  podiumMedal: { fontSize: 18 },
  podiumAlias: { color: Colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  podiumAliasFirst: { fontSize: 13, color: Colors.yellow },
  podiumScore: { color: Colors.muted, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  podiumScoreFirst: { color: Colors.yellow, fontWeight: '800' },

  /* Scoring note */
  scoringNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255,252,0,0.05)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,252,0,0.1)',
  },
  scoringText: { color: Colors.muted, fontSize: 11, fontWeight: '600' },

  /* List */
  listContent: { paddingHorizontal: 16, paddingBottom: 90, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark2,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowMe: {
    borderColor: 'rgba(255,252,0,0.35)',
    backgroundColor: 'rgba(255,252,0,0.06)',
  },
  rowRank: { color: Colors.muted, fontSize: 14, fontWeight: '800', width: 34, fontVariant: ['tabular-nums'] },
  rowRankMe: { color: Colors.yellow },
  rowMiddle: { flex: 1, marginHorizontal: 10 },
  rowAlias: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  rowAliasMe: { color: Colors.yellow },
  rowScore: { color: Colors.muted, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  rowScoreMe: { color: Colors.yellow, fontWeight: '800' },

  /* Sticky bar */
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,252,0,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  stickyRank: { color: Colors.yellow, fontSize: 16, fontWeight: '800', width: 34, fontVariant: ['tabular-nums'] },
  stickyMiddle: { flex: 1, marginHorizontal: 10 },
  stickyAlias: { color: Colors.yellow, fontSize: 15, fontWeight: '700' },
  stickyYou: { color: Colors.muted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  stickyScore: { color: Colors.yellow, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
