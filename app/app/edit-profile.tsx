import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

/* ─── Preset avatar options (mock) ─── */
const AVATAR_PRESETS = [
  { id: '1', emoji: '🦸', label: 'Hero' },
  { id: '2', emoji: '🛣️', label: 'Road Scout' },
  { id: '3', emoji: '🔧', label: 'Fixer' },
  { id: '4', emoji: '🏗️', label: 'Builder' },
  { id: '5', emoji: '🦺', label: 'Safety' },
  { id: '6', emoji: '🚧', label: 'Patrol' },
  { id: '7', emoji: '🎯', label: 'Spotter' },
  { id: '8', emoji: '⚡', label: 'Flash' },
  { id: '9', emoji: '🌟', label: 'Star' },
  { id: '10', emoji: '🏆', label: 'Champ' },
  { id: '11', emoji: '🦅', label: 'Eagle Eye' },
  { id: '12', emoji: '🔥', label: 'Blaze' },
];

export default function EditProfileScreen() {
  const { displayName, setDisplayName, avatarUri, setAvatarUri } = useApp();
  const router = useRouter();

  const [name, setName] = useState(displayName);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(avatarUri);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      setDisplayName(trimmed);
    }
    setAvatarUri(selectedAvatar);
    router.back();
  };

  const hasChanges = name.trim() !== displayName || selectedAvatar !== avatarUri;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges}
            hitSlop={12}
          >
            <Text style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Current avatar preview */}
          <View style={styles.previewWrap}>
            <View style={styles.previewCircle}>
              {selectedAvatar ? (
                <Text style={styles.previewEmoji}>
                  {AVATAR_PRESETS.find((a) => a.id === selectedAvatar)?.emoji ?? '👤'}
                </Text>
              ) : (
                <Ionicons name="person" size={40} color={Colors.muted} />
              )}
            </View>
            <Text style={styles.previewHint}>Tap an avatar below to change</Text>
          </View>

          {/* Display name input */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.muted}
              maxLength={24}
              autoCapitalize="words"
              returnKeyType="done"
            />
            <Text style={styles.charCount}>{name.length}/24</Text>
          </View>

          {/* Avatar grid */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CHOOSE AVATAR</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedAvatar(isSelected ? null : preset.id)}
                  >
                    <Text style={styles.avatarEmoji}>{preset.emoji}</Text>
                    <Text style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}>
                      {preset.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color={Colors.black} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Note about backend */}
          <View style={styles.noteBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={Colors.muted} />
            <Text style={styles.noteText}>
              Profile is stored locally. Cloud sync coming soon.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  saveBtn: { color: Colors.yellow, fontSize: 16, fontWeight: '700' },
  saveBtnDisabled: { opacity: 0.3 },

  scroll: { padding: 20, paddingBottom: 40, gap: 28 },

  /* Avatar preview */
  previewWrap: { alignItems: 'center', gap: 10 },
  previewCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark3,
    borderWidth: 2,
    borderColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: { fontSize: 44 },
  previewHint: { color: Colors.muted, fontSize: 12 },

  /* Name input */
  fieldWrap: { gap: 10 },
  fieldLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nameInput: {
    backgroundColor: Colors.dark2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  charCount: {
    color: Colors.muted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: -4,
  },

  /* Avatar grid */
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.dark2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 4,
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: Colors.yellow,
    backgroundColor: 'rgba(255,252,0,0.08)',
  },
  avatarEmoji: { fontSize: 28 },
  avatarLabel: { color: Colors.muted, fontSize: 9, fontWeight: '600' },
  avatarLabelSelected: { color: Colors.yellow },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Note */
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark2,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  noteText: { color: Colors.muted, fontSize: 12, flex: 1 },
});
