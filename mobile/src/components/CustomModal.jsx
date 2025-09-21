import React, { useEffect } from "react";
import { Modal, View, Text, StyleSheet, Animated } from "react-native";

const CustomModal = ({ visible, type, message, onClose }) => {
  const [translateY] = React.useState(new Animated.Value(-100)); // start hidden

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onClose());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50"; 
      case "error":
        return "#F44336"; 
      case "warning":
        return "#FF9800";
      default:
        return "#696969ff";
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.banner,
            { backgroundColor: getBackgroundColor(), transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
 banner: {
    position: "absolute",
    top: 0,
    alignSelf: "center", 
    width: "80%",        
    marginTop: 40,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    },
  message: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CustomModal;
