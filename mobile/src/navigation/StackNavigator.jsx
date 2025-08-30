import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Splash from "../screens/auth/splash.jsx";
import Register from "../screens/auth/Register.jsx";
import Login from "../screens/auth/Login.jsx";
import TabNavigator from "./TabNavigator.jsx";
import PandalDetailsScreen from "../screens/pandles/PandalDetailsScreen.jsx";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      {/* Tab Navigator replaces Home */}
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />

      <Stack.Screen name = "PandalDetails" component={PandalDetailsScreen} options={{ headerShown: false }} />
    </Stack.Navigator> 
  );
}
