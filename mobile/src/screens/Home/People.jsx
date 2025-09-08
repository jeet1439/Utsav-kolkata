import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
const socket = io("http://192.168.0.7:3000"); // Replace with your server IP

const People = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const getUserFromStorage = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUserId(user._id);

          // Send user ID to backend
          socket.emit("user_online", user._id);
        }
      } catch (err) {
        console.log("Error reading user from storage:", err);
      }
    };

    getUserFromStorage();

    // Listen for online users from backend
    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Online People</Text>
      <FlatList
        data={onlineUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Image
              source={{ uri: item.profileImage || "https://via.placeholder.com/50" }}
              style={styles.avatar}
            />
            <View style={styles.onlineDot} />
            <Text style={styles.userName}>{item.username}</Text>
             
             <TouchableOpacity style={styles.pokeBtn}>
              <Text style={styles.pokeBtnText} >Poke</Text>
             </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 20
   },
  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 2,
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10 
  },
  userName: { 
    fontSize: 16, 
    flex: 1 
  },
  onlineDot: {
    position: 'absolute',
    left: 40,
    top: 40,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "green",
  },
  pokeBtn: {
  backgroundColor: "#ff6b6b", // fun, attention-grabbing red/pink
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 20, // rounded edges
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 3, // Android shadow
},
pokeBtnText: {
  color: "#fff", // white text
  fontWeight: "bold",
  fontSize: 14,
},
});

export default People;
