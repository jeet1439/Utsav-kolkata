import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../store/userStore.js';

const Login = ({ navigation }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { setUser } = useUserStore();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('All fields are required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://192.168.0.101:3000/api/auth/login', {
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
        alert('Login successful');
        navigation.replace('Main', { screen: 'Home' });
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      alert('Network error');
    }
  };

  return (
    <LinearGradient
      colors={['#FFDEE9', '#FF9A8B', '#FFD3A5']} // festive gradient
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Login</Text>
            {/* <Image
              source={require('../../assets/logo.png')}
              style={{ width: 120, height: 120, alignSelf: 'center', marginBottom: 20 }}
              resizeMode="contain"
            /> */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={['#FF6F61', '#ff7553ff', '#ff6868ff']} // gradient button
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={{ marginTop: 20 }}
            >
              <Text style={styles.link}>Don’t have an account? Register</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  input: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f7ebebff'
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  link: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default Login;
