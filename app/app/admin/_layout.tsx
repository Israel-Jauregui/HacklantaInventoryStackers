import { Stack } from 'expo-router';
import { AdminPortalProvider } from '@/context/AdminPortalContext';

export default function AdminLayout() {
  return (
    <AdminPortalProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'slide_from_right',
        }}
      />
    </AdminPortalProvider>
  );
}
