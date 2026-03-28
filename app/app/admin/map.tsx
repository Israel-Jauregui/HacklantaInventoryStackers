import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors } from '@/constants/theme';
import { AdminPortalShell } from '@/components/admin/AdminPortalShell';
import { useAdminPortal } from '@/context/AdminPortalContext';
import { getPriorityColor } from '@/utils/adminPortal';

export default function AdminMapScreen() {
  const router = useRouter();
  const { reports } = useAdminPortal();

  const initialRegion = {
    latitude: 33.749,
    longitude: -84.388,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <AdminPortalShell
      title="Report Map View"
      subtitle="Monitor open and resolved reports across the city with a district-wide operational view."
      activeSection="map"
    >
      <View style={styles.mapWrap}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          userInterfaceStyle="dark"
        >
          {reports.map((report) => (
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
          <Text style={styles.mapBadgeText}>{reports.length} tracked reports</Text>
        </View>
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
        {reports.slice(0, 5).map((report, index) => (
          <View key={report.id}>
            <TouchableOpacity
              style={styles.quickRow}
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
            {index < 4 ? <View style={styles.divider} /> : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
