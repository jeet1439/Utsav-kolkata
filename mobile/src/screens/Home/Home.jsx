import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, PermissionsAndroid, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      return true; // iOS should be handled in infoplist
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

  return (
    <View style={styles.container}>
      {/* Top section - Map */}
      <View style={styles.topSection}>
         <Text>Top section</Text>
      </View>

      {/* Bottom section - Data */}
      <View style={styles.bottomSection}>
        <Text style={styles.dataText}>Some data goes here</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 6,
    backgroundColor: "green"
  },
  map: {
    flex: 1,
  },
  bottomSection: {
    flex: 4,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataText: {
    fontSize: 18,
  },
});

export default Home;
