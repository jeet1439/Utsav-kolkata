import {
  View,
  Text,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  TextInput,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Animated,
} from "react-native";
import Swiper from "react-native-swiper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useEffect, useState, useRef } from "react";
import { launchImageLibrary } from "react-native-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MemoryCard from "../../components/memoryCard";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = 300;

// ─── Color Palette (matches Home.js) ─────────────────────────────────────────
const COLORS = {
  primary: "#C8392B",
  primaryLight: "#E8594A",
  gold: "#D4A843",
  goldLight: "#F0C85A",
  dark: "#1A1210",
  surface: "#FDFAF7",
  surfaceAlt: "#F5EFE8",
  text: "#2C1810",
  textMuted: "#9E7B6B",
  white: "#FFFFFF",
  cardBg: "#FFFCF9",
  border: "rgba(212,168,67,0.15)",
};

// ─── Info Chip ─────────────────────────────────────────────────────────────────
const InfoChip = ({ icon, label }) => (
  <View style={styles.chip}>
    <Ionicons name={icon} size={13} color={COLORS.primary} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.accentBar} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const PandalDetailsScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [memories, setMemories] = useState([]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(height)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://192.168.0.100:3000/api/pandals/${item._id}`);
        const data = await res.json();
        const pandalMemories = data.featuredPictures.map((pic) => ({
          ...pic,
          pandalTitle: data.title,
        }));
        setMemories(pandalMemories);
      } catch (err) {
        console.error("Error fetching pandal memories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, [item._id]);

  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.location?.coordinates[1]},${item.location?.coordinates[0]}`;
    Linking.openURL(url);
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const granted = await PermissionsAndroid.request(permission, {
          title: "Gallery Permission",
          message: "We need access to your gallery to upload images",
          buttonPositive: "OK",
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const openGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) { alert("Permission denied"); return; }
    launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.length > 0) setSelectedImage(response.assets[0].uri);
    });
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(modalSlide, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalSlide, {
      toValue: height,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedImage(null);
      setCaption("");
    });
  };

  const handleUpload = async () => {
    if (!selectedImage) { alert("Please select an image first"); return; }
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", {
        uri: selectedImage,
        name: `featured.${selectedImage.split(".").pop()}`,
        type: `image/${selectedImage.split(".").pop()}`,
      });
      formData.append("caption", caption);

      const res = await axios.post(
        `http://192.168.0.100:3000/api/pandals/${item._id}/featured-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedPandal = res.data;
      const newMemory = {
        ...updatedPandal.featuredPictures[0],
        pandalTitle: updatedPandal.title,
      };
      setMemories((prev) => [newMemory, ...prev]);
      closeModal();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Sticky Animated Header ── */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.stickyTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
          <Ionicons name="navigate" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Transparent Back Button over hero ── */}
      <TouchableOpacity style={styles.floatingBack} onPress={() => navigation?.goBack()}>
        <Ionicons name="chevron-back" size={22} color={COLORS.white} />
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* ── Hero Swiper ── */}
        <View style={styles.hero}>
          <Swiper
            autoplay
            autoplayTimeout={3.5}
            dotStyle={styles.dot}
            activeDotStyle={styles.activeDot}
            paginationStyle={{ bottom: 14 }}
          >
            {item.pictures.map((pic, index) => (
              <Image key={index} source={{ uri: pic }} style={styles.heroImage} resizeMode="cover" />
            ))}
          </Swiper>
          {/* Gradient overlay */}
          <View style={styles.heroGradient} pointerEvents="none" />
        </View>

        {/* ── Content Card ── */}
        <View style={styles.contentCard}>

          {/* Title + Directions */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pandalTitle}>{item.title}</Text>
              <View style={styles.chipRow}>
                <InfoChip icon="walk-outline" label={`${item.distance.toFixed(2)} km away`} />
                {item.nearestMetro?.[0] && (
                  <InfoChip icon="subway-outline" label={`${item.nearestMetro[0]} Metro`} />
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.directionsBtn} onPress={openMaps}>
              <Ionicons name="navigate" size={16} color={COLORS.white} />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Metro Stations */}
          {item.nearestMetro?.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Nearest Metro Stations" />
              <View style={styles.metroList}>
                {item.nearestMetro.map((station, i) => station ? (
                  <View key={i} style={styles.metroItem}>
                    <View style={styles.metroIcon}>
                      <Ionicons name="subway" size={14} color={COLORS.primary} />
                    </View>
                    <Text style={styles.metroText}>{station} Metro Station</Text>
                  </View>
                ) : null)}
              </View>
            </View>
          )}

          {/* About */}
          <View style={styles.section}>
            <SectionHeader title="About" />
            <View style={styles.aboutBox}>
              <Text style={styles.aboutText}>{item.about}</Text>
            </View>
          </View>

          {/* Share Memory Button */}
          <TouchableOpacity style={styles.shareMemoryBtn} onPress={openModal} activeOpacity={0.88}>
            <View style={styles.shareMemoryIcon}>
              <Ionicons name="camera" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.shareMemoryText}>Share a Memory</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Memories Section */}
          <View style={[styles.section, { marginBottom: 32 }]}>
            <SectionHeader title="Memories" />
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading memories…</Text>
              </View>
            ) : (
              <FlatList
                data={memories}
                keyExtractor={(mem) => mem._id}
                scrollEnabled={false}
                renderItem={({ item: mem }) => <MemoryCard item={mem} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyMemories}>
                    <View style={styles.emptyMemoriesIcon}>
                      <Ionicons name="images-outline" size={30} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyMemoriesTitle}>No memories yet</Text>
                    <Text style={styles.emptyMemoriesSubtitle}>
                      Be the first to share a moment from this pandal!
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Share Memory Modal (Bottom Sheet style) ── */}
      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: modalSlide }] }]}>
          {/* Handle */}
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Share a Memory</Text>
          <Text style={styles.modalSubtitle}>Upload a photo from {item.title}</Text>

          {/* Image Picker */}
          <TouchableOpacity
            style={[styles.imagePicker, selectedImage && styles.imagePickerFilled]}
            onPress={openGallery}
            activeOpacity={0.85}
          >
            {selectedImage ? (
              <>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.changePhotoOverlay}>
                  <Ionicons name="camera" size={20} color={COLORS.white} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePickerEmpty}>
                <View style={styles.imagePickerIconCircle}>
                  <Ionicons name="image-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.imagePickerLabel}>Tap to select a photo</Text>
                <Text style={styles.imagePickerHint}>JPG, PNG supported</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption */}
          <View style={styles.captionWrapper}>
            <Ionicons name="pencil-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8, marginTop: 2 }} />
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption…"
              placeholderTextColor={COLORS.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
            />
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postBtn, uploading && { opacity: 0.65 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.white} />
                  <Text style={styles.postBtnText}>Post Memory</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // Sticky Header
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stickyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  mapsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(200,57,43,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  // Floating back over hero
  floatingBack: {
    position: "absolute",
    top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 54,
    left: 16,
    zIndex: 50,
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(26,18,16,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: COLORS.dark,
  },
  heroImage: {
    width,
    height: HERO_HEIGHT,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(26,18,16,0.35)",
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.4)",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: COLORS.gold,
    width: 18,
    height: 6,
    borderRadius: 3,
  },

  // Content Card
  contentCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  // Title Row
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  pandalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 30,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "600",
  },

  // Directions Button
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    marginTop: 4,
  },
  directionsBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // Section
  section: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  // Metro
  metroList: {
    gap: 10,
  },
  metroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metroIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(200,57,43,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  metroText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },

  // About
  aboutBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textMuted,
  },

  shareMemoryBtn: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shareMemoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareMemoryText: {
    flex: 1,
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },

  // Loading / Empty
  loadingState: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyMemories: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyMemoriesIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(200,57,43,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyMemoriesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyMemoriesSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },

  // Modal
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26,18,16,0.5)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    elevation: 30,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 18,
  },

  // Image Picker
  imagePicker: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  imagePickerFilled: {
    borderStyle: "solid",
    borderColor: "transparent",
  },
  imagePickerEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  imagePickerIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(200,57,43,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  imagePickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  imagePickerHint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  changePhotoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(26,18,16,0.55)",
    paddingVertical: 10,
  },
  changePhotoText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },

  // Caption
  captionWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  captionInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 44,
    textAlignVertical: "top",
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  postBtn: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  postBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default PandalDetailsScreen;