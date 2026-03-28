import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type ReactNode } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAdminPortal } from '@/context/AdminPortalContext';

type AdminSection = 'dashboard' | 'reports' | 'map';

interface AdminPortalShellProps {
  title: string;
  subtitle: string;
  activeSection: AdminSection;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const NAV_ITEMS: { key: AdminSection; label: string; href: '/admin/dashboard' | '/admin/reports' | '/admin/map' }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { key: 'reports', label: 'Reports', href: '/admin/reports' },
  { key: 'map', label: 'Map', href: '/admin/map' },
];

export function AdminPortalShell({
  title,
  subtitle,
  activeSection,
  children,
  contentContainerStyle,
}: AdminPortalShellProps) {
  const router = useRouter();
  const { isReady, isAuthenticated, user, logout } = useAdminPortal();

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.yellow} />
          <Text style={styles.loadingText}>Opening admin portal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/admin" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>StreetSense Admin</Text>
          <Text style={styles.officialMeta}>
            {user?.title} · {user?.name}
          </Text>
          <Text style={styles.roleMeta}>City Official Access</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.appButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="apps-outline" size={16} color={Colors.white} />
            <Text style={styles.appButtonText}>Reporting App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={() => {
              logout();
              router.replace('/admin');
            }}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.yellow} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>CITY STAFF PORTAL</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>

        <View style={styles.navRow}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeSection;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navChip, isActive && styles.navChipActive]}
                activeOpacity={0.82}
                onPress={() => router.push(item.href)}
              >
                <Text style={[styles.navChipText, isActive && styles.navChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
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
    fontWeight: '600',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  brand: {
    color: Colors.yellow,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  officialMeta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  roleMeta: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.dark3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  appButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.dark2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logoutText: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.dark2,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  heroEyebrow: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: Colors.dark2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  navChipActive: {
    backgroundColor: 'rgba(255,252,0,0.10)',
    borderColor: 'rgba(255,252,0,0.22)',
  },
  navChipText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  navChipTextActive: {
    color: Colors.yellow,
  },
});
