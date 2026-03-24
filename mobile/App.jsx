import { View, Text, StatusBar } from 'react-native'
import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator.jsx';
import { AppState } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { SafeAreaView } from 'react-native-safe-area-context';

const App = () => {

  // const SERVER_URL = "http://192.168.0.100:3000";

  // const socket = io(SERVER_URL, {
  //   transports: ["websocket"],
  // });

  //  useEffect(() => {

  //   const handleAppStateChange = async (state) => {

  //     const userId = await AsyncStorage.getItem("userId");

  //     if (!userId) return;

  //     if (state === "background" || state === "inactive") {
  //       socket.emit("userOffline", userId);
  //     }

  //     if (state === "active") {
  //       socket.emit("userOnline", userId);
  //     }
  //   };

  //   const sub = AppState.addEventListener("change", handleAppStateChange);

  //   return () => {
  //     sub.remove();
  //   };

  // }, []);
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  )
}

export default App