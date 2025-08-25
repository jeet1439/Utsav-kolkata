import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, PermissionsAndroid, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';

const Home = ({ navigation }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        setToken(storedToken || '');
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch (err) {
        console.log(err);
        Alert.alert('Error', 'Failed to load user data');
      }
    };

    fetchData();
    getLocation();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true; // iOS handled in Info.plist
    }
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Cannot access location');
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
      },
      (error) => {
        console.log('Error getting location:', error);
        Alert.alert('Error', 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      navigation.replace('Login');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    <StatusBar />
      <Text style={styles.title}>Utsav kolkata</Text>

      {/* <Text style={styles.label}>Token:</Text>
      <Text style={styles.value}>{token || 'No token found'}</Text>

      <Text style={styles.label}>User Info:</Text>
      {user ? (
        <View style={styles.userContainer}>
          <Text style={styles.value}>ID: {user._id}</Text>
          <Text style={styles.value}>Username: {user.username}</Text>
          <Text style={styles.value}>Email: {user.email}</Text>
          <Text style={styles.value}>Profile Image: {user.profileImage}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No user data found</Text>
      )} */}

      <Text style={styles.label}>Location:</Text>
      {location ? (
        <View style={styles.userContainer}>
          <Text style={styles.value}>Latitude: {location.latitude}</Text>
          <Text style={styles.value}>Longitude: {location.longitude}</Text>
        </View>
      ) : (
        <Text style={styles.value}>Fetching location...</Text>
      )}

      <TouchableOpacity  onPress={getLocation}>
        <Text >Refresh Location</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  label: { fontSize: 18, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, marginBottom: 5, textAlign: 'center' },
  userContainer: { marginVertical: 10, alignItems: 'center' },
  button: { marginTop: 20, backgroundColor: '#4a90e2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Home;
