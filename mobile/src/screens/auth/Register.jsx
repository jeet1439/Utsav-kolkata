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

const StepIndicator = ({ current, total }) => (
  <View style={stepStyles.container}>
    {Array.from({ length: total }, (_, i) => (
      <View
        key={i}
        style={[
          stepStyles.bar,
          i < current ? stepStyles.active : stepStyles.inactive,
        ]}
      />
    ))}
  </View>
);

const stepStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6, marginBottom: 20, marginTop: 8 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  active: { backgroundColor: COLORS.primary },
  inactive: { backgroundColor: COLORS.surfaceAlt },
});


const InputField = ({ label, icon, error, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View
        style={[
          inputStyles.container,
          focused && inputStyles.containerFocused,
          error && inputStyles.containerError,
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
      {error ? <Text style={inputStyles.error}>{error}</Text> : null}
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
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
  containerFocused: { borderColor: COLORS.primary },
  containerError: { borderColor: COLORS.error, backgroundColor: COLORS.errorBg },
  icon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 2,
  },
});

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { level: 1, label: 'Too short', color: '#D94040' };
    if (password.length < 8) return { level: 2, label: 'Weak', color: '#E67E22' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { level: 4, label: 'Strong', color: '#27AE60' };
    return { level: 3, label: 'Medium', color: '#D4A843' };
  };

  const strength = getStrength();
  if (!strength) return null;

  return (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i <= strength.level ? strength.color : COLORS.surfaceAlt },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color: strength.color }]}>{strength.label}</Text>
    </View>
  );
};

const strengthStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '600', marginLeft: 10 },
});

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

  const validate = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required';
    else if (username.length < 3) newErrors.username = 'At least 3 characters required';
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/api/auth/signup'), {
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

  const filledCount = [username, email, password].filter(Boolean).length;

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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>উৎসব</Text>
              </View>
              <Text style={styles.appName}>Join the Puja</Text>
              <Text style={styles.appSub}>Begin your Utsav journey</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Join thousands celebrating Kolkata</Text>

              <StepIndicator current={filledCount} total={3} />

              <InputField
                label="Username"
                placeholder="your name"
                value={username}
                onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: '' })); }}
                autoCapitalize="none"
                error={errors.username}
              />

              <InputField
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
                autoCapitalize="none"
                error={errors.email}
              />

              <InputField
                label="Password"
                placeholder="Min. 6 characters"
                secureTextEntry
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
                error={errors.password}
              />
              <PasswordStrength password={password} />

              <Text style={styles.terms}>
                By registering, you agree to our{' '}
                <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
              </Text>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginWrapper}
              >
                <Text style={styles.loginText}>
                  Already celebrating?{'  '}
                  <Text style={styles.loginHighlight}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.bottomText}>Jai Maa Durga</Text>
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

  backButton: { paddingTop: 4, marginBottom: 12 },
  backButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
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

  terms: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Button
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
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceAlt },
  dividerText: { fontSize: 12, color: COLORS.textMuted, marginHorizontal: 12 },

  loginWrapper: { alignItems: 'center' },
  loginText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  loginHighlight: { color: COLORS.primary, fontWeight: '600' },


  bottomText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 28,
    letterSpacing: 0.5,
  },
});

export default Register;
