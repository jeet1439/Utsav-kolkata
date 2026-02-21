import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";

const MemoryCard = ({ item }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes || 0);
  const [views, setViews] = useState(0);

  const heartScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  const navigation = useNavigation();

  useEffect(() => {
    setViews(Math.floor(Math.random() * 50) + 1);

    // Entrance animation
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : prev - 1));

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.4,
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
  };

  const handleNavigate = () => {
    navigation.navigate("PersonProfile", { userId: item.userId._id });
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
      ]}
    >
      {/* Header */}
      <TouchableOpacity onPress={handleNavigate} style={styles.header} activeOpacity={0.8}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: item.userId.profileImage[0] }}
            style={styles.avatar}
          />
          <View style={styles.avatarRing} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.username}>{item.userId.username || "Unknown"}</Text>
          <Text style={styles.timestamp}>{moment(item.createdAt).fromNow()}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#B0A090" style={styles.moreIcon} />
      </TouchableOpacity>

      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.url }}
          style={styles.memoryImage}
          resizeMode="cover"
        />
        <View style={styles.imageGradient} />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#E8614D" : "#7A6A5A"}
            />
          </Animated.View>
          <Text style={[styles.actionCount, liked && styles.likedCount]}>{likes}</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />

        <View style={styles.viewsBadge}>
          <Ionicons name="eye-outline" size={13} color="#B0A090" />
          <Text style={styles.viewsText}>{views}</Text>
        </View>
      </View>

      {/* Caption */}
      <View style={styles.captionArea}>
        <Text style={styles.caption} numberOfLines={3}>
          <Text style={styles.captionUsername}>{item.userId?.username || "User"} </Text>
          {item.caption}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FDFAF6",
    borderRadius: 20,
    marginBottom: 24,
    marginHorizontal: 2,
    shadowColor: "#5C3D2E",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EDE5DA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarRing: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#D4A57A",
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1F14",
    letterSpacing: 0.1,
  },
  timestamp: {
    fontSize: 12,
    color: "#B0A090",
    marginTop: 1,
    letterSpacing: 0.2,
  },
  moreIcon: {
    padding: 4,
  },

  imageWrapper: {
    position: "relative",
  },
  memoryImage: {
    width: "100%",
    height: 300,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "transparent",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },
  actionCount: {
    fontSize: 13,
    color: "#7A6A5A",
    marginLeft: 4,
    fontWeight: "500",
  },
  likedCount: {
    color: "#E8614D",
  },
  spacer: {
    flex: 1,
  },
  viewsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0E8DF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: "#B0A090",
    fontWeight: "600",
    marginLeft: 3,
  },

  captionArea: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  caption: {
    fontSize: 14,
    color: "#3D2B1F",
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  captionUsername: {
    fontWeight: "700",
    color: "#2C1F14",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDE5DA",
    marginHorizontal: 16,
  },
});

export default MemoryCard;