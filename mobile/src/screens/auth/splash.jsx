// Splash.jsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

// ─── Floating Particle ───────────────────────────────────────────────────────
const Particle = ({ delay, x, size, duration }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height + 20, -60] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 0.5] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#D4AF37',
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
};

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  delay: i * 400,
  x: Math.random() * width,
  size: 2 + Math.random() * 6,
  duration: 3500 + Math.random() * 2500,
}));

// ─── Ornate ring decoration ──────────────────────────────────────────────────
const OrnateRing = ({ size, borderColor, opacity, rotate }) => (
  <View
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1,
      borderColor,
      opacity,
      transform: [{ rotate }],
      borderStyle: 'dashed',
    }}
  />
);

// ─── Main Splash Screen ──────────────────────────────────────────────────────
const Splash = ({ navigation }) => {
  // Animation refs
  const bgAnim      = useRef(new Animated.Value(0)).current;
  const ringAnim    = useRef(new Animated.Value(0)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const dotAnim     = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const ringRotate  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered reveal sequence
    Animated.sequence([
      // BG fade in
      Animated.timing(bgAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      // Rings expand
      Animated.spring(ringAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      // Title slides up
      Animated.spring(titleAnim, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
      // Tagline
      Animated.timing(taglineAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Dots loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 3, duration: 900, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();

    // Gold shimmer sweep
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2400, useNativeDriver: true })
    ).start();

    // Slow ring rotation
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 12000, useNativeDriver: true })
    ).start();

    // Auth check
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setTimeout(() => {
        if (token) {
          navigation.replace('Main', { screen: 'Home' });
        } else {
          navigation.replace('Login');
        }
      }, 4000);
    };
    checkAuth();
  }, []);

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const titleTranslateY = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  const ringDeg = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root}>
      {/* Deep background */}
      <LinearGradient
        colors={['#0D0408', '#1A0A00', '#120010', '#0D0408']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow spots */}
      <Animated.View style={[styles.glowRed, { opacity: bgAnim }]} />
      <Animated.View style={[styles.glowGold, { opacity: bgAnim }]} />
      <Animated.View style={[styles.glowPurple, { opacity: bgAnim }]} />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <Particle key={p.id} delay={p.delay} x={p.x} size={p.size} duration={p.duration} />
      ))}

      {/* Ornate rings */}
      <Animated.View
        style={[
          styles.ringsContainer,
          { opacity: ringAnim, transform: [{ scale: ringScale }, { rotate: ringDeg }] },
        ]}
      >
        <OrnateRing size={260} borderColor="rgba(212,175,55,0.35)" opacity={1} rotate="0deg" />
        <OrnateRing size={220} borderColor="rgba(192,57,43,0.4)" opacity={1} rotate="15deg" />
        <OrnateRing size={180} borderColor="rgba(212,175,55,0.25)" opacity={1} rotate="30deg" />
      </Animated.View>

      {/* Solid inner circle */}
      <Animated.View style={[styles.innerCircle, { opacity: ringAnim, transform: [{ scale: ringScale }] }]}>
        <LinearGradient
          colors={['rgba(212,175,55,0.15)', 'rgba(180,30,30,0.1)', 'rgba(100,10,100,0.1)']}
          style={StyleSheet.absoluteFillObject}
          borderRadius={110}
        />
      </Animated.View>

      {/* App name */}
      <Animated.View
        style={{
          opacity: titleAnim,
          transform: [{ translateY: titleTranslateY }],
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Bengali subtitle */}
        <Text style={styles.bengali}>উৎসব কলকাতা</Text>

        {/* Main title with shimmer */}
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>UTSAV</Text>
          <Animated.View
            style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
          />
        </View>
        <Text style={styles.titleSub}>KOLKATA</Text>

        {/* Ornament row */}
        <View style={styles.ornamentRow}>
          <View style={styles.ornamentLine} />
          <Text style={styles.ornamentStar}>✦</Text>
          <View style={styles.ornamentLine} />
        </View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
          Discover the Pandals · Celebrate the Spirit
        </Animated.Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.loadingContainer, { opacity: taglineAnim }]}>
        {[0, 1, 2].map((i) => (
          <LoadingDot key={i} index={i} dotAnim={dotAnim} />
        ))}
      </Animated.View>

      {/* Bottom mantra */}
      <Animated.Text style={[styles.mantra, { opacity: taglineAnim }]}>
        ✦  জয় মা দুর্গা  ✦
      </Animated.Text>
    </View>
  );
};

// ─── Individual loading dot ──────────────────────────────────────────────────
const LoadingDot = ({ index, dotAnim }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 220),
        Animated.timing(scaleAnim, { toValue: 1.4, duration: 350, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.5, duration: 350, useNativeDriver: true }),
        Animated.delay((2 - index) * 220),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ scale: scaleAnim }] }]}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow blobs
  glowRed: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(160, 40, 20, 0.28)',
    top: -60,
    right: -80,
  },
  glowGold: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212,175,55,0.1)',
    top: '35%',
    left: '20%',
  },
  glowPurple: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(80, 10, 110, 0.25)',
    bottom: -40,
    left: -70,
  },

  // Rings
  ringsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 260,
  },

  // Inner circle
  innerCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },

  // Bengali text
  bengali: {
    fontSize: 16,
    color: 'rgba(212,175,55,0.75)',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },

  // Title
  titleWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    fontSize: 58,
    fontWeight: '900',
    color: '#FFF8F0',
    letterSpacing: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(212,175,55,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ skewX: '-20deg' }],
  },
  titleSub: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: -4,
    textShadowColor: 'rgba(212,175,55,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Ornament
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
    marginVertical: 14,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.4)',
  },
  ornamentStar: {
    color: '#D4AF37',
    fontSize: 12,
    marginHorizontal: 10,
  },

  // Tagline
  tagline: {
    fontSize: 12,
    color: 'rgba(255,248,240,0.45)',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },

  // Bottom mantra
  mantra: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    color: 'rgba(212,175,55,0.45)',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});

export default Splash;