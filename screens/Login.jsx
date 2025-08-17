import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const Login = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login Screen</Text>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={{ marginTop: 20, padding: 10, backgroundColor: 'lightcoral' }}
      >
        <Text style={{ color: 'white' }}>Go Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
