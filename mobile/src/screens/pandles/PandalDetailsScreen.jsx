import { 
  View, 
  Text, 
  Image, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Modal, 
  StyleSheet, 
  Platform, 
  PermissionsAndroid, 
  TextInput 
} from "react-native";
import Swiper from "react-native-swiper";
import Ionicons from "react-native-vector-icons/Ionicons"; 
import { useUserStore } from "../../store/userStore";
import { useState } from "react";
import { launchImageLibrary } from "react-native-image-picker";

const { width } = Dimensions.get("window");

const PandalDetailsScreen = ({ route }) => {
  const { item } = route.params;
  const { user } = useUserStore();
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading , setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [caption, setCaption] = useState(""); // ✅ caption state

  // Google Maps
  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.location?.coordinates[1]},${item.location?.coordinates[0]}`;
    Linking.openURL(url);
  };

  // Permissions for Android
  const requestGalleryPermission = async () => {
    if (Platform.OS === "android") {
      try {
        let permission;
        if (Platform.Version >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }
        const granted = await PermissionsAndroid.request(permission, {
          title: "Gallery Permission",
          message: "We need access to your gallery to upload images",
          buttonPositive: "OK",
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; 
  };

  const openGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      alert("Permission denied");
      return;
    }

    launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.log("Image Picker Error: ", response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const selectedUri = response.assets[0].uri;
        setSelectedImage(selectedUri); 
      }
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null); 
    setCaption(""); // reset caption
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      alert("Please select an image first");
      return;
    }

    setLoading(true);
    // TODO: Replace with API call
    setTimeout(() => {
      setLoading(false);
      setModalVisible(false);
      alert(`Photo uploaded with caption: "${caption}" 🎉`);
      setSelectedImage(null);
      setCaption("");
    }, 1500);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#ffffffff" }}>
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
            style={styles.directionsButton}
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
          {item.nearestMetro[1] && (
            <Text style={{ fontSize: 15, color: "#444" }}>• {item.nearestMetro[1]} Metro Station</Text>
          )}
        </View>

        {/* About Section */}
        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutText}>
            {item.about}
          </Text>
        </View>

        {/* Post a Memory Button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.postButton}
        >
          <Text style={styles.postButtonText}>
            📸 Post a Memory
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Shere a Memory</Text>

            {selectedImage ? (
              <Image 
              source={{ uri: selectedImage }} 
              style={styles.previewImage}
              resizeMode="contain"
               />
            ) : (
              <TouchableOpacity 
                style={styles.previewPlaceholder} 
                onPress={openGallery}
              >
                <Ionicons name="image-outline" size={40} color="#ccc" />
                <Text style={{ color: "#aaa", marginTop: 5 }}>Tap to select an image</Text>
              </TouchableOpacity>
            )}

            {/* Caption input */}
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#888"
              value={caption}
              onChangeText={setCaption}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#ccc" }]} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: "#ff6868" }, loading && { opacity: 0.6 }]} 
                onPress={handleUpload}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>{loading ? "Adding..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff6868",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aboutBox: {
    marginTop: 20,
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  aboutTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  aboutText: { fontSize: 15, lineHeight: 22, color: "#444" },
  postButton: {
    marginTop: 20,
    backgroundColor: "#ff6868",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 15 },
  previewImage: { 
    width: 260, 
    height: 200,
    borderRadius: 5, 
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
  },
     previewPlaceholder: {
    width: 260,
    height: 200,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  captionInput: {
    width: "100%",
    minHeight: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: "#333",
    marginBottom: 15,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "600" },
});

export default PandalDetailsScreen;
