import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import socket, { SERVER_URL } from '../../store/socketService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg: "#FFFFFF", 
  primary: "#8B3DFF",
  primaryLight: "#F3E8FF",
  primaryText: "#000000",
  textDark: "#111827",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  searchBg: "#F3F4F6",
  border: "#F3F4F6",
  online: "#10B981",
};

const ChatsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchRooms = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);

      const res = await axios.get(`${SERVER_URL}/api/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (error) {
      console.log('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Listen for new messages to update the rooms list in real-time
  useEffect(() => {
    const handleNewMessage = (message) => {
      setRooms(prev => {
        const updated = prev.map(room => {
          if (room._id === message.chatRoomId) {
            return { ...room, lastMessage: message.text, updatedAt: message.createdAt };
          }
          return room;
        });
        // Sort by updatedAt descending
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, []);

  // Re-fetch rooms when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRooms();
    });
    return unsubscribe;
  }, [navigation, fetchRooms]);

  const getOtherParticipant = (room) => {
    if (!currentUserId || !room.participants) return {};
    return room.participants.find(p => p._id !== currentUserId) || room.participants[0] || {};
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(room);
    return other.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }) => {
    const other = getOtherParticipant(item);
    const avatar = other.profileImage?.[0];

    return (
      <TouchableOpacity 
        style={styles.chatRow}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('ChatRoom', { 
          chatRoomId: item._id,
          chatName: other.username || 'Chat',
          otherUserId: other._id,
          otherAvatar: avatar,
        })}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {other.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {other.username || 'User'}
            </Text>
            <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Tap to start chatting'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={C.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={C.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredRooms.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubbles-outline" size={60} color={C.border} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Find people nearby and start chatting!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: C.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: C.searchBg,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textDark,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  chatRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.border,
    marginRight: 16,
  },
  avatarFallback: {
    backgroundColor: '#FDBA74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatDetails: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textDark,
    flex: 1,
  },
  chatTime: {
    fontSize: 13,
    color: C.textLight,
    marginLeft: 10,
  },
  lastMessage: {
    fontSize: 14,
    color: C.textMuted,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
  },
});

export default ChatsScreen;