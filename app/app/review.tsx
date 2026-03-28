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

// ... styles remain the same ...