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
  const { reports, user } = useAdminPortal();
  const isEmployee = user?.role === 'employee';
  const stats = getDashboardStats(reports);
  const teamReports = user?.team
    ? reports.filter((report) => report.assignedTeam === user.team)
    : reports;
  const employeeStats = {
    myQueue: teamReports.filter((report) => report.status !== 'resolved').length,
    newIntake: reports.filter((report) => report.status === 'new').length,
    inProgress: reports.filter((report) => report.status === 'in_progress').length,
    resolved: teamReports.filter((report) => report.status === 'resolved').length,
  };
  const highestPriorityReports = [...reports]
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, 3);
  const dispatchReports = [...reports]
    .filter((report) => report.status !== 'resolved')
    .sort((a, b) => {
      const teamBoost =
        user?.team && a.assignedTeam === user.team ? -1 : user?.team && b.assignedTeam === user.team ? 1 : 0;
      if (teamBoost !== 0) return teamBoost;
      return b.severityScore - a.severityScore;
    })
    .slice(0, 4);
  const recentUpdates = [...reports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentThreadMessages = reports
    .flatMap((report) =>
      report.notes.map((note) => ({
        reportId: report.id,
        address: report.location.address,
        note,
      }))
    )
    .sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime())
    .slice(0, 4);

  return (
    <AdminPortalShell
      title={isEmployee ? 'Field Operations Dashboard' : 'Operations Dashboard'}
      subtitle={
        isEmployee
          ? 'Receive reports, route assignments, update crews, and keep the internal thread current.'
          : 'Track intake volume, monitor priority assignments, and jump directly into active city reports.'
      }
      activeSection="dashboard"
    >
      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{isEmployee ? employeeStats.myQueue : stats.open}</Text>
          <Text style={styles.metricLabel}>{isEmployee ? 'My Crew Queue' : 'Active Cases'}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.red }]}>
            {isEmployee ? employeeStats.newIntake : stats.p1}
          </Text>
          <Text style={styles.metricLabel}>{isEmployee ? 'New Intake' : 'Priority 1'}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.blue }]}>
            {isEmployee ? employeeStats.inProgress : stats.triageReady}
          </Text>
          <Text style={styles.metricLabel}>{isEmployee ? 'In Progress' : 'Awaiting Triage'}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.green }]}>
            {isEmployee ? employeeStats.resolved : stats.resolved}
          </Text>
          <Text style={styles.metricLabel}>{isEmployee ? 'Crew Resolved' : 'Resolved'}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{isEmployee ? 'Dispatch Board' : 'Priority Queue'}</Text>
          <TouchableOpacity onPress={() => router.push('/admin/reports')}>
            <Text style={styles.panelLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {(isEmployee ? dispatchReports : highestPriorityReports).map((report, index) => (
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
                  <Text style={styles.queueMeta}>
                    {isEmployee
                      ? `${report.assignedTeam} · ${getStatusLabel(report.status)}`
                      : `${report.priority} · ${report.assignedTeam}`}
                  </Text>
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
            {index < (isEmployee ? dispatchReports.length : highestPriorityReports.length) - 1 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{isEmployee ? 'Internal Thread Watch' : 'Recent Activity'}</Text>
          <TouchableOpacity onPress={() => router.push(isEmployee ? '/admin/reports' : '/admin/map')}>
            <Text style={styles.panelLink}>{isEmployee ? 'Open threads' : 'Map view'}</Text>
          </TouchableOpacity>
        </View>

        {isEmployee
          ? recentThreadMessages.map((entry, index) => (
              <View key={`${entry.reportId}-${entry.note.id}`}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: 'rgba(255,252,0,0.10)' }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.yellow} />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityTitle}>{entry.address}</Text>
                    <Text style={styles.activitySubtitle}>
                      {entry.note.author} · {formatTimestamp(entry.note.createdAt)}
                    </Text>
                    <Text style={styles.threadPreview} numberOfLines={2}>
                      {entry.note.message}
                    </Text>
                  </View>
                </View>
                {index < recentThreadMessages.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          : recentUpdates.map((report, index) => (
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
        <Text style={styles.summaryEyebrow}>{isEmployee ? 'Crew Summary' : 'Command Summary'}</Text>
        <Text style={styles.summaryText}>
          {isEmployee
            ? `Focus on new intake, keep dispatch ownership accurate, and use the report thread to coordinate handoffs${user?.team ? ` for ${user.team}` : ''}.`
            : 'Highest pressure remains in the downtown and midtown corridors. Priority 1 reports should stay in the assigned or in-progress states until verified by field crews.'}
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
  threadPreview: {
    color: Colors.white,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
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
