import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Image,
  TextInput
} from 'react-native';

const C = {
  bg: "#FFFFFF", 
  primary: "#000000", 
  primaryText: "#000000",
  textDark: "#111827",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  searchBg: "#F3F4F6",
  border: "#F3F4F6",
};

const DUMMY_CHATS = [
  { 
    id: '1', 
    name: 'Aarav Sharma', 
    lastMessage: 'Let mee free!', 
    time: '10:30 AM', 
    unread: 2,
    avatar: 'https://i.pravatar.cc/150?u=aarav' 
  },
  { 
    id: '2', 
    name: 'Product Team', 
    lastMessage: 'The new mockups look great.', 
    time: '09:15 AM', 
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?u=product' 
  },
  { 
    id: '3', 
    name: 'Ishaan Patel', 
    lastMessage: 'See you tomorrow 👋', 
    time: 'Yesterday', 
    unread: 0, 
    avatar: 'https://i.pravatar.cc/150?u=ishaan' 
  },
  { 
    id: '4', 
    name: 'Ananya Iyer', 
    lastMessage: 'Can you send over the files?', 
    time: 'Tuesday', 
    unread: 1, 
    avatar: 'https://i.pravatar.cc/150?u=ananya' 
  },
  { 
    id: '5', 
    name: 'Vihaan Gupta', 
    lastMessage: 'The API is finally working 🚀', 
    time: '11:45 AM', 
    unread: 5, 
    avatar: 'https://i.pravatar.cc/150?u=vihaan' 
  },
  { 
    id: '6', 
    name: 'Saanvi Reddy', 
    lastMessage: 'Are we still meeting at 5?', 
    time: '08:20 AM', 
    unread: 0, 
    avatar: 'https://i.pravatar.cc/150?u=saanvi' 
  },
  { 
    id: '7', 
    name: 'Arjun Mehra', 
    lastMessage: 'Check out this repo link.', 
    time: 'Yesterday', 
    unread: 0, 
    avatar: 'https://i.pravatar.cc/150?u=arjun' 
  },
  { 
    id: '8', 
    name: 'Diya Malhotra', 
    lastMessage: 'Happy Birthday!', 
    time: 'Monday', 
    unread: 3, 
    avatar: 'https://i.pravatar.cc/150?u=diya' 
  },
  { 
    id: '9', 
    name: 'Kabir Singh', 
    lastMessage: 'I updated the Redis config.', 
    time: '2:30 PM', 
    unread: 0, 
    avatar: 'https://i.pravatar.cc/150?u=kabir' 
  },
  { 
    id: '10', 
    name: 'Myra Kulkarni', 
    lastMessage: 'Can we hop on a quick call?', 
    time: '1:15 PM', 
    unread: 1, 
    avatar: 'https://i.pravatar.cc/150?u=myra' 
  },
  { 
    id: '11', 
    name: 'Rohan Varma', 
    lastMessage: 'The production build is ready.', 
    time: 'Yesterday', 
    unread: 0, 
    avatar: 'https://i.pravatar.cc/150?u=rohan' 
  },
  { 
    id: '12', 
    name: 'Aditi Joshi', 
    lastMessage: 'Let’s grab coffee soon.', 
    time: 'Sunday', 
    unread: 0, 
    avatar: 'https://i.pravatar.cc/150?u=aditi' 
  },
];

const ChatsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatRow}
      activeOpacity={0.6}
      onPress={() => navigation?.navigate('ChatRoom', { chatName: item.name })}
    >
      {/* Avatar Image */}
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.avatar} 
      />

      {/* Chat Details */}
      <View style={styles.chatDetails}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text 
            style={[styles.lastMessage, item.unread > 0 && styles.lastMessageUnread]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Utsav kolkata</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor={C.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={DUMMY_CHATS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: C.bg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textDark,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInput: {
    backgroundColor: C.searchBg,
    borderRadius: 12, // Pill-like soft edges
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: C.textDark,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  chatRow: {
    flexDirection: 'row',
    paddingVertical: 14, // Spaced out instead of boxed in cards
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.border, // Fallback color while loading
    marginRight: 16,
  },
  chatDetails: {
    flex: 1,
    borderBottomWidth: 1, // Optional: subtle separator line
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
  },
  chatTime: {
    fontSize: 13,
    color: C.textLight,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    color: C.textMuted,
    flex: 1,
    paddingRight: 15,
  },
  lastMessageUnread: {
    color: C.textDark,
    fontWeight: '500', // Make the text pop slightly if unread
  },
  unreadBadge: {
    backgroundColor: C.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: C.bg,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ChatsScreen;