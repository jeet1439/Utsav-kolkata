// Register.jsx
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useUserStore } from '../../store/userStore.js';
import CustomModal from '../../components/CustomModal.jsx';

const { width, height } = Dimensions.get('window');

// ─── Decorative Diamond Divider ─────────────────────────────────────────────
const DiamondDivider = () => (
  <View style={ornamentStyles.row}>
    <View style={ornamentStyles.line} />
    <View style={ornamentStyles.diamond} />
    <View style={ornamentStyles.line} />
  </View>
);

const ornamentStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.5)' },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: '#D4AF37',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 10,
  },
});

// ─── Floating Particles ──────────────────────────────────────────────────────
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
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.9, -50] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.7, 0.7, 0] });

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

// ─── Step Indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ current, total }) => (
  <View style={stepStyles.container}>
    {Array.from({ length: total }, (_, i) => (
      <View
        key={i}
        style={[
          stepStyles.dot,
          i < current ? stepStyles.completed : i === current - 1 ? stepStyles.active : stepStyles.inactive,
        ]}
      />
    ))}
  </View>
);

const stepStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  dot: { height: 4, borderRadius: 2 },
  active: { width: 24, backgroundColor: '#D4AF37' },
  completed: { width: 16, backgroundColor: 'rgba(212,175,55,0.6)' },
  inactive: { width: 16, backgroundColor: 'rgba(255,255,255,0.15)' },
});

// ─── Animated Input ──────────────────────────────────────────────────────────
const AnimatedInput = ({ label, icon, error, ...props }) => {
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
    outputRange: [
      error ? 'rgba(220,60,60,0.8)' : 'rgba(212,175,55,0.3)',
      error ? 'rgba(220,60,60,1)' : 'rgba(212,175,55,1)',
    ],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.11)'],
  });

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[inputStyles.container, { borderColor, backgroundColor: bgColor }]}>
        <Text style={inputStyles.icon}>{icon}</Text>
        <TextInput
          style={inputStyles.input}
          placeholderTextColor="rgba(212,175,55,0.4)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={inputStyles.error}>{error}</Text> : null}
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
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
  error: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});

// ─── Strength Bar ────────────────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, label: 'Too short', color: '#E74C3C' };
    if (password.length < 8) return { level: 2, label: 'Weak', color: '#E67E22' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { level: 4, label: 'Strong', color: '#27AE60' };
    return { level: 3, label: 'Medium', color: '#F1C40F' };
  };

  const { level, label, color } = getStrength();

  return password ? (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i <= level ? color : 'rgba(255,255,255,0.1)' },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color }]}>{label}</Text>
    </View>
  ) : null;
};

const strengthStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 14, paddingHorizontal: 4 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginLeft: 10 },
});

// ─── Main Register Screen ────────────────────────────────────────────────────
const Register = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { setUser } = useUserStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const showModal = (type, msg) => {
    setModalType(type);
    setModalMessage(msg);
    setModalVisible(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required';
    else if (username.length < 3) newErrors.username = 'At least 3 characters';
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      setLoading(true);
      const res = await fetch('http://192.168.0.101:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userId', data.user._id);
        setUser(data.user);
        showModal('success', 'Welcome to Utsav Kolkata! 🎉');
        setTimeout(() => {
          navigation.replace('Main', { screen: 'Home' });
        }, 3000);
      } else {
        showModal('error', data.message || 'Something went wrong');
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      showModal('error', 'Network error. Please try again.');
    }
  };

  // Count filled fields for step indicator
  const filledCount = [username, email, password].filter(Boolean).length;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A0A00', '#2D0E0E', '#1A0020']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glow blobs */}
      <View style={styles.glowOrange} />
      <View style={styles.glowPurple} />
      <View style={styles.glowGold} />

      {/* Particles */}
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
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

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
              <Text style={styles.topOrnament}>✦ ✦ ✦</Text>
              <Text style={styles.appTagline}>নতুন শুরু</Text>
              <Text style={styles.appName}>JOIN THE PUJA</Text>
              <Text style={styles.appSub}>Begin your Utsav journey</Text>
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
              <LinearGradient
                colors={['rgba(212,175,55,0.25)', 'rgba(180,50,50,0.1)', 'rgba(212,175,55,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGlow}
              />

              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Join thousands celebrating Kolkata</Text>

              {/* Progress indicator */}
              <StepIndicator current={filledCount} total={3} />

              <AnimatedInput
                label="Username"
                icon="👤"
                placeholder="your_puja_name"
                value={username}
                onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: '' })); }}
                autoCapitalize="none"
                error={errors.username}
              />

              <AnimatedInput
                label="Email Address"
                icon="✉️"
                placeholder="you@example.com"
                keyboardType="email-address"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
                autoCapitalize="none"
                error={errors.email}
              />

              <AnimatedInput
                label="Password"
                icon="🔒"
                placeholder="Min. 6 characters"
                secureTextEntry
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
                error={errors.password}
              />
              <PasswordStrength password={password} />

              {/* Terms note */}
              <Text style={styles.terms}>
                By registering, you agree to our{' '}
                <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
              </Text>

              {/* Sign Up Button */}
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#C0392B', '#8B0000', '#6D1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    <View style={styles.buttonTopShimmer} />
                    {loading ? (
                      <ActivityIndicator color="#D4AF37" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>CREATE ACCOUNT  →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <DiamondDivider />

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginWrapper}
              >
                <Text style={styles.loginText}>
                  Already celebrating?{'  '}
                  <Text style={styles.loginHighlight}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.bottomText}>✦  Jai Maa Durga  ✦</Text>
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
    backgroundColor: 'rgba(180, 60, 20, 0.22)',
    top: -60,
    left: -80,
  },
  glowPurple: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(100, 20, 120, 0.18)',
    bottom: 80,
    right: -60,
  },
  glowGold: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(212,175,55,0.08)',
    top: '40%',
    left: '30%',
  },

  // Back button
  backButton: { marginBottom: 10, paddingTop: 4 },
  backButtonText: {
    color: 'rgba(212,175,55,0.7)',
    fontSize: 14,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  topOrnament: { fontSize: 12, color: '#D4AF37', letterSpacing: 8, marginBottom: 14, opacity: 0.8 },
  appTagline: {
    fontSize: 22,
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 3,
    opacity: 0.9,
    marginBottom: 6,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
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
  cardGlow: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
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
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // Terms
  terms: {
    fontSize: 12,
    color: 'rgba(255,248,240,0.35)',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  termsLink: { color: '#D4AF37', textDecorationLine: 'underline' },

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
    fontSize: 14,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Login link
  loginWrapper: { alignItems: 'center', paddingTop: 4 },
  loginText: { fontSize: 14, color: 'rgba(255,248,240,0.5)', textAlign: 'center' },
  loginHighlight: { color: '#D4AF37', fontWeight: '700', textDecorationLine: 'underline' },

  // Bottom
  bottomText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(212,175,55,0.4)',
    letterSpacing: 2,
    marginTop: 32,
  },
});

export default Register;