import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, PermissionsAndroid, StatusBar, ActivityIndicator, Image, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { LeafletView } from "react-native-leaflet-view";
import Ionicons from 'react-native-vector-icons/Ionicons';

const Home = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearestPandle, setNearestPandle] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
  const loadToken = async () => {
    const storedToken = await AsyncStorage.getItem('token');
    setToken(storedToken);
  };
  loadToken();
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
  
  const fetchNearestPandleData = async () => {
    try {
      if (!location) return;
      const res = await fetch(
        `http://192.168.0.101:3000/api/pandals/nearest?latitude=${location.latitude}&longitude=${location.longitude}`,{
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      console.log("Nearest Pandals:", data);
      setNearestPandle(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);
  
  useEffect(() => {
  if (location) {
    fetchNearestPandleData();
  }
}, [location, token]);

console.log("The nearest pandle data is:")
console.log(nearestPandle);


  return (
    <View style={styles.container}>
      {/* Top section - Map */}
      <View style={styles.topSection}>
      {location && (
        <View style={styles.topSection}>
  {location && (
    <LeafletView
      mapCenterPosition={{ lat: location.latitude, lng: location.longitude }}
      zoom={15}
      mapMarkers={[
        {
          id: "currentLocation",
          position: { lat: location.latitude, lng: location.longitude },
          icon: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          size: [32, 32],
        },
        ...(nearestPandle?.map((pandal, index) => ({
          id: `pandal-${index}`,
          position: {
            lat: pandal.location.coordinates[1], 
            lng: pandal.location.coordinates[0], 
          },
          icon: "https://res.cloudinary.com/dzwismxgx/image/upload/v1758135594/location_ukspja.png",
          size: [32, 32],
        })) || []),
      ]}
    />
  )}
  <TouchableOpacity style={styles.floatingButton} onPress={getLocation}>
  <Ionicons name="compass" size={28} color="#fff" />
</TouchableOpacity>
</View>
      )}
  </View>

      {/* Bottom section - Data */}
      <View style={styles.bottomSection}>
      <View style={styles.heading}>
          <Text style={styles.headerText}>Pandal Closest to You</Text>
          {/* <TouchableOpacity style={styles.loadButton} onPress={getLocation}>
            {location ? (
              <View style={[styles.circle, { backgroundColor: 'green' }]} />
            ) : (
              <View style={[styles.circle, { backgroundColor: '#ccc' }]} />
            )}
          </TouchableOpacity> */}
          </View>
        {/* <Text style={styles.dataText}> </Text> */}
       <View  style={{ height: 300, paddingBottom: 25} }>
        {nearestPandle && nearestPandle.length > 0 ? (
          <FlatList
              data={nearestPandle}
              keyExtractor={(item) => item._id}
              numColumns={2}  
              key={"two-columns"} 
              columnWrapperStyle={{ justifyContent: "space-between" }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.card}
                  onPress={() => navigation.navigate("PandalDetails", { item })}
                >
                  <Image
                    source={{ uri: item.pictures[0] }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardDistance}>within {item.distance.toFixed(2)} km</Text>
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
  fontWeight: "600",
  textAlign: "center", // centers text inside its container
  width: '100%',       // optional but recommended
},
  loadButton: {
   position: 'absolute',
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
   card: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    overflow: "hidden",
    elevation: 3, 
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  cardImage: {
    width: "100%",
    height: 120,
  },
  cardInfo: {
    padding: 8,
    alignItems: "center",
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  cardDistance: {
    fontSize: 12,
    color: "gray",
    marginTop: 4,
  },
  floatingButton: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  backgroundColor: '#63a0e6ff',
  width: 50,
  height: 50,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 3 },
},

});

export default Home;
