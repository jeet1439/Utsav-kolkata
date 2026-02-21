import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Image,
  FlatList,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { LeafletView } from 'react-native-leaflet-view';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#C8392B',       // deep sindoor red
  primaryLight: '#E8594A',
  gold: '#D4A843',
  goldLight: '#F0C85A',
  dark: '#1A1210',
  surface: '#FDFAF7',
  surfaceAlt: '#F5EFE8',
  text: '#2C1810',
  textMuted: '#9E7B6B',
  white: '#FFFFFF',
  cardBg: '#FFFCF9',
  shadow: 'rgba(200, 57, 43, 0.15)',
};

// ─── Pandal Card ──────────────────────────────────────────────────────────────
const PandalCard = ({ item, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
        <Image source={{ uri: item.pictures[0] }} style={styles.cardImage} />
        {/* Distance Badge */}
        <View style={styles.distanceBadge}>
          <Ionicons name="walk-outline" size={10} color={COLORS.white} />
          <Text style={styles.distanceBadgeText}>{item.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={11} color={COLORS.primary} />
            <Text style={styles.cardLocation} numberOfLines={1}>{item.address || 'Kolkata'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Home Screen ──────────────────────────────────────────────────────────────
const Home = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearestPandle, setNearestPandle] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for locate button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    };
    loadToken();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Utsav needs your location to find nearby pandals',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const getLocation = async () => {
    setLocating(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Cannot access location');
      setLocating(false);
      return;
    }
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLocating(false);
      },
      (error) => {
        Alert.alert('Error', 'Failed to get location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchNearestPandleData = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.0.100:3000/api/pandals/nearest?latitude=${location.latitude}&longitude=${location.longitude}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setNearestPandle(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location && token) fetchNearestPandleData();
  }, [location, token]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Map Section ── */}
      <View style={styles.mapSection}>
        {location ? (
          <LeafletView
            mapCenterPosition={{ lat: location.latitude, lng: location.longitude }}
            zoom={15}
            mapMarkers={[
              {
                id: 'currentLocation',
                position: { lat: location.latitude, lng: location.longitude },
                icon: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                size: [36, 36],
              },
              ...(nearestPandle?.map((pandal, i) => ({
                id: `pandal-${i}`,
                position: {
                  lat: pandal.location.coordinates[1],
                  lng: pandal.location.coordinates[0],
                },
                icon: 'https://res.cloudinary.com/dzwismxgx/image/upload/v1758135594/location_ukspja.png',
                size: [32, 32],
              })) || []),
            ]}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator color={COLORS.white} size="large" />
            <Text style={styles.mapPlaceholderText}>Finding your location…</Text>
          </View>
        )}

        {/* Gradient overlay at bottom of map */}
        <View style={styles.mapGradient} pointerEvents="none" />

        {/* Locate Me FAB */}
        <TouchableOpacity style={styles.locateFab} onPress={getLocation} activeOpacity={0.85}>
          <Animated.View style={{ transform: [{ scale: locating ? pulseAnim : 1 }] }}>
            {locating ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Ionicons name="navigate" size={22} color={COLORS.white} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet ── */}
      <View style={styles.sheet}>
        {/* Sheet Handle */}
        <View style={styles.sheetHandle} />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.accentDot} />
            <Text style={styles.sectionTitle}>Nearest Pandals</Text>
          </View>
          {nearestPandle?.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{nearestPandle.length} found</Text>
            </View>
          )}
        </View>

        {/* Cards List */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Searching nearby pandals…</Text>
          </View>
        ) : nearestPandle && nearestPandle.length > 0 ? (
          <FlatList
            data={nearestPandle}
            keyExtractor={(item) => item._id}
            numColumns={2}
            key="two-columns"
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <PandalCard
                item={item}
                index={index}
                onPress={() => navigation.navigate('PandalDetails', { item })}
              />
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No pandals found nearby</Text>
            <Text style={styles.emptySubtitle}>Try refreshing your location or expanding search area</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={getLocation}>
              <Text style={styles.retryBtnText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // Map
  mapSection: {
    flex: 1.1,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mapPlaceholderText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
    // Simulate gradient with a faint overlay
    borderBottomWidth: 0,
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(26,18,16,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMarkText: {
    fontSize: 18,
    color: COLORS.dark,
    fontWeight: '800',
  },
  appName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  appTagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '400',
  },

  // Locate FAB
  locateFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Bottom Sheet
  sheet: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -22,
    paddingTop: 10,
    elevation: 20,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 14,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentDot: {
    width: 6,
    height: 20,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  countPill: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,57,43,0.15)',
  },
  countText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // List
  row: {
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.1)',
  },
  cardImage: {
    width: '100%',
    height: 115,
    backgroundColor: COLORS.surfaceAlt,
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  distanceBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Loading State
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 40,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(200,57,43,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default Home;