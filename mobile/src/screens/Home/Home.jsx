import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = ({ navigation }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

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
  }, []);

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
      <Text style={styles.title}>Home</Text>

      <Text style={styles.label}>Token:</Text>
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
      )}

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
  button: { marginTop: 30, backgroundColor: '#4a90e2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Home;
