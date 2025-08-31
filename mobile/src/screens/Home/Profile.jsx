import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Profile = () => {
  const [user, setUser] = useState(null);

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);
  
  
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
        {/* Header row */}
        <View style={styles.headerRow}>
          {/* Left: Profile pic + username + button */}
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
             
              <TouchableOpacity style={styles.btnStyle}>
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
  width: 120, 
  height: 120,
  borderRadius: 5,
  margin: 5,
},
uploadBtnTxt: {
  fontSize: 15,
  fontWeight: "400"
}
});

export default Profile;
