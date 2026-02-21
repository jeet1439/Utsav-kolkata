import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "react-native-modal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING = 20;
const GAP = 3;
const NUM_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;

const ImageTile = ({ uri, onPreview }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <TouchableOpacity
      onLongPress={() => onPreview(uri)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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

const StatPill = ({ value, label }) => (
  <View style={styles.statPill}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const PersonProfile = () => {
  const route = useRoute();
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://192.168.0.100:3000/api/user/getuser/${userId}`);
        const data = await res.json();
        setUser(data);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: true }),
        ]).start();
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />

      <FlatList
        data={user?.featuredImages ?? []}
        keyExtractor={(_, i) => i.toString()}
        numColumns={NUM_COLS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Avatar + Actions ── */}
            <View style={styles.heroSection}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: user?.profileImage?.[0] }}
                  style={styles.avatar}
                />
                <View style={styles.avatarRing} />
              </View>

              <View style={styles.heroRight}>
                <View style={{ flexDirection: 'row' , justifyContent: 'space-between'}}>
                  <Text style={styles.username} numberOfLines={1}>
                    {user?.username ?? "—"}
                  </Text>
                  <TouchableOpacity style={styles.messageBtn} activeOpacity={0.82}>
                    <Text style={styles.messageBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>


                <View style={styles.statsRow}>
                  <StatPill value="0" label="views" />
                  <View style={styles.statDivider} />
                  <StatPill value={user?.featuredImages?.length ?? 0} label="photos" />
                </View>

                {/* <TouchableOpacity style={styles.messageBtn} activeOpacity={0.82}>
                  <Text style={styles.messageBtnText}>Message</Text>
                </TouchableOpacity> */}
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.bio}>
                {user?.bio?.trim() || "No bio yet."}
              </Text>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.sectionLine} />
            </View>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <ImageTile uri={item} onPreview={setPreviewImage} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No photos yet.</Text>
        }
      />

      <Modal
        statusBarTranslucent={true}
        isVisible={!!previewImage}
        onBackdropPress={() => setPreviewImage(null)}
        style={styles.modal}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={250}
        animationOutTiming={200}
        backdropTransitionInTiming={250}
        backdropTransitionOutTiming={200}
        backdropOpacity={0.88}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          <Image
            source={{ uri: previewImage }}
            style={styles.previewImg}
            resizeMode="contain"
          />
          <View style={styles.dismissPill}>
            <Text style={styles.dismissText}>Tap to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },

  // ── List
  listContent: {
    paddingHorizontal: PADDING,
    paddingBottom: 60,
  },

  // ── Hero
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 20,
    gap: 18,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#E8E8E4",
  },
  avatarRing: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "#C9A96E",
  },
  heroRight: {
    flex: 1,
    gap: 8,
  },
  username: {
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },

  // ── Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  statValue: {
    fontFamily: "Georgia",
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#DDD",
  },

  // ── Button
  messageBtn: {
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: "#1A1A1A",
  },
  messageBtnText: {
    color: "#FAFAF8",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.4,
  },

  // ── Bio
  bioSection: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4DF",
  },
  bio: {
    fontFamily: "Georgia",
    fontSize: 14,
    lineHeight: 22,
    color: "#4A4A45",
    letterSpacing: 0.1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E4E4DF",
  },

  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 4,
    marginRight: GAP,
    marginBottom: GAP,
    backgroundColor: "#E8E8E4",
  },

  emptyText: {
    color: "#BBB",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
    fontFamily: "Georgia",
  },

  modal: {
    margin: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImg: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_WIDTH * 0.92,
    borderRadius: 12,
  },
  dismissPill: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dismissText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    letterSpacing: 0.6,
  },
});

export default PersonProfile;