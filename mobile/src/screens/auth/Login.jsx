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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../store/userStore.js';
import CustomModal from '../../components/CustomModal.jsx';
import { buildApiUrl } from '../../constants/api.js';

const COLORS = {
  primary: "#FF4D6D",
  primaryLight: "#FFE4E8",
  gold: "#FF8FA3",
  goldLight: "#FFC2D1",
  dark: "#1A1A2E",
  surface: "#FFF8F9",
  surfaceAlt: "#FFEFF3",
  text: "#2B2B2B",
  textMuted: "#8A7F88",
  white: "#FFFFFF",
  cardBg: "#FFFFFF",
  shadow: "rgba(255, 77, 109, 0.18)",
};

const InputField = ({ label, icon, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View
        style={[
          inputStyles.container,
          focused && inputStyles.containerFocused,
        ]}
      >
        {/* <Text style={inputStyles.icon}>{icon}</Text> */}
        <TextInput
          style={inputStyles.input}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  containerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  // icon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
});


const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
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

    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/api/auth/login'), {
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
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>উৎসব</Text>
              </View>
              <Text style={styles.appName}>Utsav Kolkata</Text>
              <Text style={styles.appSub}>Discover the joy of Durga Puja</Text>
            </View>

            {/* ── Card ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSubtitle}>Welcome back to the city life</Text>

              <View style={{ marginTop: 24 }}>
                <InputField
                  label="Email Address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <InputField
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.registerWrapper}
              >
                <Text style={styles.registerText}>
                  New here?{'  '}
                  <Text style={styles.registerHighlight}>Create an account</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.bottomText}>Celebrate the spirit of Kolkata</Text>
          </Animated.View>
        </ScrollView>

        <CustomModal
          visible={modalVisible}
          type={modalType}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 22,
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Card
  card: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.surfaceAlt,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  forgotWrapper: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },

  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },

  registerWrapper: { alignItems: 'center' },
  registerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  registerHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  bottomText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 28,
    letterSpacing: 0.5,
  },
});

export default Login;
