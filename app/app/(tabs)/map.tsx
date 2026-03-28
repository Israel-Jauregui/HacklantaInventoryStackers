import { View, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, severityColor, severityLabel } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Report } from '@/data/mockReports';
import { useState } from 'react';

const FILTERS = ['All', 'Critical', 'Open', 'Fixed'] as const;
type Filter = (typeof FILTERS)[number];

const MOCK_DISTANCES = ['0.2 mi', '0.4 mi', '0.7 mi', '1.1 mi', '1.5 mi', '2.0 mi'];

export default function MapScreen() {
  const { reports } = useApp();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const filtered = reports.filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return r.severityScore >= 7.5;
    if (activeFilter === 'Open') return r.status === 'open';
    if (activeFilter === 'Fixed') return r.status === 'fixed';
    return true;
  });

  const handleReport = (report: Report) => {
    router.push({ pathname: '/details', params: { id: report.id } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>StreetSense</Text>
          <Text style={styles.subtitle}>Atlanta, GA</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Map Placeholder ── */}
      <View style={styles.mapContainer}>
        {/* Fake dark-themed map with roads and pins */}
        <View style={styles.mapBg}>
          {/* Horizontal roads */}
          <View style={[styles.road, styles.roadH, { top: '30%' }]} />
          <View style={[styles.road, styles.roadH, { top: '55%' }]} />
          <View style={[styles.road, styles.roadH, { top: '80%' }]} />
          {/* Vertical roads */}
          <View style={[styles.road, styles.roadV, { left: '25%' }]} />
          <View style={[styles.road, styles.roadV, { left: '50%' }]} />
          <View style={[styles.road, styles.roadV, { left: '75%' }]} />

          {/* Map pins */}
          {reports.slice(0, 5).map((r, i) => {
            const positions = [
              { top: '24%', left: '22%' },
              { top: '48%', left: '47%' },
              { top: '72%', left: '70%' },
              { top: '35%', left: '68%' },
              { top: '65%', left: '28%' },
            ];
            const pos = positions[i];
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.mapPin, pos as any]}
                onPress={() => handleReport(r)}
              >
                <View style={[styles.pinDot, { backgroundColor: severityColor(r.severityScore) }]}>
                  {r.status === 'fixed' && (
                    <Ionicons name="checkmark" size={8} color={Colors.white} />
                  )}
                </View>
                <View style={styles.pinShadow} />
              </TouchableOpacity>
            );
          })}

          {/* Current location pulse */}
          <View style={styles.currentLoc}>
            <View style={styles.currentLocRing} />
            <View style={styles.currentLocDot} />
          </View>

          {/* Map label */}
          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>{reports.length} reports nearby</Text>
          </View>
        </View>
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Nearby list ── */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>NEARBY</Text>
        <Text style={styles.countBadge}>{filtered.length}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const isOpen = item.status === 'open';
          return (
            <TouchableOpacity
              style={styles.reportCard}
              activeOpacity={0.7}
              onPress={() => handleReport(item)}
            >
              {/* Severity indicator bar */}
              <View style={[styles.sevBar, { backgroundColor: severityColor(item.severityScore) }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardAddr}>{item.location.address}</Text>
                    <Text style={styles.cardMeta}>
                      {item.id} · {MOCK_DISTANCES[index % MOCK_DISTANCES.length]}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isOpen ? 'rgba(255,252,0,0.1)' : 'rgba(52,199,89,0.1)',
                        borderColor: isOpen ? 'rgba(255,252,0,0.25)' : 'rgba(52,199,89,0.25)',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: isOpen ? Colors.yellow : Colors.green }]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  {/* Severity score chip */}
                  <View style={[styles.sevChip, { backgroundColor: `${severityColor(item.severityScore)}18` }]}>
                    <Text style={[styles.sevChipText, { color: severityColor(item.severityScore) }]}>
                      {severityLabel(item.severityScore)} · {item.severityScore.toFixed(1)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No reports match this filter.</Text>
          </View>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="add" size={28} color={Colors.black} />
      </TouchableOpacity>
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
    paddingTop: 4,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.yellow,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  /* ── Map ── */
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  mapBg: {
    height: 210,
    backgroundColor: '#141E14',
    position: 'relative',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#252525',
  },
  roadH: {
    left: 0,
    right: 0,
    height: 8,
  },
  roadV: {
    top: 0,
    bottom: 0,
    width: 8,
  },

  /* Pins */
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginTop: 1,
  },

  /* Current location */
  currentLoc: {
    position: 'absolute',
    top: '48%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  currentLocRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,122,255,0.15)',
    position: 'absolute',
  },
  currentLocDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.blue,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  mapLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapLabelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },

  /* ── Filters ── */
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.dark3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,252,0,0.12)',
    borderColor: 'rgba(255,252,0,0.3)',
  },
  filterText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.yellow,
  },

  /* ── List header ── */
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: Colors.dark3,
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },

  /* ── Report cards ── */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark2,
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sevBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  cardAddr: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cardMeta: {
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
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sevChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sevChipText: {
    fontSize: 10,
    fontWeight: '700',
  },

  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
