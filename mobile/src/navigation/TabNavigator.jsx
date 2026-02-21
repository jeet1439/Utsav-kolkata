// navigation/TabNavigator.js
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home/Home.jsx";
import Profile from "../screens/Home/Profile.jsx";
import Settings from "../screens/Home/Settings.jsx";
import FindPartners from "../screens/Home/FindPartners.jsx";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: "#C8392B",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#ADADAD",
  border: "#F0F0F0",
};

const TABS = [
  { name: "Home",         icon: "home",          iconOutline: "home-outline",          label: "Explore"  },
  { name: "FindPartners", icon: "people",         iconOutline: "people-outline",        label: "Connect"  },
  { name: "Profile",      icon: "person",         iconOutline: "person-outline",        label: "Profile"  },
  { name: "Settings",     icon: "settings",       iconOutline: "settings-outline",      label: "Settings" },
];

function CustomTabBar({ state, descriptors, navigation }) {
  const animValues = useRef(TABS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    TABS.forEach((_, i) => {
      Animated.spring(animValues[i], {
        toValue: state.index === i ? 1 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, i) => {
        const isFocused = state.index === i;
        const tab = TABS[i];

        const scale = animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        });

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
              <Ionicons
                name={isFocused ? tab.icon : tab.iconOutline}
                size={23}
                color={isFocused ? COLORS.primary : COLORS.muted}
              />
            </Animated.View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
            {isFocused && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="FindPartners" component={FindPartners} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === "ios" ? 80 : 64,
    paddingBottom: Platform.OS === "ios" ? 18 : 4,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.muted,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 1,
  },
});