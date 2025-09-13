import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
const Settings = ({ navigation }) => { 

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      const { clearUser } = useUserStore.getState();
      clearUser();

      navigation.replace('Login');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <SafeAreaView>
      <Text>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  button: { marginTop: 20, backgroundColor: '#4a90e2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Settings;
