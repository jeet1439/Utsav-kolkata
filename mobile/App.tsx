import { View, Text } from 'react-native'
import React from 'react'
import Register from './src/screens/auth/Register.jsx';
import Login from './src/screens/auth/Login.jsx';
import Home from './src/screens/Home/Home.jsx';
import Splash from './src/screens/auth/splash.jsx';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const App = () => {
  const Stack = createNativeStackNavigator();

  return (
  <NavigationContainer>
      <Stack.Navigator initialRouteName='Splash'>
      <Stack.Screen name='Splash' component={Splash} options={{headerShown: false}}/>
      <Stack.Screen name='Register' component={Register} options={{headerShown: false}}/>
      <Stack.Screen name='Login' component={Login} options={{headerShown: false}}/>
      <Stack.Screen name='Home' component={Home} options={{headerShown: false}}/>
    </Stack.Navigator>
  </NavigationContainer>
  )
}

export default App