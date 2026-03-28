import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors } from '@/constants/theme';

export default function LocationScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('Fetching address…');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const fetchLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setDenied(true);
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc);

    try {
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        const street = [geo.streetNumber, geo.street].filter(Boolean).join(' ') || 'Unknown street';
        const city = [geo.city, geo.region, geo.postalCode].filter(Boolean).join(', ');
        setAddress(street);
        setArea(city || 'Unknown area');
      }
    } catch {
      setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      setArea('Coordinates');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleNext = () => {
    router.push({
      pathname: '/report-details',
      params: { imageUri, address, area },
    });
  };

  const lat = location?.coords.latitude ?? 33.749;
  const lng = location?.coords.longitude ?? -84.388;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Step bar */}
      <View style={styles.stepBar}>
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepActive]} />
        <View style={styles.stepSeg} />
        <View style={styles.stepSeg} />
      </View>

      {/* ── Map ── */}
      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.yellow} />
            <Text style={styles.loadingText}>Getting your location…</Text>
          </View>
        ) : denied ? (
          <View style={styles.loadingWrap}>
            <Ionicons name="location-outline" size={40} color={Colors.muted} />
            <Text style={styles.loadingText}>Location permission denied</Text>
          </View>
        ) : (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFillObject}
            region={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            userInterfaceStyle="dark"
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor={Colors.yellow}
            />
          </MapView>
        )}
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Confirm location</Text>
          <TouchableOpacity onPress={fetchLocation} disabled={loading}>
            <View style={styles.refreshRow}>
              <Ionicons name="refresh" size={16} color={loading ? Colors.muted : Colors.yellow} />
              <Text style={[styles.adjustText, !loading && { color: Colors.yellow }]}>Refresh GPS</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Address card */}
        <View style={styles.addrCard}>
          <View style={styles.addrIcon}>
            <Ionicons name="location" size={18} color={Colors.red} />
          </View>
          <View style={styles.addrInfo}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.yellow} />
            ) : (
              <>
                <Text style={styles.addrMain}>{address}</Text>
                <Text style={styles.addrSub}>{area}</Text>
              </>
            )}
          </View>
        </View>

        {/* GPS indicator */}
        <View style={[styles.optionCard, styles.optionActive]}>
          <Ionicons name="navigate" size={20} color={Colors.yellow} />
          <Text style={[styles.optionLabel, styles.optionLabelActive]}>Using GPS location</Text>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.5 }]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.ctaBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  /* Step bar */
  stepBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  stepSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDone: {
    backgroundColor: Colors.yellow,
  },
  stepActive: {
    backgroundColor: Colors.yellow,
    opacity: 0.6,
  },

  /* Map */
  mapWrap: {
    height: 260,
    backgroundColor: Colors.dark2,
    overflow: 'hidden',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  adjustText: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '500',
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  /* Address card */
  addrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark3,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  addrIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,59,48,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrInfo: {
    flex: 1,
  },
  addrMain: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  addrSub: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 3,
  },

  /* GPS indicator */
  optionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark3,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionActive: {
    backgroundColor: 'rgba(255,252,0,0.08)',
    borderColor: 'rgba(255,252,0,0.25)',
  },
  optionLabel: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: Colors.yellow,
  },

  /* CTA */
  ctaWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  ctaBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
});
