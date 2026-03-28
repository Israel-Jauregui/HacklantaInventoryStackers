import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAdminPortal } from '@/context/AdminPortalContext';
import { ADMIN_DEMO_CREDENTIALS } from '@/data/adminPortalMock';

type LoginRole = keyof typeof ADMIN_DEMO_CREDENTIALS;

export default function AdminLoginScreen() {
  const router = useRouter();
  const { isReady, isAuthenticated, login } = useAdminPortal();
  const [loginRole, setLoginRole] = useState<LoginRole>('official');
  const [email, setEmail] = useState(ADMIN_DEMO_CREDENTIALS.official.email);
  const [password, setPassword] = useState(ADMIN_DEMO_CREDENTIALS.official.password);
  const [error, setError] = useState('');

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.yellow} />
          <Text style={styles.loadingText}>Loading admin portal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/admin/dashboard" />;
  }

  const activeCredentials = ADMIN_DEMO_CREDENTIALS[loginRole];

  const handleLogin = () => {
    const success = login(email, password);
    if (success) {
      setError('');
      router.replace('/admin/dashboard');
      return;
    }

    setError('Invalid credentials. Use one of the demo staff logins below.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.brand}>StreetSense</Text>
          <Text style={styles.headerTitle}>City Staff Admin Portal</Text>
          <Text style={styles.headerSubtitle}>
            Secure access for city officials and field employees to manage repairs.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={26} color={Colors.yellow} />
          </View>

          <Text style={styles.cardTitle}>Staff Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Choose a city official or employee login and open the shared operations workspace.
          </Text>

          <View style={styles.roleRow}>
            {(['official', 'employee'] as LoginRole[]).map((role) => {
              const isActive = loginRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleChip, isActive && styles.roleChipActive]}
                  activeOpacity={0.84}
                  onPress={() => {
                    setLoginRole(role);
                    setEmail(ADMIN_DEMO_CREDENTIALS[role].email);
                    setPassword(ADMIN_DEMO_CREDENTIALS[role].password);
                    setError('');
                  }}
                >
                  <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                    {role === 'official' ? 'City Official' : 'Employee'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={activeCredentials.email}
              placeholderTextColor={Colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              placeholder={activeCredentials.password}
              placeholderTextColor={Colors.muted}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.84} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Enter Admin Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.84}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="arrow-back-outline" size={16} color={Colors.white} />
            <Text style={styles.secondaryButtonText}>Back to Reporting Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.demoPanel}>
            <Text style={styles.demoLabel}>Demo access</Text>
            <Text style={styles.demoText}>
              {activeCredentials.role === 'official' ? 'Official' : 'Employee'}: {activeCredentials.email}
            </Text>
            <Text style={styles.demoText}>Password: {activeCredentials.password}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  flex: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  headerWrap: {
    gap: 6,
  },
  brand: {
    color: Colors.yellow,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  headerSubtitle: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '92%',
  },
  card: {
    backgroundColor: Colors.dark2,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: Colors.dark3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  roleChipActive: {
    backgroundColor: 'rgba(255,252,0,0.10)',
    borderColor: 'rgba(255,252,0,0.20)',
  },
  roleChipText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: Colors.yellow,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.dark3,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  errorText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryButtonText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.dark3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  demoPanel: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  demoLabel: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  demoText: {
    color: Colors.white,
    fontSize: 13,
  },
});
