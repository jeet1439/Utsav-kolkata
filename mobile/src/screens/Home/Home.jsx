import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, PermissionsAndroid, StatusBar, ActivityIndicator, Image, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafletView } from "react-native-leaflet-view";

const Home = ({ navigation }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearestPandle, setNearestPandle] = useState(null);

  const fetchUserData = async () => {
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
  
const fetchNearestPandleData = async () => {
  try {
    if (!location) return;

    const res = await fetch(
      `http://192.168.0.9:3000/api/pandals/nearest?latitude=${location.latitude}&longitude=${location.longitude}`
    );
    const data = await res.json();
    console.log("Nearest Pandals:", data);
    setNearestPandle(data);
  } catch (error) {
    console.error(error);
  }
};

  useEffect(() => {
    fetchUserData();
    getLocation();
  }, []);
  
  useEffect(() => {
  if (location) {
    fetchNearestPandleData();
  }
}, [location]);

console.log("The nearest pandle data is:")
console.log(nearestPandle);


  return (
    <View style={styles.container}>
      {/* Top section - Map */}
      <View style={styles.topSection}>
      {location && (
        <LeafletView
          mapCenterPosition={{ lat: location.latitude, lng: location.longitude }}
          zoom={12}
          mapMarkers={[
            {
              id: "currentLocation",
              position: { lat: location.latitude, lng: location.longitude },
              icon: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
              size: [32, 32],
            },
            // Pandal markers 
            ...(Array.isArray(nearestPandle) && nearestPandle.length > 0
                ? nearestPandle.map((pandal) => ({
                    id: pandal._id,
                    position: {
                      lat: pandal.location.coordinates[1], 
                      lng: pandal.location.coordinates[0], 
                    },
                    icon: "https://res.cloudinary.com/dzwismxgx/image/upload/v1756570041/location_f7rguo.png",
                    size: [32, 32],
                  }))
                : []),
          ]}
        />
      )}
  </View>

      {/* Bottom section - Data */}
      <View style={styles.bottomSection}>
      <View style={styles.heading}>
        <Text style={styles.headerText}>Utsav Kolkata</Text>
        <TouchableOpacity style={styles.loadButton} onPress={getLocation}>
            {location ? (
              <View style={[styles.circle, {backgroundColor:'green'}]} />
            ) : (
              <View style={[styles.circle, { backgroundColor: '#ccc'}]} />
            )}
        </TouchableOpacity>
      </View>
        {/* <Text style={styles.dataText}> </Text> */}
       <View  style={{ height: 210} }>
        {nearestPandle && nearestPandle.length > 0 ? (
          <FlatList
            data={nearestPandle}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
              style={styles.row}
              onPress={() => navigation.navigate("PandalDetails", { item })}
              >
                <Image
                  source={{ uri: item.pictures[0] }}
                  style={styles.image}
                />
                <View style={styles.info}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.distance}>{item.distance.toFixed(2)} km</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.dataText}>No pandals found nearby</Text>
        )}
  </View>


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
    backgroundColor: "#3269a8"
  },
  map: {
    flex: 1,
  },
  bottomSection: {
    flex: 4,
    backgroundColor: '#f2f2f2',
    marginHorizontal: 10,
  },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 40,
  },
  headerText: {
    fontSize: 25,
    fontWeight: "600"
  },
  loadButton: {
   justifyContent: "center"
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dataText: {
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  info: {
    marginLeft: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  distance: {
    color: 'gray',
    marginTop: 4,
  },
});

export default Home;
