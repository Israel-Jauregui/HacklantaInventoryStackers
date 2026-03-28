import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { Colors, severityColor } from '@/constants/theme';

export default function ReviewScreen() {
  const { imageUri, address, area, score, severity, notes, notify } =
    useLocalSearchParams<{
      imageUri: string;
      address: string;
      area: string;
      score: string;
      severity: string;
      notes: string;
      notify: string;
    }>();
  const router = useRouter();
  const { addReport, deviceUuid } = useApp();

  const numScore = parseFloat(score) || 7.8;
  const sColor = severityColor(numScore);

  const handleSubmit = () => {
    addReport({
      id: Date.now().toString(),
      imageUri: imageUri ?? '',
      location: {
        lat: 33.784,
        lng: -84.388,
        address: `${address}, ${area}`,
      },
      severityScore: numScore,
      status: 'open',
      userId: deviceUuid ?? '',
    });
    router.replace('/(tabs)');
  };

  const handleEdit = () => {
    router.back();
  };

  const rows: { icon: string; label: string; value: string; color?: string }[] = [
    { icon: 'location', label: 'Location', value: address ?? '123 Peachtree St NW' },
    { icon: 'images', label: 'Photos', value: '1 attached' },
    {
      icon: 'warning',
      label: 'Severity',
      value: `${severity ?? 'Critical'} (${numScore.toFixed(1)})`,
      color: sColor,
    },
    {
      icon: 'notifications',
      label: 'Notify on fix',
      value: notify === '1' ? 'Yes' : 'No',
    },
    {
      icon: 'business',
      label: 'Send to council',
      value: 'Atlanta District 6',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Step bar */}
      <View style={styles.stepBar}>
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepActive]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photo hero */}
        <View style={styles.heroWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]}>
              <Ionicons name="image-outline" size={48} color={Colors.muted} />
            </View>
          )}
          {/* Severity badge */}
          <View style={[styles.sevBadge, { backgroundColor: sColor }]}>
            <Ionicons name="warning" size={12} color={Colors.white} />
            <Text style={styles.sevBadgeText}>{severity ?? 'CRITICAL'}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Ready to submit</Text>
          <Text style={styles.subtitle}>
            Review the details below before sending your report.
          </Text>
        </View>

        {/* Detail rows */}
        <View style={styles.rowsCard}>
          {rows.map((r, i) => (
            <View key={r.label}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons name={r.icon as any} size={18} color={Colors.muted} />
                  <Text style={styles.rowLabel}>{r.label}</Text>
                </View>
                <Text style={[styles.rowValue, r.color ? { color: r.color } : undefined]}>
                  {r.value}
                </Text>
              </View>
              {i < rows.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Council note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={18} color={Colors.blue} />
          <Text style={styles.noteText}>
            Your report will be sent to Atlanta City Council District 6 for review and prioritization.{' '}
            {notes ? `\n\nYour note: "${notes}"` : ''}
          </Text>
        </View>
      </ScrollView>

      {/* CTAs */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.ctaBtnText}>Submit report ↗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.7}>
          <Ionicons name="pencil" size={16} color={Colors.white} />
          <Text style={styles.editBtnText}>Edit report</Text>
        </TouchableOpacity>
      </View>
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

  scroll: { padding: 20, paddingBottom: 120, gap: 20 },

  /* Hero */
  heroWrap: { borderRadius: 18, overflow: 'hidden', position: 'relative' },
  heroImg: { width: '100%', height: 200, borderRadius: 18, backgroundColor: Colors.dark3 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  sevBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  sevBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  /* Title */
  titleWrap: { gap: 4 },
  title: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  subtitle: { color: Colors.muted, fontSize: 13, lineHeight: 19 },

  /* Rows */
  rowsCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { color: Colors.muted, fontSize: 14 },
  rowValue: { color: Colors.white, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },

  /* Note */
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.2)',
  },
  noteText: { flex: 1, color: Colors.white, fontSize: 13, lineHeight: 19 },

  /* CTAs */
  ctaWrap: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  ctaBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  editBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});
