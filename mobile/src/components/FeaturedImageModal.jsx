import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  PanResponder,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#FF4D6D",
  white: "#FFFFFF",
  dark: "#0A0A0A",
  overlay: "rgba(0, 0, 0, 0.95)",
  textMuted: "rgba(255, 255, 255, 0.6)",
  glassBg: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
};

const FeaturedImageModal = ({
  visible,
  item,
  pandalTitle,
  liked,
  likesCount,
  onLike,
  onClose,
}) => {
  const navigation = useNavigation();

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // ── Swipe-down to dismiss ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.5,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    onLike();
  };

  const navigateToProfile = () => {
    handleClose();
    setTimeout(() => {
      navigation.navigate("PersonProfile", { userId: item?.userId?._id });
    }, 300);
  };

  if (!visible || !item) return null;

  const backdropOpacity = Animated.multiply(
    fadeAnim,
    translateY.interpolate({
      inputRange: [0, 300],
      outputRange: [1, 0.3],
      extrapolate: "clamp",
    })
  );

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateY: Animated.add(slideAnim, translateY) },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          {/* Swipe indicator */}
          <View style={styles.swipeIndicator} />

          {/* Close button */}
          {/* <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={22} color={COLORS.white} />
          </TouchableOpacity> */}
        </View>

        {/* ── User Header ── */}
        <TouchableOpacity
          style={styles.userHeader}
          onPress={navigateToProfile}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.userId?.profileImage?.[0] }}
              style={styles.avatar}
            />
            <View style={styles.avatarGlow} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {item.userId?.username || "Unknown"}
            </Text>
            <Text style={styles.timestamp}>
              {moment(item.createdAt).fromNow()}
            </Text>
          </View>
          <View style={styles.profileArrow}>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        {/* ── Pandal Badge ── */}
        {pandalTitle && (
          <View style={styles.pandalBadge}>
            <Ionicons name="location" size={12} color={COLORS.primary} />
            <Text style={styles.pandalBadgeText}>{pandalTitle}</Text>
          </View>
        )}

        {/* ── Full-Screen Image ── */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.url }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>

        {/* ── Bottom Actions ── */}
        <View style={styles.bottomBar}>
          {/* Caption */}
          {item.caption ? (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText} numberOfLines={3}>
                <Text style={styles.captionUsername}>
                  {item.userId?.username || "User"}{" "}
                </Text>
                {item.caption}
              </Text>
            </View>
          ) : null}

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={28}
                  color={liked ? COLORS.primary : COLORS.white}
                />
              </Animated.View>
              <Text style={[styles.likeCount, liked && styles.likedText]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionSpacer} />

            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.dateText}>
                {moment(item.createdAt).format("MMM D, YYYY")}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 54,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },

  // Top Bar
  topBar: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 12,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: "center",
    alignItems: "center",
  },

  // User Header
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 109, 0.3)",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.glassBg,
    justifyContent: "center",
    alignItems: "center",
  },

  // Pandal Badge
  pandalBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 12,
    backgroundColor: "rgba(255, 77, 109, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 109, 0.25)",
  },
  pandalBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Image
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  fullImage: {
    width: width - 16,
    height: "100%",
    borderRadius: 20,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  captionContainer: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  captionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: "700",
    color: COLORS.white,
  },

  // Actions Row
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.glassBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  likeCount: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  likedText: {
    color: COLORS.primary,
  },
  actionSpacer: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.glassBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
});

export default FeaturedImageModal;
