// screens/Home/FindPartners.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
  PermissionsAndroid,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "react-native-geolocation-service";

const { width } = Dimensions.get("window");

// ─── Color Palette ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#C8392B",
  primaryLight: "#E8594A",
  gold: "#D4A843",
  dark: "#1A1210",
  surface: "#FDFAF7",
  surfaceAlt: "#F5EFE8",
  text: "#2C1810",
  textMuted: "#9E7B6B",
  white: "#FFFFFF",
  cardBg: "#FFFCF9",
  border: "rgba(212,168,67,0.15)",
  online: "#27AE60",
};

// ─── Filter Pills ──────────────────────────────────────────────────────────────
const FILTERS = ["All", "< 1 km", "< 3 km", "< 5 km"];

// ─── Partner Card ──────────────────────────────────────────────────────────────
const PartnerCard = ({ item, index, onConnect }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.card}>
        {/* Avatar + Online dot */}
        <View style={styles.avatarWrapper}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="walk-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.cardMetaText}>{item.distance?.toFixed(1)} km away</Text>
          </View>
          {item.interestedPandals?.length > 0 && (
            <View style={styles.tagRow}>
              {item.interestedPandals.slice(0, 2).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Connect button */}
        <TouchableOpacity style={styles.connectBtn} onPress={() => onConnect(item)} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const FindPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [token, setToken] = useState(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    AsyncStorage.getItem("token").then(setToken);
    getLocation();
  }, []);

  useEffect(() => {
    if (location && token) fetchPartners();
  }, [location, token]);

  const getLocation = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        { title: "Location", message: "Find people exploring nearby pandals", buttonPositive: "OK" }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
    }
    Geolocation.getCurrentPosition(
      (pos) => setLocation(pos.coords),
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchPartners = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.0.100:3000/api/users/nearby?latitude=${location.latitude}&longitude=${location.longitude}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPartners(data);
    } catch (err) {
      console.error("Error fetching partners:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPartners();
  };

  const handleConnect = (user) => {
    Alert.alert("Request Sent!", `A connection request has been sent to ${user.name}.`);
  };

  const filterRange = (list) => {
    if (activeFilter === "All") return list;
    const limit = activeFilter === "< 1 km" ? 1 : activeFilter === "< 3 km" ? 3 : 5;
    return list.filter((p) => p.distance <= limit);
  };

  const filtered = filterRange(partners);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Find Partners</Text>
          <Text style={styles.headerSubtitle}>Connect with fellow pandal-hoppers</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Stats Banner ── */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{partners.length}</Text>
          <Text style={styles.statLabel}>Nearby</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{partners.filter((p) => p.isOnline).length}</Text>
          <Text style={styles.statLabel}>Online Now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{partners.filter((p) => p.distance <= 1).length}</Text>
          <Text style={styles.statLabel}>Within 1 km</Text>
        </View>
      </View>

      {/* ── Filter Pills ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Finding people near you…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          renderItem={({ item, index }) => (
            <PartnerCard item={item} index={index} onConnect={handleConnect} />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={34} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No one nearby yet</Text>
              <Text style={styles.emptySubtitle}>
                As more people join Utsav Kolkata, you'll see fellow explorers here.
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Text style={styles.retryBtnText}>Search Again</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 54,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(200,57,43,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats Banner
  statsBanner: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    backgroundColor: "rgba(200,57,43,0.08)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
  },
  connectBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  // Loading
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(200,57,43,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
});

export default FindPartners;