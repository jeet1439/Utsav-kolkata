import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, PermissionsAndroid, Platform} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from "react-native-image-picker";
import Modal from "react-native-modal";
import { useContext } from 'react';
import { UserContext } from '../../contexts/userContexts.js';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 40;
const numColumns = 3;
const imageMargin = 5; 

const imageWidth = (screenWidth - (numColumns + 1) * imageMargin) / numColumns;

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [loading , setLoading] = useState(false);
  

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
        message: "We need access to your gallery to upload featured images",
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

const handlePost = async () => {
  if (!selectedImage) {
    alert("Please select an image first");
    return;
  }

  try {
    setLoading(true);

    const token = await AsyncStorage.getItem("token");

    const formData = new FormData();
    formData.append("image", {
      uri: selectedImage,
      name: `featured.${selectedImage.split('.').pop()}`,
      type: `image/${selectedImage.split('.').pop()}`,
    });

    const res = await axios.post(
      "http://192.168.0.100:3000/api/user/featured-image",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setUser(res.data);
    setLoading(false);
    setSelectedImage(null);
    setModalVisible(false);
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to upload image");
    setLoading(false);
  }
};

const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null); 
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <View style={styles.leftSection}>
            <Image
              source={{ uri: user.profileImage?.[0] }}
              style={styles.profileImage}
            />
            <View style={styles.usernameContainer}>
               <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                 <Text style={styles.username}>{user.username}</Text>
                 <Text style={{ marginVertical: 5}}>0 views</Text>
                 <TouchableOpacity>
                  <Ionicons name="create-outline" size={24} color="gray" />
                </TouchableOpacity>
               </View>
             
              <TouchableOpacity style={styles.btnStyle} onPress={() => setModalVisible(true)}>
                <Text style={styles.uploadBtnTxt}>Add Featured Image +</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Bio */}
        {user.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : (
          <Text style={styles.noBio}>No bio added yet</Text>
        )}
      </View>

       <View style={{ marginVertical: 20 }}>
          {user.featuredImages && user.featuredImages.length > 0 ? (
            <FlatList
              data={user.featuredImages}
              keyExtractor={(item, index) => index.toString()}
              numColumns={3} 
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.featuredImage}
                />
              )}
              contentContainerStyle={{ paddingBottom: 50 }}
            />
          ) : (
            <Text style={{ color: '#999', fontSize: 14 }}>No featured images yet</Text>
          )}
        </View>
       

       <Modal
          isVisible={isModalVisible}
          style={styles.modal}
          onBackdropPress={closeModal}
          swipeDirection="down"
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Featured Image</Text>

            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={40} color="#ccc" onPress={openGallery} />
                <Text style={{ color: "#aaa", marginTop: 5 }}  onPress={openGallery}>No Image Selected</Text>
              </View>
            )}

            {/* Pick Image Button */}
            {/* <TouchableOpacity style={styles.modalButton} onPress={openGallery}>
              <Ionicons name="images-outline" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Pick from Gallery</Text>
            </TouchableOpacity> */}

            {/* Post Button */}
            <TouchableOpacity
            style={[
              styles.modalButton,
              { marginTop: 10 },
              loading && { opacity: 0.6 } // make button look disabled
            ]}
            onPress={handlePost}
            disabled={loading} // disables touch when loading
          > 
            {loading ? (
              <Text style={styles.modalButtonText}>Adding...</Text>
            ) : (
              <>
                <Text style={styles.modalButtonText}>Add Featured</Text>
                <Ionicons name="checkmark-outline" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
          </View>
        </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#3a94fcff',
    marginRight: 15,
  },
  usernameContainer: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  btnStyle: {
    height: 40,
    width: '100%',
    borderRadius: 8,
    backgroundColor: 'beige',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bio: {
    fontSize: 14,
    color: '#252525ff',
    marginTop: 5,
    lineHeight: 20,
  },
  noBio: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  featuredImage: {
  width: imageWidth,
  height: imageWidth,
  borderRadius: 5,
  marginHorizontal: imageMargin / 2,
  marginVertical: imageMargin / 2,
},
uploadBtnTxt: {
  fontSize: 15,
  fontWeight: "400"
},
  modal: { 
    justifyContent: "flex-end",
     margin: 0 
    },
  modalContent: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 15 
  },
  modalButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#ff6600ff", 
    padding: 12, 
    borderRadius: 10 
  },
  modalButtonText: { 
    color: "#fff", 
    marginLeft: 8, 
    fontSize: 16 ,
  },
previewImage: {
  width: "100%",
  height: 200,
  borderRadius: 10,
  marginBottom: 15,
},
previewPlaceholder: {
  width: "100%",
  height: 200,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#ccc",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 15,
}
});

export default Profile;
