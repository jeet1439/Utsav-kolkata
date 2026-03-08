// Splash.jsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: "#8B3DFF",
  gold: "#9B6FD4",
  surface: "#FAF8FF",
  surfaceAlt: "#F0EBFF",
  text: "#1E1035",
  textMuted: "#7E6A9E",
  white: "#FFFFFF",
};

const LoadingDot = ({ index }) => {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
        Animated.delay((2 - index) * 200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { opacity: anim }]} />
  );
};

const Splash = ({ navigation }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();

    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setTimeout(() => {
        navigation.replace(token ? 'Main' : 'Login', token ? { screen: 'Home' } : undefined);
      }, 2800);
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>উৎসব</Text>
        </View>

        <Text style={styles.appName}>Utsav Kolkata</Text>
        <Text style={styles.tagline}>Discover the joy of Durga Puja</Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerStar}>✦</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => <LoadingDot key={i} index={i} />)}
        </View>
      </Animated.View>

      <Animated.Text style={[styles.mantra, { opacity: fadeAnim }]}>
        জয় মা দুর্গা
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },

  logoMark: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    fontSize: 28,
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8D8C8',
  },
  dividerStar: {
    color: COLORS.gold,
    fontSize: 12,
    marginHorizontal: 10,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  mantra: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});

export default Splash;