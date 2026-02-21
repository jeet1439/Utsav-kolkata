import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Settings = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      const { clearUser } = useUserStore.getState();
      clearUser();
      navigation.replace('Login');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Settings Options */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="person-circle-outline" size={24} color="#4a90e2" />
          <Text style={styles.optionText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="notifications-outline" size={24} color="#4a90e2" />
          <Text style={styles.optionText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#4a90e2" />
          <Text style={styles.optionText}>Privacy & Security</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="help-circle-outline" size={24} color="#4a90e2" />
          <Text style={styles.optionText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* Helpline Numbers Box */}
      <View style={styles.card}>
        <Text style={styles.subHeader}>📞 Helpline Numbers</Text>
        <View style={styles.helplineRow}>
          <Ionicons name="call-outline" size={20} color="#4a90e2" />
          <Text style={styles.helplineText}>Kolkata Police Control Room: 100</Text>
        </View>
        <View style={styles.helplineRow}>
          <Ionicons name="call-outline" size={20} color="#4a90e2" />
          <Text style={styles.helplineText}>Kolkata Police Helpline: 033-2214-3024</Text>
        </View>
        <View style={styles.helplineRow}>
          <Ionicons name="call-outline" size={20} color="#4a90e2" />
          <Text style={styles.helplineText}>Women Safety Helpline: 1091</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#333' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  optionText: { marginLeft: 15, fontSize: 16, color: '#333' },

  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginLeft: 20,
  },
  helplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  helplineText: { marginLeft: 10, fontSize: 15, color: '#444' },

  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#C8392B',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

export default Settings;
