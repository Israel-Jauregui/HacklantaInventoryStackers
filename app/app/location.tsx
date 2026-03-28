import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

const MOCK_ADDRESS = '123 Peachtree St NW';
const MOCK_AREA = 'Midtown Atlanta, GA 30309';

export default function LocationScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();

  const handleNext = () => {
    router.push({
      pathname: '/report-details',
      params: { imageUri, address: MOCK_ADDRESS, area: MOCK_AREA },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Step bar */}
      <View style={styles.stepBar}>
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepActive]} />
        <View style={styles.stepSeg} />
        <View style={styles.stepSeg} />
      </View>

      {/* ── Map placeholder ── */}
      <View style={styles.mapWrap}>
        <View style={styles.mapBg}>
          {/* Grid roads */}
          <View style={[styles.road, styles.roadH, { top: '25%' }]} />
          <View style={[styles.road, styles.roadH, { top: '50%' }]} />
          <View style={[styles.road, styles.roadH, { top: '75%' }]} />
          <View style={[styles.road, styles.roadV, { left: '25%' }]} />
          <View style={[styles.road, styles.roadV, { left: '50%' }]} />
          <View style={[styles.road, styles.roadV, { left: '75%' }]} />

          {/* Yellow pin */}
          <View style={styles.pin}>
            <View style={styles.pinHead} />
            <View style={styles.pinStem} />
            <View style={styles.pinShadow} />
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Confirm location</Text>
          <TouchableOpacity>
            <Text style={styles.adjustText}>Adjust</Text>
          </TouchableOpacity>
        </View>

        {/* Address card */}
        <View style={styles.addrCard}>
          <View style={styles.addrIcon}>
            <Ionicons name="location" size={18} color={Colors.red} />
          </View>
          <View style={styles.addrInfo}>
            <Text style={styles.addrMain}>{MOCK_ADDRESS}</Text>
            <Text style={styles.addrSub}>{MOCK_AREA}</Text>
          </View>
        </View>

        {/* Location options */}
        <View style={styles.optionsRow}>
          <TouchableOpacity style={[styles.optionCard, styles.optionActive]}>
            <Ionicons name="navigate" size={20} color={Colors.yellow} />
            <Text style={[styles.optionLabel, styles.optionLabelActive]}>Use GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionCard}>
            <Ionicons name="create-outline" size={20} color={Colors.muted} />
            <Text style={styles.optionLabel}>Type address</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionCard}>
            <Ionicons name="pin-outline" size={20} color={Colors.muted} />
            <Text style={styles.optionLabel}>Drop pin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.8}>
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
    flex: 1,
    maxHeight: 260,
  },
  mapBg: {
    flex: 1,
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
  pin: {
    position: 'absolute',
    top: '42%',
    left: '48%',
    alignItems: 'center',
    zIndex: 5,
  },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.yellow,
    borderWidth: 3,
    borderColor: Colors.black,
  },
  pinStem: {
    width: 3,
    height: 10,
    backgroundColor: Colors.yellow,
    marginTop: -2,
  },
  pinShadow: {
    width: 12,
    height: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginTop: 2,
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

  /* Location options */
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.dark3,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionActive: {
    backgroundColor: 'rgba(255,252,0,0.08)',
    borderColor: 'rgba(255,252,0,0.25)',
  },
  optionLabel: {
    color: Colors.muted,
    fontSize: 11,
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
