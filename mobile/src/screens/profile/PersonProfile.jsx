import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from 'react-native';
import chatIcon from '../../assets/chatIcon.png';
import Modal from "react-native-modal";
const screenWidth = Dimensions.get('window').width - 40;
const numColumns = 3;
const imageMargin = 5;

const imageWidth = (screenWidth - (numColumns + 1) * imageMargin) / numColumns;
const PersonProfile = () => {
  const route = useRoute();
  const [user, setUser] = useState(null);
  const { userId } = route.params;
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://192.168.0.101:3000/api/user/getuser/${userId}`);
        const data = await res.json();
        console.log("User Data:", data);
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [userId]);
  
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
                    {/* <TouchableOpacity onPress={() => console.log("Pressed!")}>
                      <Image source={chatIcon}
                        style={{ width: 35, height: 35, }} />
                    </TouchableOpacity> */}
                  </View>
                  <TouchableOpacity style={styles.btnStyle}>
                    <Text style={styles.uploadBtnTxt}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
    
            </View>
    
            {/* Bio */}
            {user?.bio ? (
              <Text style={styles.bio}>{user?.bio || ""}</Text>
            ) : (
              <Text style={styles.noBio}>No bio added yet</Text>
            )}
    
    
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
export default PersonProfile;
