import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="location" options={{ presentation: 'card' }} />
        <Stack.Screen name="report-details" options={{ presentation: 'card' }} />
        <Stack.Screen name="review" options={{ presentation: 'card' }} />
        <Stack.Screen name="details" options={{ presentation: 'card' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style="light" />
    </AppProvider>
  );
}
