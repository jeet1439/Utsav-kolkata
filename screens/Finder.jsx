import React, {useEffect, useState} from 'react';
import {View, Text, PermissionsAndroid, Platform, ActivityIndicator, StyleSheet} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const Finder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearestPandal, setNearestPandal] = useState(null);

  const pandals = [
    {id: 1, name: 'Bagbazar Pandal', latitude: 22.6042, longitude: 88.3639},
    {id: 2, name: 'College Square Pandal', latitude: 22.5757, longitude: 88.3639},
    {id: 3, name: 'Ekdalia Evergreen', latitude: 22.5161, longitude: 88.3640},
  ];

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          return;
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          setUserLocation(position.coords);
        },
        error => {
          console.log(error);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } catch (err) {
      console.log(err);
    }
  };

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  }

  function findNearestPandal(location) {
    let nearest = null;
    let minDistance = Infinity;

    pandals.forEach(p => {
      const distance = getDistance(
        location.latitude,
        location.longitude,
        p.latitude,
        p.longitude,
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {...p, distance};
      }
    });

    return nearest;
  }

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      const nearest = findNearestPandal(userLocation);
      setNearestPandal(nearest);
    }
  }, [userLocation]);

  if (!userLocation || !nearestPandal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Finding nearest pandal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Nearest Pandal 🎉</Text>
      <Text style={styles.name}>{nearestPandal.name}</Text>
      <Text style={styles.distance}>
        Distance: {nearestPandal.distance.toFixed(2)} km
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 22, fontWeight: 'bold', marginBottom: 10},
  name: {fontSize: 18, color: 'green'},
  distance: {fontSize: 16, marginTop: 5},
});

export default Finder;
