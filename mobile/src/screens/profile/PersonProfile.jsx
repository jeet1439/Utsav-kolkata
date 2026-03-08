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
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const StatPill = ({ value, label, onPress }) => (
  <TouchableOpacity
    style={styles.statPill}
    activeOpacity={onPress ? 0.65 : 1}
    onPress={onPress}
    disabled={!onPress}
  >
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const PersonProfile = () => {
  const route = useRoute();
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const followScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log(token)
        const res = await fetch(`http://192.168.0.100:3000/api/user/getuser/${userId}`);
        const data = await res.json();
        setUser(data);
        setFollowerCount(data?.followers.length);
        setFollowingCount(data?.followings.length);
        const followRes = await fetch(
          `http://192.168.0.100:3000/api/user/is-following/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const followData = await followRes.json();
        setIsFollowing(followData.isFollowing);


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

  const handleFollow = async () => {
    try {

      Animated.sequence([
        Animated.spring(followScale, {
          toValue: 0.91,
          useNativeDriver: true,
          speed: 40,
        }),
        Animated.spring(followScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
        }),
      ]).start();

      const endpoint = isFollowing ? "unfollow" : "follow";

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(
        `http://192.168.0.100:3000/api/user/${endpoint}/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setIsFollowing(!isFollowing);

        setFollowerCount((prev) =>
          isFollowing ? prev - 1 : prev + 1
        );
      }

    } catch (error) {
      console.log("Follow error", error);
    }
  };

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

            {/* ── Avatar ── */}
            <View style={styles.heroSection}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: user?.profileImage?.[0] }}
                  style={styles.avatar}
                />
                <View style={styles.avatarRing} />
              </View>

              {/* ── Stats Row ── */}
              <View style={styles.statsBlock}>
                <StatPill value={user?.featuredImages?.length ?? 0} label="photos" />
                <View style={styles.statDivider} />
                <StatPill value={followerCount} label="followers" />
                <View style={styles.statDivider} />
                <StatPill value={followingCount} label="following" />
              </View>
            </View>

            {/* ── Name + Bio ── */}
            <View style={styles.infoSection}>
              <Text style={styles.username} numberOfLines={1}>
                {user?.username ?? "—"}
              </Text>
              {user?.bio?.trim() ? (
                <Text style={styles.bio}>{user.bio.trim()}</Text>
              ) : (
                <Text style={[styles.bio, { color: "#BBB" }]}>No bio yet.</Text>
              )}
            </View>

            {/* ── Action Buttons ── */}
            <View style={styles.actionsRow}>
              <Animated.View style={[{ flex: 1 }, { transform: [{ scale: followScale }] }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, isFollowing ? styles.followingBtn : styles.followBtn]}
                  onPress={handleFollow}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.actionBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={[styles.actionBtn, styles.messageBtn]}
                activeOpacity={0.82}
              >
                <Text style={[styles.actionBtnText, styles.messageBtnText]}>Message</Text>
              </TouchableOpacity>
            </View>

            {/* ── Section Header ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.sectionLine} />
            </View>
          </Animated.View>
        }
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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

  listContent: {
    paddingHorizontal: PADDING,
    paddingBottom: 60,
  },

  // ── Hero
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 18,
    gap: 18,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 41,
    backgroundColor: "#E8E8E4",
  },
  avatarRing: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 82,
    height: 82,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "#C9A96E",
  },

  // ── Stats
  statsBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: "Georgia",
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    letterSpacing: 0.2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: "#DDD",
  },

  // ── Info
  infoSection: {
    marginBottom: 16,
    gap: 5,
  },
  username: {
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  bio: {
    fontFamily: "Georgia",
    fontSize: 14,
    lineHeight: 21,
    color: "#4A4A45",
    letterSpacing: 0.1,
  },

  // ── Actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtn: {
    backgroundColor: "#8B3DFF",
  },
  followingBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#DDDDD8",
  },
  messageBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#DDDDD8",
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: "#FAFAF8",
  },
  followingBtnText: {
    color: "#4A4A45",
  },
  messageBtnText: {
    color: "#1A1A1A",
  },

  // ── Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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

  // ── Grid
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

  // ── Modal
  modal: { margin: 0 },
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