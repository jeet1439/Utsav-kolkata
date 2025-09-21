// navigation/TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home/Home.jsx";
import Profile from "../screens/Home/Profile.jsx";
import Settings from "../screens/Home/Settings.jsx";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#ff6868ff",
          position: "absolute",
          height: 65,
        },
        
        tabBarIconStyle: {
          marginTop: 6, 
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Profile") iconName = "person-circle-outline";
          else if (route.name === "Settings") iconName = "settings-outline";
          return <Ionicons name={iconName} size={30} color={color} />;
        },

        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#5c5c5cff",
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Profile" component={Profile}/>
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}
