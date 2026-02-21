import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../store/userStore.js';
import CustomModal from '../../components/CustomModal.jsx';

const { width, height } = Dimensions.get('window');

// ─── Decorative SVG-style ornament using Views ─────────────────────────────
const DiamondDivider = () => (
  <View style={ornamentStyles.row}>
    <View style={ornamentStyles.line} />
    <View style={ornamentStyles.diamond} />
    <View style={ornamentStyles.line} />
  </View>
);

const ornamentStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.5)',
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: '#D4AF37',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 10,
  },
});

// ─── Floating particle dots ─────────────────────────────────────────────────
const Particle = ({ delay, x, size }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.8, -50],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.7, 0.7, 0],
  });

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
        transform: [{ translateY }],
      }}
    />
  );
};

const particles = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  delay: i * 600,
  x: Math.random() * width,
  size: 3 + Math.random() * 5,
}));

// ─── Animated Input ─────────────────────────────────────────────────────────
const AnimatedInput = ({ label, icon, ...props }) => {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.spring(focusAnim, { toValue: 1, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.spring(focusAnim, { toValue: 0, useNativeDriver: false }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(212,175,55,0.3)', 'rgba(212,175,55,1)'],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.11)'],
  });

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View
        style={[
          inputStyles.container,
          { borderColor, backgroundColor: bgColor },
        ]}
      >
        <Text style={inputStyles.icon}>{icon}</Text>
        <TextInput
          style={inputStyles.input}
          placeholderTextColor="rgba(212,175,55,0.4)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(212,175,55,0.8)',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  icon: { fontSize: 18, marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF8F0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});

// ─── Main Login Screen ───────────────────────────────────────────────────────
const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');

  // Entry animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showModal = (type, msg) => {
    setModalType(type);
    setModalMessage(msg);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('warning', 'All fields are required');
      return;
    }
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      setLoading(true);
      const res = await fetch('http://192.168.0.100:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userId', data.user._id);
        setUser(data.user);
        showModal('success', 'Welcome back! 🎉');
        setTimeout(() => {
          navigation.replace('Main', { screen: 'Profile' });
        }, 3000);
      } else {
        showModal('error', data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      showModal('error', 'Network error. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Deep background gradient */}
      <LinearGradient
        colors={['#1A0A00', '#2D0E0E', '#1A0020']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glow orbs */}
      <View style={styles.glowOrange} />
      <View style={styles.glowPurple} />

      {/* Floating gold particles */}
      {particles.map((p) => (
        <Particle key={p.id} delay={p.delay} x={p.x} size={p.size} />
      ))}

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: headerAnim,
                  transform: [
                    {
                      translateY: headerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Top ornament */}
              <Text style={styles.topOrnament}>✦ ✦ ✦</Text>

              {/* Bengali / Devanagari-inspired stylistic header */}
              <Text style={styles.appTagline}>আনন্দময়ী</Text>
              <Text style={styles.appName}>UTSAV KOLKATA</Text>
              <Text style={styles.appSub}>Discover the joy of Durga Puja</Text>

              <DiamondDivider />
            </Animated.View>

            {/* ── Card ── */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Card inner border glow */}
              <LinearGradient
                colors={['rgba(212,175,55,0.35)', 'rgba(180,50,50,0.15)', 'rgba(212,175,55,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGlow}
              />

              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Sign in to your account</Text>

              <View style={{ marginTop: 24 }}>
                <AnimatedInput
                  label="Email Address"
                  icon="✉️"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <AnimatedInput
                  label="Password"
                  icon="🔒"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#C0392B', '#8B0000', '#6D1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    {/* Gold top border shimmer */}
                    <View style={styles.buttonTopShimmer} />
                    {loading ? (
                      <ActivityIndicator color="#D4AF37" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>LOGIN  →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <DiamondDivider />

              {/* Register link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.registerWrapper}
              >
                <Text style={styles.registerText}>
                  New to the pandal?{'  '}
                  <Text style={styles.registerHighlight}>Create Account</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom copy */}
            <Text style={styles.bottomText}>✦  Celebrate the spirit of Kolkata  ✦</Text>
          </ScrollView>

          <CustomModal
            visible={modalVisible}
            type={modalType}
            message={modalMessage}
            onClose={() => setModalVisible(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Glow blobs
  glowOrange: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(180, 60, 20, 0.25)',
    top: -60,
    right: -80,
  },
  glowPurple: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(100, 20, 120, 0.2)',
    bottom: 80,
    left: -60,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 20,
  },
  topOrnament: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 8,
    marginBottom: 14,
    opacity: 0.8,
  },
  appTagline: {
    fontSize: 22,
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 3,
    opacity: 0.9,
    marginBottom: 6,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 5,
    color: '#FFF8F0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(212,175,55,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  appSub: {
    fontSize: 13,
    color: 'rgba(255,248,240,0.55)',
    letterSpacing: 1.5,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Card
  card: {
    borderRadius: 24,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    overflow: 'hidden',
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF8F0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,248,240,0.45)',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Forgot
  forgotWrapper: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -6 },
  forgotText: {
    fontSize: 13,
    color: '#D4AF37',
    textDecorationLine: 'underline',
    opacity: 0.8,
  },

  // Button
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  buttonTopShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.7)',
  },
  buttonText: {
    color: '#FFF8F0',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Register
  registerWrapper: { alignItems: 'center', paddingTop: 4 },
  registerText: {
    fontSize: 14,
    color: 'rgba(255,248,240,0.5)',
    textAlign: 'center',
  },
  registerHighlight: {
    color: '#D4AF37',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Bottom
  bottomText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(212,175,55,0.4)',
    letterSpacing: 2,
    marginTop: 32,
  },
});

export default Login;