import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { openMapsChooser } from '@/utils/adminPortal';

interface MapActionRowProps {
  address: string;
  latitude?: number;
  longitude?: number;
}

export function MapActionRow({
  address,
  latitude,
  longitude,
}: MapActionRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.action}
        activeOpacity={0.84}
        onPress={() =>
          openMapsChooser({
            label: 'address',
            query: address,
            latitude,
            longitude,
          })
        }
      >
        <Ionicons name="location-outline" size={14} color={Colors.yellow} />
        <Text style={styles.actionText}>Address Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.dark3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
