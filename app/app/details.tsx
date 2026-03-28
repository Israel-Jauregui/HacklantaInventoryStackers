import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, severityColor, severityLabel } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { reports, isAdmin, updateReportStatus } = useApp();

  const report = id ? reports.find((r) => r.id === id) : null;
  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.white, textAlign: 'center', marginTop: 40 }}>
          Report not found
        </Text>
      </SafeAreaView>
    );
  }

  const score = report.severityScore;

  const handleMarkFixed = () => {
    updateReportStatus(report.id, 'fixed');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Report Details</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Photo hero */}
      <View style={styles.photoHero}>
        {report.imageUri ? (
          <Image source={{ uri: report.imageUri }} style={styles.photoImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={40} color={Colors.muted} />
          </View>
        )}
        {score !== null && score !== undefined && (
          <View style={[styles.badge, { backgroundColor: severityColor(score) }]}>
            <Text style={styles.badgeText}>{severityLabel(score)}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>SEVERITY SCORE</Text>
          <Text style={[styles.scoreValue, { color: severityColor(score) }]}>
            {score.toFixed(1)}/10
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowKey}>Location</Text>
          <Text style={styles.rowVal}>{report.location.address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowKey}>Report ID</Text>
          <Text style={styles.rowVal}>{report.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowKey}>Status</Text>
          <Text
            style={[
              styles.rowVal,
              { color: report.status === 'open' ? Colors.yellow : Colors.green },
            ]}
          >
            {report.status.toUpperCase()}
          </Text>
        </View>

        {/* Admin: Mark as Fixed */}
        {isAdmin && report.status === 'open' && (
          <TouchableOpacity style={styles.fixedBtn} onPress={handleMarkFixed} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.black} />
            <Text style={styles.fixedBtnText}>Mark as Fixed</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  photoHero: {
    height: 180,
    backgroundColor: Colors.dark2,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark3,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: Colors.dark3,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  scoreLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowKey: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  rowVal: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '60%',
  },
  fixedBtn: {
    backgroundColor: Colors.green,
    borderRadius: 50,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  fixedBtnText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '700',
  },
});
