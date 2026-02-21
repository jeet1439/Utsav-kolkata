import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  PermissionsAndroid,
  Platform,
  TextInput,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import Modal from 'react-native-modal';
import axios from 'axios';
import chatIcon from '../../assets/chatIcon.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 3;
const GAP = 1.5;
const TILE = (SCREEN_WIDTH - GAP * (COLS - 1)) / COLS;

const BASE_URL = 'http://192.168.0.100:3000';
const C = {
  bg: '#FFFFFF',
  surface: '#FAFAFA',
  card: '#FFFFFF',
  text: '#0A0A0A',
  textSub: '#737373',
  textMuted: '#B2B2B2',
  border: '#EBEBEB',
  borderLight: '#F0F0F0',
  accent: '#0095F6',
  accentRed: '#E53E3E',
  white: '#FFFFFF',
  black: '#000000',
};

const requestGalleryPermission = async () => {
  if (Platform.OS !== 'android') return true;
  const perm =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
  const result = await PermissionsAndroid.request(perm, {
    title: 'Gallery Permission',
    message: 'We need access to your gallery.',
    buttonPositive: 'Allow',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const pickImage = async () => {
  const ok = await requestGalleryPermission();
  if (!ok) { Alert.alert('Permission denied'); return null; }
  return new Promise((resolve) => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (res) => {
      if (res.didCancel || res.errorCode) return resolve(null);
      resolve(res.assets?.[0]?.uri ?? null);
    });
  });
};

const StatBox = ({ label, value, onPress }) => (
  <TouchableOpacity style={styles.statBox} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const AvatarWithBadge = ({ uri, size = 86, onPress, uploading }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ alignItems: 'center' }}>
    <View style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[{ width: size, height: size, borderRadius: size / 2 }, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={size * 0.42} color={C.textMuted} />
        </View>
      )}
    </View>
    <View style={styles.cameraEditBadge}>
      {uploading ? (
        <ActivityIndicator size="small" color={C.white} style={{ transform: [{ scale: 0.7 }] }} />
      ) : (
        <Ionicons name="add" size={11} color={C.white} />
      )}
    </View>
  </TouchableOpacity>
);

const ImageTile = ({ uri, onLongPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(uri)}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      delayLongPress={180}
      activeOpacity={1}
    >
      <Animated.Image
        source={{ uri }}
        style={[styles.tile, { transform: [{ scale }] }]}
      />
    </TouchableOpacity>
  );
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');

  const [featuredModal, setFeaturedModal] = useState(false);
  const [featuredImg, setFeaturedImg] = useState(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  const [uploadingProfile, setUploadingProfile] = useState(false);

  const [bioModal, setBioModal] = useState(false);
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const [previewUri, setPreviewUri] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        console.error('fetchProfile:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user?.bio) setBioText(user.bio);
  }, [user]);

  const handleProfileImageUpload = async () => {
    const uri = await pickImage();
    if (!uri) return;
    try {
      setUploadingProfile(true);
      const token = await AsyncStorage.getItem('token');
      const ext = uri.split('.').pop();
      const form = new FormData();
      form.append('image', { uri, name: `profile.${ext}`, type: `image/${ext}` });
      const res = await axios.post(`${BASE_URL}/api/user/profile-image`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data.user ?? res.data);
    } catch (err) {
      console.error('profileUpload:', err);
      Alert.alert('Upload failed', 'Could not update profile photo.');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleFeaturedUpload = async () => {
    if (!featuredImg) { Alert.alert('No image selected'); return; }
    try {
      setUploadingFeatured(true);
      const token = await AsyncStorage.getItem('token');
      const ext = featuredImg.split('.').pop();
      const form = new FormData();
      form.append('image', { uri: featuredImg, name: `featured.${ext}`, type: `image/${ext}` });
      const res = await axios.post(`${BASE_URL}/api/user/featured-image`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
      setFeaturedImg(null);
      setFeaturedModal(false);
    } catch (err) {
      console.error('featuredUpload:', err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setSavingBio(true);
      const res = await axios.post(`${BASE_URL}/api/user/update-bio`, {
        userId: user._id,
        bio: bioText.trim(),
      });
      if (res.data.success) {
        setUser(res.data.user);
        setBioModal(false);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to update bio.');
      }
    } catch (err) {
      console.error('saveBio:', err);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSavingBio(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.black} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={C.textMuted} />
        <Text style={[styles.mutedText, { marginTop: 10 }]}>Couldn't load profile.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[3]}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.usernameHeader}>{user?.username ?? 'username'}</Text>
            <Ionicons name="chevron-down" size={15} color={C.text} style={{ marginTop: 2 }} />
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={() => setFeaturedModal(true)} style={styles.iconBtn}>
              <Ionicons name="add-outline" size={26} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => console.log('menu')} style={styles.iconBtn}>
              <Image source={chatIcon} style={{ width: 22, height: 22, tintColor: C.text }} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileInfoRow}>
          <AvatarWithBadge
            uri={user?.profileImage?.[0]}
            size={86}
            onPress={handleProfileImageUpload}
            uploading={uploadingProfile}
          />

          <View style={styles.statsRow}>
            <StatBox label="Posts" value={user?.featuredImages?.length ?? 0} />
            <StatBox label="Followers" value="0" />
            <StatBox label="Following" value="0" />
          </View>
        </View>

        <View style={styles.bioBlock}>
          <Text style={styles.displayName}>{user?.username}</Text>

          {user?.bio ? (
            <TouchableOpacity onLongPress={() => { setBioText(user.bio); setBioModal(true); }} activeOpacity={0.85}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addBioBtn}
              onPress={() => { setBioText(''); setBioModal(true); }}
              activeOpacity={0.7}
            >
              <Text style={styles.addBioText}>+ Add bio</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Share profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnIcon]} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={16} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar} />

        {activeTab === 'grid' ? (
          user?.featuredImages?.length > 0 ? (
            <FlatList
              data={user.featuredImages}
              keyExtractor={(_, i) => i.toString()}
              numColumns={COLS}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <ImageTile uri={item} onLongPress={setPreviewUri} />
              )}
              ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
              columnWrapperStyle={{ gap: GAP }}
            />
          ) : (
            <View style={styles.emptyGrid}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="camera-outline" size={34} color={C.text} />
              </View>
              <Text style={styles.emptyTitle}>Share Photos</Text>
              <Text style={styles.emptySubtitle}>
                When you share photos, they will appear on your profile.
              </Text>
              <TouchableOpacity onPress={() => setFeaturedModal(true)} activeOpacity={0.8}>
                <Text style={styles.emptyLink}>Share your first photo</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.emptyGrid}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="pricetag-outline" size={34} color={C.text} />
            </View>
            <Text style={styles.emptyTitle}>Photos of You</Text>
            <Text style={styles.emptySubtitle}>
              When people tag you in photos, they'll appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/*New Post Modal */}
      <Modal
        statusBarTranslucent={true}
        isVisible={featuredModal}
        onBackdropPress={() => { setFeaturedModal(false); setFeaturedImg(null); }}
        style={styles.bottomModal}
        swipeDirection="down"
        onSwipeComplete={() => { setFeaturedModal(false); setFeaturedImg(null); }}
        backdropColor="#000"
        backdropOpacity={0.45}
        useNativeDriverForBackdrop
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>New Post</Text>
            <TouchableOpacity onPress={() => { setFeaturedModal(false); setFeaturedImg(null); }}>
              <Ionicons name="close" size={22} color={C.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={async () => { const uri = await pickImage(); if (uri) setFeaturedImg(uri); }}
            activeOpacity={0.85}
          >
            {featuredImg ? (
              <Image source={{ uri: featuredImg }} style={styles.pickedImage} />
            ) : (
              <View style={styles.pickPlaceholder}>
                <Ionicons name="images-outline" size={36} color={C.textMuted} />
                <Text style={styles.pickText}>Tap to select from library</Text>
              </View>
            )}
          </TouchableOpacity>

          {featuredImg && (
            <TouchableOpacity
              style={styles.changeRow}
              onPress={async () => { const uri = await pickImage(); if (uri) setFeaturedImg(uri); }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={14} color={C.accent} />
              <Text style={styles.changeText}>Select different photo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, (!featuredImg || uploadingFeatured) && { opacity: 0.5 }]}
            onPress={handleFeaturedUpload}
            disabled={!featuredImg || uploadingFeatured}
          >
            {uploadingFeatured ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Bio Modal */}
      <Modal
        statusBarTranslucent={true}
        isVisible={bioModal}
        onBackdropPress={() => setBioModal(false)}
        style={styles.bottomModal}
        swipeDirection="down"
        onSwipeComplete={() => setBioModal(false)}
        backdropColor="#000"
        backdropOpacity={0.45}
        useNativeDriverForBackdrop
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>{user?.bio ? 'Edit Bio' : 'Add Bio'}</Text>
            <TouchableOpacity onPress={() => setBioModal(false)}>
              <Ionicons name="close" size={22} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.textInputWrap}>
            <TextInput
              value={bioText}
              onChangeText={setBioText}
              placeholder="Write something about you…"
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={150}
              style={styles.bioInput}
            />
            <View style={styles.charRow}>
              <View style={[styles.charBar, { width: `${(bioText.length / 150) * 100}%` }]} />
            </View>
            <Text style={styles.charCount}>{bioText.length}/150</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingBio && { opacity: 0.6 }]}
            onPress={handleSaveBio}
            disabled={savingBio}
          >
            {savingBio ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        statusBarTranslucent={true}
        isVisible={!!previewUri}
        onBackdropPress={() => setPreviewUri(null)}
        style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={180}
        animationOutTiming={180}
        backdropColor="#000"
        backdropOpacity={0.92}
        useNativeDriverForBackdrop
      >
        <Image
          source={{ uri: previewUri }}
          style={styles.previewFull}
          resizeMode="contain"
        />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.previewActionBtn}>
            <Ionicons name="heart-outline" size={22} color={C.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewActionBtn}>
            <Ionicons name="paper-plane-outline" size={22} color={C.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewActionBtn}>
            <Ionicons name="bookmark-outline" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  mutedText: { color: C.textMuted, fontSize: 14 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  usernameHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  iconBtn: { padding: 6 },

  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 24,
  },

  avatarWrapper: {
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },

  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: { alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  statLabel: { fontSize: 12.5, color: C.text, marginTop: 1, fontWeight: '400' },

  bioBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  displayName: { fontSize: 13.5, fontWeight: '600', color: C.text, marginBottom: 2 },
  bioText: { fontSize: 13.5, color: C.text, lineHeight: 20, marginBottom: 12 },
  addBioBtn: { marginBottom: 12 },
  addBioText: { fontSize: 13.5, color: C.accent, fontWeight: '500' },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: { flex: 0, paddingHorizontal: 12 },
  actionBtnText: { fontSize: 13.5, fontWeight: '600', color: C.text },

  tabBar: {
    backgroundColor: C.bg,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    height: 1,
  },

  tile: {
    width: TILE,
    height: TILE,
    backgroundColor: C.borderLight,
  },

  emptyGrid: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: C.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  emptyLink: { fontSize: 14, color: C.accent, fontWeight: '600', marginTop: 4 },

  bottomModal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 44,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  imagePicker: {
    borderRadius: 12,
    height: 220,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  pickPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  pickText: { fontSize: 14, color: C.textMuted, fontWeight: '400' },
  pickedImage: { width: '100%', height: '100%' },

  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  changeText: { fontSize: 13, color: C.accent, fontWeight: '500' },

  primaryBtn: {
    backgroundColor: C.accent,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },

  textInputWrap: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 16,
  },
  bioInput: {
    color: C.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charRow: {
    height: 2,
    backgroundColor: C.border,
    borderRadius: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  charBar: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 1,
  },
  charCount: { fontSize: 11.5, color: C.textMuted, textAlign: 'right', marginTop: 6 },

  previewFull: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  previewActions: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    gap: 20,
    alignItems: 'center',
  },
  previewActionBtn: { padding: 6 },
});

export default Profile;