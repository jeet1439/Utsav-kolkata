import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator.jsx';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';

const App = () => {
  const [notifData, setNotifData] = useState({
    title: '',
    body: '',
  });
  const [visible, setVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-100)).current;

  // 🔔 Foreground Notification Listener
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      setNotifData({
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || '',
      });

      showBanner();
    });

    return unsubscribe;
  }, []);

  const showBanner = () => {
    setVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 4 sec
    setTimeout(() => {
      hideBanner();
    }, 4000);
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>

      {visible && (
        <Animated.View
          style={[
            styles.banner,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <SafeAreaView>
            <TouchableOpacity onPress={hideBanner}>
              <Text style={styles.title}>{notifData.title}</Text>
              <Text style={styles.body}>{notifData.body}</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      )}
    </>
  );
};

export default App;

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#FF4D6D',
    padding: 15,
    zIndex: 999,
    elevation: 10,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  body: {
    color: '#fff',
    fontSize: 13,
    marginTop: 2,
  },
});