import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Home = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#ff9933ff', '#ffcc33ff', '#ffd966ff']} 
      style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>🏵️ Welcome to উৎসব কলকাতা 🏵️</Text>
        <Text style={styles.subTitle}>Find the nearest pandal to your location</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate("Finder")}
          style={styles.button} >
          <Text style={styles.buttonText}>Nearby Pandle</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 3,
    color: '#fff'
  },
  button: {
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E60026',
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },

});

export default Home;
