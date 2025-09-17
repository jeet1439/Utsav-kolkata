import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";

const MemoryCard = ({ item }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes || 0); // dynamic like count
  console.log(item.userId._id);
  const navigation = useNavigation();

  const handleNavigate = () => {
  navigation.navigate("PersonProfile", { userId: item.userId._id });
  };
  
  return (
    <View style={styles.memoryCard}>
      <TouchableOpacity onPress={() => handleNavigate()} style={styles.memoryHeader}>
        <Image source={{ uri: item.userId.profileImage[0] }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.memoryUser}>{item.userId.username || "Unknown"}</Text>
          <Text style={styles.memoryTime}>{moment(item.createdAt).fromNow()}</Text>
        </View>
      </TouchableOpacity>

      <Image source={{ uri: item.url }} style={styles.memoryImage} resizeMode="cover" />
      <View style={styles.captionRow}>
        <Text style={styles.memoryCaption}>
          <Text style={{ fontWeight: "600" }}>{item.userId?.username || "User"} </Text>
          {item.caption}
        </Text>
        <Text style={styles.viewsText}>0 views</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  memoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  memoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  memoryUser: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memoryTime: {
    fontSize: 12,
    color: "#777",
  },
  memoryImage: {
    width: "100%",
    height: 250,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  memoryActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
  },
  captionRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: 12,
  paddingBottom: 10,
  marginTop: 10,
 },
  viewsText: {
  fontSize: 14,
  color: "#777",
 },
  memoryCaption: {
  fontSize: 14,
  color: "#333",
  flex: 1,
  marginRight: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
});

export default MemoryCard;
