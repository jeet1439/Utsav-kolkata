import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, Animated, PermissionsAndroid, Platform, TextInput } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from "react-native-image-picker";
import Modal from "react-native-modal";
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Dimensions } from 'react-native';
import { useUserStore } from '../../store/userStore.js';
import chatIcon from '../../assets/chatIcon.png';

const screenWidth = Dimensions.get('window').width - 40;
const numColumns = 3;
const imageMargin = 5;

const imageWidth = (screenWidth - (numColumns + 1) * imageMargin) / numColumns;

const Profile = () => {
  // const { user, setUser } = useContext(UserContext);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBioModalVisible, setBioModalVisible] = useState(false);
  const [bioText, setBioText] = useState("");
  const [loadingBio, setLoadingBio] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { user, setUser } = useUserStore();

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
        "http://192.168.0.101:3000/api/user/featured-image",
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

  useEffect(() => {
    if (user?.bio) {
      setBioText(user.bio);
    }
  }, [user]);


  const openBioModal = () => {
    setBioText(user.bio || "");
    setBioModalVisible(true);
  };

  const closeBioModal = () => {
    setBioModalVisible(false);
  };

  const handleSaveBio = async () => {
    try {
      setLoadingBio(true);
      const res = await axios.post("http://192.168.0.101:3000/api/user/update-bio", {
        userId: user._id,
        bio: bioText.trim(),
      });

      if (res.data.success) {
        setUser((prev) => ({ ...prev, bio: bioText.trim() }));
        closeBioModal();
      } else {
        alert("Failed to update bio");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating bio");
    } finally {
      setLoadingBio(false);
    }
  };

  const AnimatedImageItem = ({ uri, onPreview }) => {
    return (
      <TouchableOpacity
        onLongPress={() => onPreview(uri)}
        delayLongPress={150}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri }}
          style={styles.featuredImage}
        />
      </TouchableOpacity>
    );
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
              source={{ uri: user?.profileImage?.[0] }}
              style={styles.profileImage}
            />
            <View style={styles.usernameContainer}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.username}>{user?.username}</Text>
                <Text style={{ marginVertical: 5 }}>0 views</Text>
                <TouchableOpacity onPress={() => console.log("Pressed!")}>
                  <Image source={chatIcon}
                    style={{ width: 35, height: 35, }} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.btnStyle} onPress={() => setModalVisible(true)}>
                <Text style={styles.uploadBtnTxt}>Add Featured Image +</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Bio */}
        {user?.bio ? (
          <Text onLongPress={openBioModal} style={styles.bio}>{user?.bio || ""}</Text>
        ) : (
          <Text onLongPress={openBioModal} style={styles.noBio}>No bio added yet</Text>
        )}

        <Modal
          isVisible={isBioModalVisible}
          onBackdropPress={closeBioModal}
          style={{ justifyContent: "center", margin: 20 }}
        >
          <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              {user?.bio ? "Update Bio" : "Add Bio"}
            </Text>

            <TextInput
              value={bioText}
              onChangeText={setBioText}
              placeholder="Write something about yourself..."
              style={{
                borderColor: "#ccc",
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                height: 100,
                textAlignVertical: "top",
              }}
              multiline
            />

            <TouchableOpacity
              style={{
                backgroundColor: "#ff5100ff",
                padding: 12,
                marginTop: 15,
                borderRadius: 8,
                alignItems: "center",
                opacity: loadingBio ? 0.6 : 1,
              }}
              disabled={loadingBio}
              onPress={handleSaveBio}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {loadingBio ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

      </View>

      <View style={{ marginVertical: 20 }}>
        {user?.featuredImages && user?.featuredImages.length > 0 ? (
          <FlatList
            data={user?.featuredImages}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            renderItem={({ item }) => (
              <AnimatedImageItem uri={item} onPreview={(uri) => setPreviewImage(uri)} />
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
              <Text style={{ color: "#aaa", marginTop: 5 }} onPress={openGallery}>No Image Selected</Text>
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

      <Modal
        isVisible={previewImage}
        onBackdropPress={() => setPreviewImage(null)}
        style={{ margin: 0, justifyContent: "center", alignItems: "center" }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={300}  
        animationOutTiming={300}
        backdropTransitionInTiming={300}
        backdropTransitionOutTiming={300}
      >
        <View style={{ width: "100%", height: "80%", justifyContent: "center", alignItems: "center" }}>
          <Image
            source={{ uri: previewImage }}
            style={{ width: "90%", height: "70%", borderRadius: 8, resizeMode: "contain" }}
            resizeMode='cover'
          />
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
    fontSize: 16,
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
