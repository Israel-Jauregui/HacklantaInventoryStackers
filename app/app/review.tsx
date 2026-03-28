import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { Colors, severityColor } from '@/constants/theme';
import { createReport } from '@/services/api'; // Removed unused imageUrl import
import { useState } from 'react';

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
  const { addReport, deviceUuid, serverUserId, refreshReports } = useApp();

  const numScore = score != null && score !== '' ? parseFloat(score) : 7.8;
  const sColor = severityColor(numScore);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Optimistically add local report so the user sees it immediately
      const localReport = {
        id: Date.now().toString(),
        imageUri: imageUri ?? '',
        location: {
          lat: 33.784, // Note: Consider getting actual GPS coords if possible
          lng: -84.388,
          address: `${address}, ${area}`,
        },
        severityScore: numScore,
        status: 'open' as const,
        userId: serverUserId ?? deviceUuid ?? '',
      };
      
      addReport(localReport);

      // 2. Send to backend if we have a user ID
      if (serverUserId) {
        await createReport({
          userId: serverUserId,
          latitude: 33.784,
          longitude: -84.388,
          address: `${address}, ${area}`,
          severityScore: numScore,
          description: notes || undefined,
          imageUri: imageUri || undefined,
        });
        
        // Refresh list so the real server ID replaces our temp one
        refreshReports().catch((e) => console.log('Refresh failed', e));
      }

      // 3. Navigate back to home
      router.replace('/(tabs)');
    } catch (err) {
      console.warn('Failed to submit report', err);
      // Optional: Add an Alert.alert() here to notify the user of the failure
    } finally {
      setSubmitting(false);
    }
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
      <View style={styles.stepBar}>
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepDone]} />
        <View style={[styles.stepSeg, styles.stepActive]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]}>
              <Ionicons name="image-outline" size={48} color={Colors.muted} />
            </View>
          )}
          <View style={[styles.sevBadge, { backgroundColor: sColor }]}>
            <Ionicons name="warning" size={12} color={Colors.white} />
            <Text style={styles.sevBadgeText}>{severity ?? 'CRITICAL'}</Text>
          </View>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Ready to submit</Text>
          <Text style={styles.subtitle}>
            Review the details below before sending your report.
          </Text>
        </View>

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

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={18} color={Colors.blue} />
          <Text style={styles.noteText}>
            Your report will be sent to Atlanta City Council District 6 for review and prioritization.{' '}
            {notes ? `\n\nYour note: "${notes}"` : ''}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <TouchableOpacity 
          style={styles.ctaBtn} 
          onPress={handleSubmit} 
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.black} />
          ) : (
            <Text style={styles.ctaBtnText}>Submit report ↗</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={handleEdit} 
          activeOpacity={0.7}
          disabled={submitting}
        >
          <Ionicons name="pencil" size={16} color={Colors.white} />
          <Text style={styles.editBtnText}>Edit report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  /* Step bar */
  stepBar: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  stepSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepDone: { backgroundColor: Colors.yellow },
  stepActive: { backgroundColor: Colors.yellow, opacity: 0.6 },

  scroll: { padding: 20, paddingBottom: 120, gap: 20 },

  /* Hero image */
  heroWrap: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  heroImg: { width: '100%', height: 200, borderRadius: 16 },
  heroPlaceholder: {
    backgroundColor: Colors.dark3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Severity badge */
  sevBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sevBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Title */
  titleWrap: { gap: 4 },
  title: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.muted, fontSize: 14, lineHeight: 20 },

  /* Rows card */
  rowsCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { color: Colors.muted, fontSize: 13, fontWeight: '500' },
  rowValue: { color: Colors.white, fontSize: 13, fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  /* Info note */
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.15)',
  },
  noteText: { flex: 1, color: Colors.muted, fontSize: 13, lineHeight: 19 },

  /* CTA */
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
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  editBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});