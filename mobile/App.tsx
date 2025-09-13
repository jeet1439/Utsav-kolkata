import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator.jsx';

const App = () => {
  return (
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
  )
}

export default App