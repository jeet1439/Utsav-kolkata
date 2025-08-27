import { View, Text, TouchableOpacity,  StyleSheet } from 'react-native'
import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';

const Settings = () => {

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
    <View>
      <Text>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
    </View>
  )
};

const styles = StyleSheet.create({
  button: { marginTop: 20, backgroundColor: '#4a90e2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Settings