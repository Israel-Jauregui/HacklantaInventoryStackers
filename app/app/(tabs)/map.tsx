import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, severityColor, severityLabel } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Report } from '@/data/mockReports';
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const FILTERS = ['All', 'Critical', 'Open', 'Fixed'] as const;
type Filter = (typeof FILTERS)[number];

const MOCK_DISTANCES = ['0.2 mi', '0.4 mi', '0.7 mi', '1.1 mi', '1.5 mi', '2.0 mi'];

export default function MapScreen() {
  const { reports, refreshReports, isLoading, isOnline } = useApp();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [userLat, setUserLat] = useState(33.749);
  const [userLng, setUserLng] = useState(-84.388);
  const [mapReady, setMapReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      }
      setMapReady(true);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshReports();
    setRefreshing(false);
  }, [refreshReports]);

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
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Atlanta, GA</Text>
            {!isOnline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline" size={10} color="#FF9500" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Real Map ── */}
      <View style={styles.mapContainer}>
        {!mapReady ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={Colors.yellow} />
          </View>
        ) : (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFillObject}
            region={{
              latitude: userLat,
              longitude: userLng,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}
            userInterfaceStyle="dark"
            showsUserLocation
            showsMyLocationButton={false}
          >
            {reports.map((r) => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.location.lat, longitude: r.location.lng }}
                pinColor={severityColor(r.severityScore)}
                onPress={() => handleReport(r)}
              />
            ))}
          </MapView>
        )}
        {/* Map label */}
        <View style={styles.mapLabel}>
          <Text style={styles.mapLabelText}>{reports.length} reports nearby</Text>
        </View>
      </View>

      {/* ── Filter chips ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.yellow}
            colors={[Colors.yellow]}
          />
        }
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
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,149,0,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offlineText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '600',
  },

  /* ── Map ── */
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 18,
    height: 210,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: Colors.dark2,
  },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 13,
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
