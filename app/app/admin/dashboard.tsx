import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { MapActionRow } from '@/components/admin/MapActionRow';
import { AdminPortalShell } from '@/components/admin/AdminPortalShell';
import { useAdminPortal } from '@/context/AdminPortalContext';
import {
  formatTimestamp,
  getDashboardStats,
  getPriorityColor,
  getStatusColor,
  getStatusLabel,
} from '@/utils/adminPortal';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { reports } = useAdminPortal();
  const stats = getDashboardStats(reports);
  const highestPriorityReports = [...reports]
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, 3);
  const recentUpdates = [...reports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <AdminPortalShell
      title="Operations Dashboard"
      subtitle="Track intake volume, monitor priority assignments, and jump directly into active city reports."
      activeSection="dashboard"
    >
      <View style={styles.metricGrid}>
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/admin/reports', params: { filter: 'open' } })
          }
        >
          <Text style={styles.metricValue}>{stats.open}</Text>
          <Text style={styles.metricLabel}>Active Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/admin/reports', params: { filter: 'p1' } })
          }
        >
          <Text style={[styles.metricValue, { color: Colors.red }]}>{stats.p1}</Text>
          <Text style={styles.metricLabel}>Priority 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/admin/reports', params: { filter: 'triage' } })
          }
        >
          <Text style={[styles.metricValue, { color: Colors.blue }]}>{stats.triageReady}</Text>
          <Text style={styles.metricLabel}>Awaiting Triage</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/admin/reports', params: { filter: 'resolved' } })
          }
        >
          <Text style={[styles.metricValue, { color: Colors.green }]}>{stats.resolved}</Text>
          <Text style={styles.metricLabel}>Resolved</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Priority Queue</Text>
          <TouchableOpacity onPress={() => router.push('/admin/reports')}>
            <Text style={styles.panelLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {highestPriorityReports.map((report, index) => (
          <View key={report.id}>
            <View style={styles.queueRow}>
              <TouchableOpacity
                style={styles.queueMainRow}
                activeOpacity={0.84}
                onPress={() =>
                  router.push({
                    pathname: '/admin/reports/[id]',
                    params: { id: report.id },
                  })
                }
              >
                <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(report.priority) }]} />
                <View style={styles.queueBody}>
                  <Text style={styles.queueTitle}>{report.location.address}</Text>
                  <Text style={styles.queueMeta}>{`${report.priority} · ${report.assignedTeam}`}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
              </TouchableOpacity>
              <View style={styles.queueActions}>
                <MapActionRow
                  address={report.location.address}
                  latitude={report.location.lat}
                  longitude={report.location.lng}
                />
              </View>
            </View>
            {index < highestPriorityReports.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/admin/map')}>
            <Text style={styles.panelLink}>Map view</Text>
          </TouchableOpacity>
        </View>

        {recentUpdates.map((report, index) => (
          <View key={report.id}>
            <View style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: `${getStatusColor(report.status)}18` }]}>
                <Ionicons name="document-text-outline" size={14} color={getStatusColor(report.status)} />
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityTitle}>{report.title}</Text>
                <Text style={styles.activitySubtitle}>
                  {getStatusLabel(report.status)} · {formatTimestamp(report.updatedAt)}
                </Text>
              </View>
            </View>
            {index < recentUpdates.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>Command Summary</Text>
        <Text style={styles.summaryText}>
          Highest pressure remains in the downtown and midtown corridors. Priority 1 reports
          should stay in the assigned or in-progress states until verified by field crews.
        </Text>
      </View>
    </AdminPortalShell>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48.3%',
    backgroundColor: Colors.dark2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricValue: {
    color: Colors.yellow,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'SpaceMono',
  },
  metricLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  panel: {
    backgroundColor: Colors.dark2,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  panelLink: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  queueRow: {
    gap: 10,
    paddingVertical: 12,
  },
  queueMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBar: {
    width: 6,
    height: 42,
    borderRadius: 999,
  },
  queueBody: {
    flex: 1,
  },
  queueTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  queueMeta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  queueActions: {
    marginLeft: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  activitySubtitle: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,252,0,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,252,0,0.12)',
  },
  summaryEyebrow: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryText: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
