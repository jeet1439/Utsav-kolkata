import { View, Text, Image } from "react-native";

const PandalDetailsScreen = ({ route }) => {
  const { item } = route.params;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Image
        source={{ uri: item.pictures[0] }}
        style={{ width: "100%", height: 200 }}
      />
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{item.title}</Text>
      <Text>{item.distance.toFixed(2)} km away</Text>
      {/* Add more details as needed */}
    </View>
  );
};

export default PandalDetailsScreen;
