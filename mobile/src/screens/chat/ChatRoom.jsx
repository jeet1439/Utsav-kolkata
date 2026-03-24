import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import socket, { SERVER_URL } from '../../store/socketService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg: "#F5F6FA",
  white: "#FFFFFF",
  primary: "#8B3DFF",
  primaryLight: "#F3E8FF",
  primaryText: "#9333EA",
  textDark: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  border: "#F1F5F9",
};

const ChatRoom = ({ route, navigation }) => {
  const { chatRoomId, chatName, otherAvatar } = route?.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages and join socket room
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);

      try {
        const res = await axios.get(`${SERVER_URL}/api/chat/messages/${chatRoomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (error) {
        console.log('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }

      // Join the socket room
      socket.emit('joinRoom', chatRoomId);
    };

    init();

    return () => {
      socket.emit('leaveRoom', chatRoomId);
    };
  }, [chatRoomId]);

  // Listen for real-time messages
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (message.chatRoomId === chatRoomId) {
        setMessages(prev => [...prev, message]);
        setIsOtherTyping(false);
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId !== currentUserId) {
        setIsOtherTyping(true);
      }
    };

    const handleStopTyping = ({ userId }) => {
      if (userId !== currentUserId) {
        setIsOtherTyping(false);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);
    socket.on('userStopTyping', handleStopTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
      socket.off('userStopTyping', handleStopTyping);
    };
  }, [chatRoomId, currentUserId]);

  const handleInputChange = useCallback((text) => {
    setInputText(text);

    if (text.trim()) {
      socket.emit('typing', { chatRoomId, userId: currentUserId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { chatRoomId, userId: currentUserId });
      }, 2000);
    } else {
      socket.emit('stopTyping', { chatRoomId, userId: currentUserId });
    }
  }, [chatRoomId, currentUserId]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    const username = await AsyncStorage.getItem('username');

    socket.emit('sendMessage', {
      chatRoomId,
      senderId: userId,
      text: inputText.trim(),
      senderInfo: {
        _id: userId,
        username: username || 'Me',
      },
    });

    setInputText('');
    socket.emit('stopTyping', { chatRoomId, userId: currentUserId });
  }, [inputText, chatRoomId, currentUserId]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const senderId = item.senderId?._id || item.senderId;
    const isMe = senderId === currentUserId;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{chatName || 'Chat'}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            {otherAvatar ? (
              <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
            ) : null}
            <Text style={styles.headerTitle}>{chatName || 'Chat'}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-outline" size={48} color={C.border} />
              <Text style={styles.emptyChatText}>Say hi! 👋</Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        {isOtherTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{chatName} is typing...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={C.textLight}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={C.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
  },
  placeholder: {
    width: 34,
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperOther: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: C.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: C.white,
  },
  messageTextOther: {
    color: C.textDark,
  },
  messageTime: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 4,
  },
  messageTimeMe: {
    alignSelf: 'flex-end',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 13,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  input: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: C.textDark,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: C.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: C.primaryLight,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 10,
  },
  emptyChatText: {
    fontSize: 16,
    color: C.textMuted,
    fontWeight: '500',
  },
});

export default ChatRoom;