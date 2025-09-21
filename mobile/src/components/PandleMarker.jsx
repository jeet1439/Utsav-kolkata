import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const PandalMarker = ({ title, iconUrl }) => {
  return (
    <View style={styles.markerContainer}>
      <Image source={{ uri: iconUrl }} style={styles.markerIcon} />
      <Text style={styles.markerTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerIcon: {
    width: 32,
    height: 32,
  },
  markerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default PandalMarker;
