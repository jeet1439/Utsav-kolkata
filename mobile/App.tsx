import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator.jsx';
import { UserProvider } from './src/contexts/userContexts.js';

const App = () => {
  return (
  <UserProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
  </UserProvider>
  )
}

export default App