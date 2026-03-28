import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashOn, setFlashOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        router.push({ pathname: '/location', params: { imageUri: photo.uri } });
      }
    } catch {
      // Fallback: navigate with empty URI for demo purposes
      router.push({ pathname: '/location', params: { imageUri: '' } });
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      router.push({ pathname: '/location', params: { imageUri: result.assets[0].uri } });
    }
  };

  // ── Permission not yet determined ──
  if (!permission) {
    return <View style={styles.container} />;
  }

  // ── Permission denied ──
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionWrap}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={48} color={Colors.yellow} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDesc}>
            StreetSense needs your camera to snap photos of potholes and report them to the city.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera ready ──
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} enableTorch={flashOn} />

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        {/* Step progress bar */}
        <View style={styles.stepBar}>
          <View style={[styles.stepSeg, styles.stepActive]} />
          <View style={styles.stepSeg} />
          <View style={styles.stepSeg} />
          <View style={styles.stepSeg} />
        </View>

        <View style={styles.topRow}>
          <View style={{ width: 36 }} />
          <View style={styles.modePill}>
            <Text style={styles.modePillText}>POTHOLE MODE</Text>
          </View>
          <TouchableOpacity style={styles.topBtn} onPress={() => setFlashOn((f) => !f)}>
            <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={18} color={flashOn ? Colors.yellow : Colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Focus box in center */}
      <View style={styles.focusWrap}>
        <View style={styles.focusBox}>
          <View style={[styles.focusCorner, styles.cTL]} />
          <View style={[styles.focusCorner, styles.cTR]} />
          <View style={[styles.focusCorner, styles.cBL]} />
          <View style={[styles.focusCorner, styles.cBR]} />
        </View>
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.hint}>Point at the pothole and tap to capture</Text>
        <View style={styles.controls}>
          {/* Gallery */}
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
            <Ionicons name="images-outline" size={20} color={Colors.white} />
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity style={styles.shutter} onPress={handleCapture} activeOpacity={0.7}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Flip */}
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CORNER = 14;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },

  /* ── Permission screen ── */
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,252,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionDesc: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  permissionBtnText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── Top overlay ── */
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stepBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  stepSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stepActive: {
    backgroundColor: Colors.yellow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  modePillText: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  /* ── Focus box ── */
  focusWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusBox: {
    width: 220,
    height: 160,
    borderWidth: 1.5,
    borderColor: 'rgba(255,252,0,0.4)',
    borderRadius: 8,
  },
  focusCorner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  cTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.yellow,
    borderTopLeftRadius: 8,
  },
  cTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.yellow,
    borderTopRightRadius: 8,
  },
  cBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.yellow,
    borderBottomLeftRadius: 8,
  },
  cBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.yellow,
    borderBottomRightRadius: 8,
  },

  /* ── Bottom overlay ── */
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  hint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(36,36,36,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
