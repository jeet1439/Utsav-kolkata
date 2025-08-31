import { View, Text, Image, Dimensions, ScrollView, TouchableOpacity, Linking } from "react-native";
import Swiper from "react-native-swiper";
import Ionicons from "react-native-vector-icons/Ionicons"; // ✅ for CLI projects

const { width } = Dimensions.get("window");

const PandalDetailsScreen = ({ route }) => {
  const { item } = route.params;

  // Open Google Maps for directions
  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.location?.coordinates[1]},${item.location?.coordinates[0]}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Image Slider */}
      <View style={{ height: 250 }}>
        <Swiper
          autoplay
          autoplayTimeout={3}
          dotStyle={{ backgroundColor: "rgba(255,255,255,0.5)", marginBottom: 5 }}
          activeDotStyle={{ backgroundColor: "#ff6347", marginBottom: 5 }}
        >
          {item.pictures.map((pic, index) => (
            <Image
              key={index}
              source={{ uri: pic }}
              style={{ width: width, height: 250 }}
              resizeMode="cover"
            />
          ))}
        </Swiper>
      </View>

      {/* Details */}
      <View style={{ padding: 20 }}>
        {/* Title + Directions Button */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 26, fontWeight: "bold", color: "#333", flex: 1 }}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#ff6347",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
            onPress={openMaps}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 5 }}>Directions</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, color: "#666", marginTop: 5 }}>
          {item.distance.toFixed(2)} km away
        </Text>

        {/* Nearest Metro */}
        <View style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 5 }}>
            Nearest Metro
          </Text>
          <Text style={{ fontSize: 15, color: "#444", marginBottom: 3 }}>• {item.nearestMetro[0]} Metro Station</Text>
          {
            item.nearestMetro[1] ? (
              <Text style={{ fontSize: 15, color: "#444" }}>• {item.nearestMetro[1]} Metro Station</Text>
            ) :
            ("")
          }
          
        </View>

        {/* About Section */}
        <View
          style={{
            marginTop: 20,
            backgroundColor: "#f9f9f9",
            padding: 15,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
            About
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: "#444" }}>
            {item.about}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PandalDetailsScreen;
