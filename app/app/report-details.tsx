import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, severityColor, severityLabel } from '@/constants/theme';

export default function ReportDetailsScreen() {
  const { imageUri, address, area } = useLocalSearchParams<{
    imageUri: string;
    address: string;
    area: string;
  }>();
  const router = useRouter();

  const [analyzing, setAnalyzing] = useState(true);
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [notify, setNotify] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<'Critical' | 'Moderate' | 'Minor' | null>(null);

  // AI mock analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockScore = 7.8;
      setScore(mockScore);
      setSelectedSeverity(severityLabel(mockScore) as any);
      setAnalyzing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleReview = () => {
    router.push({
      pathname: '/review',
      params: {
        imageUri,
        address,
        area,
        score: String(score),
        severity: selectedSeverity ?? 'Critical',
        notes,
        notify: notify ? '1' : '0',
      },
    });
  };

  const sevChips: Array<'Minor' | 'Moderate' | 'Critical'> = ['Minor', 'Moderate', 'Critical'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Step bar */}
      <View style={styles.stepBar}>
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepActive]} />
        <View style={styles.stepSeg} />
      </View>

      {analyzing ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.yellow} />
            <Text style={styles.loadingTitle}>Analyzing pothole…</Text>
            <Text style={styles.loadingSub}>
              AI is measuring dimensions and estimating severity
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Photo thumbnail */}
          <View style={styles.thumbRow}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="image-outline" size={24} color={Colors.muted} />
              </View>
            )}
          </View>

          {/* Severity section */}
          <View style={styles.sevSection}>
            <View style={styles.sevHeader}>
              <Text style={styles.sevLabel}>SEVERITY</Text>
              <Text style={[styles.sevScore, { color: severityColor(score) }]}>{score.toFixed(1)} / 10</Text>
            </View>

            {/* Gradient bar */}
            <View style={styles.sevBarWrap}>
              <View style={styles.sevBarBg}>
                <View style={[styles.sevBarFill, { width: `${score * 10}%`, backgroundColor: severityColor(score) }]} />
              </View>
              <View style={[styles.sevBarKnob, { left: `${score * 10}%` }]}>
                <View style={[styles.sevKnobDot, { backgroundColor: severityColor(score) }]} />
              </View>
            </View>

            {/* Chips */}
            <View style={styles.chipRow}>
              {sevChips.map((c) => {
                const active = selectedSeverity === c;
                const chipColor = c === 'Critical' ? Colors.red : c === 'Moderate' ? Colors.amber : Colors.green;
                return (
                  <View
                    key={c}
                    style={[
                      styles.chip,
                      active && { backgroundColor: chipColor + '20', borderColor: chipColor },
                    ]}
                  >
                    {active && <Ionicons name="checkmark" size={14} color={chipColor} />}
                    <Text style={[styles.chipText, active && { color: chipColor }]}>{c}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI banner */}
          <View style={styles.aiBanner}>
            <Ionicons name="sparkles" size={16} color={Colors.yellow} />
            <Text style={styles.aiBannerText}>
              AI detected large pothole (~18 in wide, ~4 in deep). Severity set to{' '}
              <Text style={{ fontWeight: '700' }}>{selectedSeverity}</Text>.
            </Text>
          </View>

          {/* Car damage diagram */}
          <View style={styles.damageCard}>
            <View style={styles.damageHeader}>
              <Ionicons name="car-sport" size={18} color={Colors.yellow} />
              <Text style={styles.damageTitle}>Potential Vehicle Damage</Text>
            </View>
            <Text style={styles.damageSub}>
              Based on pothole dimensions, AI estimates the following repair costs:
            </Text>

            {/* Car diagram */}
            <View style={styles.carDiagram}>
              {/* Car body outline */}
              <View style={styles.carBody}>
                {/* Hood */}
                <View style={styles.carHood}>
                  <Text style={styles.carPartLabel}>FRONT</Text>
                </View>
                {/* Windshield */}
                <View style={styles.carWindshield} />
                {/* Cabin */}
                <View style={styles.carCabin} />
                {/* Rear window */}
                <View style={styles.carRearWindow} />
                {/* Trunk */}
                <View style={styles.carTrunk}>
                  <Text style={styles.carPartLabel}>REAR</Text>
                </View>
              </View>

              {/* Left wheels */}
              <View style={[styles.wheel, styles.wheelFL]} />
              <View style={[styles.wheel, styles.wheelRL]} />
              {/* Right wheels */}
              <View style={[styles.wheel, styles.wheelFR]} />
              <View style={[styles.wheel, styles.wheelRR]} />

              {/* Damage callouts — left side */}
              <View style={[styles.callout, styles.calloutTire]}>
                <View style={styles.calloutDot} />
                <View style={styles.calloutLine} />
                <View style={styles.calloutBubble}>
                  <Text style={styles.calloutName}>Tires</Text>
                  <Text style={styles.calloutCost}>$150 – $300</Text>
                </View>
              </View>

              <View style={[styles.callout, styles.calloutSusp]}>
                <View style={styles.calloutDot} />
                <View style={styles.calloutLine} />
                <View style={styles.calloutBubble}>
                  <Text style={styles.calloutName}>Suspension</Text>
                  <Text style={styles.calloutCost}>$500 – $1,500</Text>
                </View>
              </View>

              {/* Damage callouts — right side */}
              <View style={[styles.callout, styles.calloutRim]}>
                <View style={styles.calloutBubbleR}>
                  <Text style={styles.calloutName}>Rims / Wheels</Text>
                  <Text style={styles.calloutCost}>$200 – $500</Text>
                </View>
                <View style={styles.calloutLine} />
                <View style={styles.calloutDot} />
              </View>

              <View style={[styles.callout, styles.calloutAlign]}>
                <View style={styles.calloutBubbleR}>
                  <Text style={styles.calloutName}>Alignment</Text>
                  <Text style={styles.calloutCost}>$100 – $200</Text>
                </View>
                <View style={styles.calloutLine} />
                <View style={styles.calloutDot} />
              </View>
            </View>

            {/* Undercarriage row */}
            <View style={styles.underRow}>
              <Ionicons name="warning" size={14} color={Colors.amber} />
              <Text style={styles.underText}>Undercarriage risk: <Text style={{ fontWeight: '700', color: Colors.amber }}>$300 – $800</Text></Text>
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ESTIMATED TOTAL DAMAGE</Text>
              <Text style={styles.totalValue}>$1,250 – $3,300</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.notesWrap}>
            <Text style={styles.fieldLabel}>Additional notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add details about the pothole…"
              placeholderTextColor={Colors.muted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Notify toggle */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Notify me when fixed</Text>
              <Text style={styles.toggleSub}>Get a push notification on status change</Text>
            </View>
            <Switch
              value={notify}
              onValueChange={setNotify}
              trackColor={{ false: Colors.dark4, true: Colors.yellow + '80' }}
              thumbColor={notify ? Colors.yellow : '#888'}
            />
          </View>
        </ScrollView>
      )}

      {/* CTA */}
      {!analyzing && (
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleReview} activeOpacity={0.8}>
            <Text style={styles.ctaBtnText}>Review report →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  /* Steps */
  stepBar: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  stepSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepDone: { backgroundColor: Colors.yellow },
  stepActive: { backgroundColor: Colors.yellow, opacity: 0.6 },

  /* Loading */
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingCard: { alignItems: 'center', gap: 16 },
  loadingTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  loadingSub: { color: Colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  scroll: { padding: 20, paddingBottom: 100, gap: 20 },

  /* Thumbnails */
  thumbRow: { flexDirection: 'row', gap: 10 },
  thumb: { width: 90, height: 90, borderRadius: 14, backgroundColor: Colors.dark3 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbAdd: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: Colors.dark3,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Severity */
  sevSection: { gap: 12 },
  sevHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sevLabel: { color: Colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  sevScore: { fontSize: 18, fontWeight: '800' },
  sevBarWrap: { position: 'relative', height: 10 },
  sevBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.dark4, overflow: 'hidden' },
  sevBarFill: { height: 6, borderRadius: 3 },
  sevBarKnob: { position: 'absolute', top: -2, marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.dark2, borderWidth: 2, borderColor: Colors.dark4, alignItems: 'center', justifyContent: 'center' },
  sevKnobDot: { width: 6, height: 6, borderRadius: 3 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: Colors.dark3,
  },
  chipText: { color: Colors.muted, fontSize: 13, fontWeight: '600' },

  /* AI banner */
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,252,0,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,252,0,0.15)',
  },
  aiBannerText: { flex: 1, color: Colors.white, fontSize: 13, lineHeight: 19 },

  /* Car damage card */
  damageCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  damageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  damageTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  damageSub: { color: Colors.muted, fontSize: 12, lineHeight: 17 },

  /* Car diagram container */
  carDiagram: {
    position: 'relative',
    height: 220,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 4,
  },

  /* Car body */
  carBody: {
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 180,
    alignItems: 'center',
  },
  carHood: {
    width: 48,
    height: 36,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(255,252,0,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,252,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carWindshield: {
    width: 42,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: -1,
  },
  carCabin: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,252,0,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,252,0,0.25)',
    marginTop: -1,
  },
  carRearWindow: {
    width: 42,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: -1,
  },
  carTrunk: {
    width: 48,
    height: 36,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: 'rgba(255,252,0,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,252,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
  },
  carPartLabel: { color: 'rgba(255,252,0,0.5)', fontSize: 7, fontWeight: '800', letterSpacing: 1 },

  /* Wheels */
  wheel: {
    position: 'absolute',
    width: 18,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  wheelFL: { top: 36, left: '50%', marginLeft: -46 },
  wheelFR: { top: 36, left: '50%', marginLeft: 28 },
  wheelRL: { top: 140, left: '50%', marginLeft: -46 },
  wheelRR: { top: 140, left: '50%', marginLeft: 28 },

  /* Callout system */
  callout: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  calloutTire: { top: 42, left: 0, right: '58%' },
  calloutSusp: { top: 100, left: 0, right: '58%' },
  calloutRim: { top: 42, left: '58%', right: 0 },
  calloutAlign: { top: 148, left: '58%', right: 0 },

  calloutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
    borderWidth: 1.5,
    borderColor: 'rgba(255,80,80,0.5)',
  },
  calloutLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    minWidth: 10,
  },
  calloutBubble: {
    backgroundColor: Colors.dark3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  calloutBubbleR: {
    backgroundColor: Colors.dark3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'flex-end',
  },
  calloutName: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  calloutCost: { color: Colors.red, fontSize: 11, fontWeight: '600', marginTop: 1 },

  /* Undercarriage row */
  underRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,179,0,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,179,0,0.15)',
  },
  underText: { color: Colors.muted2, fontSize: 12, flex: 1 },

  /* Total */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,80,80,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.2)',
  },
  totalLabel: { color: Colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, flexShrink: 1 },
  totalValue: { color: Colors.red, fontSize: 13, fontWeight: '800' },

  /* Notes */
  notesWrap: { gap: 8 },
  fieldLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  notesInput: {
    backgroundColor: Colors.dark3,
    borderRadius: 12,
    padding: 14,
    color: Colors.white,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  /* Toggle */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark3,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  toggleLabel: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  toggleSub: { color: Colors.muted, fontSize: 11, marginTop: 3 },

  /* CTA */
  ctaWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  ctaBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
});
