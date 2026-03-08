import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, Animated, Easing } from "react-native";

const TOAST_CONFIG = {
  success: { accent: "#16a34a", icon: "✓", label: "Success" },
  error:   { accent: "#dc2626", icon: "✕", label: "Error" },
  warning: { accent: "#d97706", icon: "!", label: "Warning" },
  default: { accent: "#71717a", icon: "•", label: "Notice" },
};

const CustomModal = ({ visible, type = "default", message, onClose }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  const config = TOAST_CONFIG[type] || TOAST_CONFIG.default;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onClose());
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.toast, { transform: [{ translateY }], opacity }]}>

          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: config.accent }]} />

          {/* Icon */}
          <Text style={[styles.icon, { color: config.accent }]}>{config.icon}</Text>

          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={[styles.label, { color: config.accent }]}>{config.label}</Text>
            <Text style={styles.message} numberOfLines={2}>{message}</Text>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    paddingTop: 52,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    width: "88%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  icon: {
    fontSize: 16,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  message: {
    color: "#52525b",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default CustomModal;