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
  Alert,
  PermissionsAndroid,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "react-native-geolocation-service";
import axios from "axios";
import socket, { SERVER_URL } from '../../store/socketService';
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#FFF8F9",         
  white: "#FFFFFF",
  card: "#FFFFFF",
  primary: "#FF4D6D",  
  primaryLight: "#FFE4E8",
  primaryText: "#E11D48",  
  avatarBg: "#FFEFF3", 
  online: "#22C55E",   
  offline: "#E2E8F0",       
  textDark: "#2B2B2B",     
  textMuted: "#8A7F88",     
  textLight: "#B9AEB5",   
  btnSecondary: "#FFEFF3", 
  border: "#FFE4E8",       
};

const formatDistance = (dist) => {
  if (dist === undefined || dist === null) return "Unknown";
  if (dist < 1) return `${Math.round(dist * 1000)}m away`;
  return `${dist.toFixed(1)}km away`;
};

const fallbackBios = [
  "Exploring the local coffee scene! ☕ Always down for a chat about design.",
  "New in town! Looking for hiking buddies for the weekend. ⛰️",
  "Digital artist & dog lover. ?",
];

const OnlineToggle = ({ isOnline, onToggle }) => {
  const anim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: isOnline ? 1 : 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
  }, [isOnline]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  const trackBg = anim.interpolate({ inputRange: [0, 1], outputRange: ["#E2E8F0", "#DCFCE7"] });
  const trackBdr = anim.interpolate({ inputRange: [0, 1], outputRange: [C.offline, C.online] });
  const thumbBg = anim.interpolate({ inputRange: [0, 1], outputRange: [C.offline, C.online] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
      <View style={togS.row}>
        <Animated.View style={[togS.track, { backgroundColor: trackBg, borderColor: trackBdr }]}>
          <Animated.View style={[togS.thumb, { transform: [{ translateX }], backgroundColor: thumbBg }]} />
        </Animated.View>
        <Text style={[togS.label, { color: isOnline ? C.online : C.textLight }]}>
          {isOnline ? "Online" : "Offline"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const togS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { width: 44, height: 24, borderRadius: 12, borderWidth: 1.5, justifyContent: "center" },
  thumb: { width: 14, height: 14, borderRadius: 7 },
  label: { fontSize: 12, fontWeight: "600" },
});

const PartnerCard = ({ item, index, onConnect, onMessage, navigation }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const bio = item.bio || fallbackBios[index % fallbackBios.length];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay: index * 50, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay: index * 50, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => navigation.navigate("PersonProfile", { userId: item._id })}
    >
      <View style={cardS.card}>
        <View style={cardS.topRow}>
          <View style={cardS.avatarWrap}>
            {item.avatar ? (
              <Image
                resizeMode="cover"
                source={{ uri: item.avatar }} style={cardS.avatar} />
            ) : (
              <View style={[cardS.avatar, cardS.avatarFallback]}>
                <Text style={cardS.initial}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[cardS.statusDot, { backgroundColor: item.isOnline ? C.online : C.offline }]} />
          </View>

          {/* User Info */}
          <View style={cardS.infoWrap}>
            <View style={cardS.nameRow}>
              <Text style={cardS.name} numberOfLines={1}>{item.name}</Text>
              <Text style={cardS.dist}>{formatDistance(item.distance)}</Text>
            </View>
            <Text style={cardS.bio} numberOfLines={2}>"{bio}"</Text>
          </View>
        </View>

        {/* Bottom Section: Actions */}
        <View style={cardS.actionRow}>
          <TouchableOpacity style={cardS.msgBtn} activeOpacity={0.8} onPress={() => onMessage(item)}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color={C.white} />
            <Text style={cardS.msgText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={cardS.addBtn}
            activeOpacity={0.7}
            onPress={() => onConnect(item)}
          >
            <Ionicons name="person-add-outline" size={18} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const cardS = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.avatarBg,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    backgroundColor: "#FDBA74",
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    fontSize: 22,
    fontWeight: "700",
    color: C.white,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.white,
  },
  infoWrap: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textDark,
    flex: 1,
  },
  dist: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
  },
  bio: {
    fontSize: 13.5,
    color: C.textMuted,
    fontStyle: "italic",
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  msgBtn: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  msgText: {
    color: C.white,
    fontWeight: "600",
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: C.btnSecondary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

// ── Main Screen ────────────────────────────────────────────────────
const FindPartners = ( { navigation }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const spinVal = useRef(new Animated.Value(0)).current;
  const locationIntervalRef = useRef(null);


  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Update location immediately when coming online
      if (location) updateLocation(location);

      locationIntervalRef.current = setInterval(async () => {
        Geolocation.getCurrentPosition(
          async (position) => {
            const coords = position.coords;
            setLocation(coords);
            await updateLocation(coords);
            // console.log("loation refreshed")
          },
          (error) => console.log("Interval location error:", error.message),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }, 3 * 60 * 1000);
    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [isOnline]);


  const init = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (userId) socket.emit("userOnline", userId);
    getLocation();
  };

  const getLocation = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission required", "Location permission needed");
          return;
        }
      }
      Geolocation.getCurrentPosition(
        async (position) => {
          const coords = position.coords;
          setLocation(coords);
          await updateLocation(coords);
          fetchPartners(coords);
        },
        (error) => Alert.alert("Location Error", error.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) { console.log(err); }
  };

  const updateLocation = async (coords) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      await axios.post(`${SERVER_URL}/api/user/update-location`, {
        userId, latitude: coords.latitude, longitude: coords.longitude,
      });
    } catch (e) { console.log(e); }
  };

  const fetchPartners = async (coords) => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const res = await axios.post(`${SERVER_URL}/api/user/nearby-online`, {
        userId, latitude: coords.latitude, longitude: coords.longitude,
      });
      // demo purposes 
      setPartners(res.data.length ? res.data : [
        { _id: '1', name: 'Sarah Jenkins', distance: 0.5, isOnline: true },
        { _id: '2', name: 'Marcus Chen', distance: 1.2, isOnline: false },
        { _id: '3', name: 'Elena Rodriguez', distance: 0.8, isOnline: true }
      ]);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleRefresh = () => {
    if (!location) return;
    spinVal.setValue(0);
    Animated.timing(spinVal, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    fetchPartners(location);
  };


  const handleToggleOnline = async () => {

    const userId = await AsyncStorage.getItem("userId");

    if (!userId) return;

    const next = !isOnline;

    setIsOnline(next);

    if (next) {
      socket.emit("userOnline", userId);
    } else {
      socket.emit("userOffline", userId);
    }

  };

  const handleConnect = (user) => {
    Alert.alert("Request Sent", `Connection request sent to ${user.name}`, [{ text: "Great!" }]);
  };

  const handleMessage = async (user) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(`${SERVER_URL}/api/chat/room`, 
        { otherUserId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate('ChatRoom', {
        chatRoomId: res.data._id,
        chatName: user.name,
        otherUserId: user._id,
        otherAvatar: user.avatar,
      });
    } catch (error) {
      console.log('Error creating chat room:', error);
      Alert.alert('Error', 'Could not open chat. Please try again.');
    }
  };

  const spin = spinVal.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <SafeAreaView style={S.root}>
       <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={S.utilityBar}>
        <Text style={S.sectionHeader}>Nearby People</Text>
        <TouchableOpacity style={S.refreshBtn} onPress={handleRefresh}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh" size={18} color={C.textMuted} />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <View style={S.header}>
        <Text style={S.headerTitle}>
          DISCOVER {partners.length >= 50 ? "50+" : partners.length} PEOPLE
        </Text>
        <View style={S.badge}>
          <OnlineToggle isOnline={isOnline} onToggle={handleToggleOnline} />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={S.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.loadingLabel}>Finding people nearby...</Text>
        </View>
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(item) => item._id}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <PartnerCard item={item} index={index} onConnect={handleConnect} onMessage={handleMessage} navigation={navigation} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
  },
  utilityBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: C.primaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: "500",
  },
});

export default FindPartners;