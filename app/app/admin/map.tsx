import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors } from '@/constants/theme';
import { MapActionRow } from '@/components/admin/MapActionRow';
import { AdminPortalShell } from '@/components/admin/AdminPortalShell';
import { useAdminPortal } from '@/context/AdminPortalContext';
import { getPriorityColor } from '@/utils/adminPortal';

export default function AdminMapScreen() {
  const router = useRouter();
  const { reports } = useAdminPortal();
  const mapRef = useRef<MapView | null>(null);

  const sortedReports = useMemo(() => {
    const order = { P1: 0, P2: 1, P3: 2 } as const;
    return [...reports].sort(
      (a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
    );
  }, [reports]);

  const initialRegion = {
    latitude: 33.749,
    longitude: -84.388,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  const coordinates = useMemo(
    () =>
      sortedReports
        .map((report) => ({
          latitude: Number(report.location.lat),
          longitude: Number(report.location.lng),
        }))
        .filter(
          (coord) =>
            Number.isFinite(coord.latitude) &&
            Number.isFinite(coord.longitude)
        ),
    [sortedReports]
  );

  useEffect(() => {
    if (mapRef.current && coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  }, [coordinates]);

  return (
    <AdminPortalShell
      title="Report Map View"
      subtitle="Monitor open and resolved reports across the city with a district-wide operational view."
      activeSection="map"
    >
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={
            coordinates[0]
              ? {
                  ...initialRegion,
                  latitude: coordinates[0].latitude,
                  longitude: coordinates[0].longitude,
                }
              : initialRegion
          }
          userInterfaceStyle="dark"
        >
          {sortedReports.map((report) => (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.location.lat,
                longitude: report.location.lng,
              }}
              pinColor={getPriorityColor(report.priority)}
              title={report.id}
              description={report.location.address}
              onCalloutPress={() =>
                router.push({
                  pathname: '/admin/reports/[id]',
                  params: { id: report.id },
                })
              }
            />
          ))}
        </MapView>

        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>{sortedReports.length} tracked reports</Text>
        </View>

        {sortedReports.length === 0 ? (
          <View style={styles.mapEmpty}>
            <Ionicons name="map-outline" size={20} color={Colors.muted} />
            <Text style={styles.mapEmptyText}>No reports to plot yet</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.sectionTitle}>Priority Legend</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.red }]} />
            <Text style={styles.legendText}>P1 critical</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.amber }]} />
            <Text style={styles.legendText}>P2 scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
            <Text style={styles.legendText}>P3 routine</Text>
          </View>
        </View>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        {sortedReports.map((report, index) => (
          <View key={report.id}>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickMainRow}
                activeOpacity={0.84}
                onPress={() =>
                  router.push({
                    pathname: '/admin/reports/[id]',
                    params: { id: report.id },
                  })
                }
              >
                <View style={[styles.quickDot, { backgroundColor: getPriorityColor(report.priority) }]} />
                <View style={styles.quickBody}>
                  <Text style={styles.quickTitle}>{report.location.address}</Text>
                  <Text style={styles.quickMeta}>
                    {report.priority} · {report.district}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
              </TouchableOpacity>
              <View style={styles.quickActions}>
                <MapActionRow
                  address={report.location.address}
                  latitude={report.location.lat}
                  longitude={report.location.lng}
                />
              </View>
            </View>
            {index < sortedReports.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </AdminPortalShell>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(10,10,10,0.7)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  mapEmpty: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  mapEmptyText: {
    color: Colors.muted,
    fontSize: 12,
  },
  legendCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  legendRow: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: Colors.muted,
    fontSize: 13,
  },
  listCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickRow: {
    gap: 10,
    paddingVertical: 12,
  },
  quickMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  quickBody: {
    flex: 1,
  },
  quickTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  quickMeta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    marginLeft: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
