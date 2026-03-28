import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { MapActionRow } from '@/components/admin/MapActionRow';
import { AdminPortalShell } from '@/components/admin/AdminPortalShell';
import { useAdminPortal } from '@/context/AdminPortalContext';
import { getPriorityColor, getStatusColor, getStatusLabel } from '@/utils/adminPortal';

const FILTERS = ['All', 'P1', 'Open', 'Resolved', 'Triage'] as const;

type Filter = (typeof FILTERS)[number];

export default function AdminReportsScreen() {
  const router = useRouter();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const { reports } = useAdminPortal();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  useEffect(() => {
    if (!filterParam) return;
    const normalized = filterParam.toString().toLowerCase();
    const map: Record<string, Filter> = {
      p1: 'P1',
      open: 'Open',
      resolved: 'Resolved',
      triage: 'Triage',
      all: 'All',
    };
    const next = map[normalized];
    if (next) setActiveFilter(next);
  }, [filterParam]);

  const filteredReports = reports.filter((report) => {
    const matchesQuery =
      !query ||
      report.location.address.toLowerCase().includes(query.toLowerCase()) ||
      report.id.toLowerCase().includes(query.toLowerCase()) ||
      report.district.toLowerCase().includes(query.toLowerCase());

    if (!matchesQuery) return false;
    if (activeFilter === 'P1') return report.priority === 'P1';
    if (activeFilter === 'Open') return report.status !== 'resolved';
    if (activeFilter === 'Resolved') return report.status === 'resolved';
    if (activeFilter === 'Triage') return report.status === 'new';
    return true;
  });

  return (
    <AdminPortalShell
      title="Report Queue"
      subtitle="Review incoming reports, inspect ownership, and open case details for action."
      activeSection="reports"
    >
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholder="Search by address, district, or report ID"
          placeholderTextColor={Colors.muted}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.84}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.listWrap}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{filteredReports.length} reports</Text>
          <Text style={styles.listHint}>Official oversight queue</Text>
        </View>

        {filteredReports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <TouchableOpacity
              style={styles.cardPressArea}
              activeOpacity={0.84}
              onPress={() =>
                router.push({
                  pathname: '/admin/reports/[id]',
                  params: { id: report.id },
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{report.location.address}</Text>
                  <Text style={styles.cardSubtitle}>
                    {report.id} · {report.district}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
              </View>

              <View style={styles.cardMetaRow}>
                <View style={[styles.pill, { backgroundColor: `${getPriorityColor(report.priority)}16` }]}>
                  <Text style={[styles.pillText, { color: getPriorityColor(report.priority) }]}>
                    {report.priority}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: `${getStatusColor(report.status)}16` }]}>
                  <Text style={[styles.pillText, { color: getStatusColor(report.status) }]}>
                    {getStatusLabel(report.status)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <MapActionRow
              address={report.location.address}
              latitude={report.location.lat}
              longitude={report.location.lng}
            />

            <View style={styles.cardBottom}>
              <Text style={styles.cardMetaText}>Assigned to {report.assignedTeam}</Text>
              <Text style={styles.cardMetaText}>{report.notes.length} thread messages</Text>
            </View>
          </View>
        ))}

        {!filteredReports.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reports found</Text>
            <Text style={styles.emptyText}>Try a different filter or search term.</Text>
          </View>
        ) : null}
      </View>
    </AdminPortalShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dark2,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    paddingVertical: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.dark2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,252,0,0.10)',
    borderColor: 'rgba(255,252,0,0.22)',
  },
  filterText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: Colors.yellow,
  },
  listWrap: {
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  listHint: {
    color: Colors.muted,
    fontSize: 12,
  },
  reportCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  cardPressArea: {
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  cardSubtitle: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardMetaText: {
    color: Colors.muted,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
});
