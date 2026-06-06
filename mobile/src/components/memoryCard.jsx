import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { buildApiUrl } from "../constants/api";

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const getOwnerId = (memory) => {
  const owner = memory?.userId;
  if (!owner) return null;
  if (typeof owner === "string") return owner;
  return owner._id || owner.id || null;
};

const getCommentOwnerId = (comment) => {
  const owner = comment?.userId;
  if (!owner) return null;
  if (typeof owner === "string") return owner;
  return owner._id || owner.id || null;
};

const EmptyComments = () => (
  <View style={styles.emptyComments}>
    <Ionicons name="chatbubble-ellipses-outline" size={32} color="#C7C7C7" />
    <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
    <Text style={styles.emptyCommentsText}>
      Start the conversation on this memory.
    </Text>
  </View>
);

const MemoryCard = ({ item, pandalId, onDelete, deleting, currentUserId }) => {
  const [liked, setLiked] = useState(item.isLiked || false);
  const [likes, setLikes] = useState(item.likesCount || 0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState(Array.isArray(item.comments) ? item.comments : []);
  const [commentCount, setCommentCount] = useState(
    item.commentsCount ?? item.comments?.length ?? 0
  );
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const heartScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(14)).current;

  const navigation = useNavigation();
  const username = item.userId?.username || item.username || "Unknown";
  const avatar = item.userId?.profileImage?.[0] || item.profileImage?.[0] || FALLBACK_AVATAR;
  const memoryOwnerId = getOwnerId(item);
  const memoryPandalId = pandalId || item.pandalId;
  const canManage = Boolean(
    item.isOwner ||
    (memoryOwnerId && currentUserId && String(memoryOwnerId) === String(currentUserId))
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  useEffect(() => {
    setCommentCount(item.commentsCount ?? item.comments?.length ?? 0);
  }, [item.commentsCount, item.comments]);

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.35,
        tension: 220,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 220,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = async () => {
    const newLiked = !liked;
    const nextLikes = newLiked ? likes + 1 : Math.max(likes - 1, 0);

    setLiked(newLiked);
    setLikes(nextLikes);
    animateHeart();

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        buildApiUrl(`/api/pandals/${memoryPandalId}/featured/${item._id}/like`),
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setLiked(res.data.liked);
      setLikes(res.data.likesCount);
    } catch (error) {
      console.error("Like toggle failed:", error);
      setLiked(!newLiked);
      setLikes(likes);
    }
  };

  const handleNavigate = () => {
    if (memoryOwnerId) {
      navigation.navigate("PersonProfile", { userId: String(memoryOwnerId) });
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Memory options",
      "Manage this post.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete memory",
          style: "destructive",
          onPress: () => onDelete?.(item),
        },
      ]
    );
  };

  const getRequestConfig = async () => {
    const token = await AsyncStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    };
  };

  const loadComments = async () => {
    if (!memoryPandalId || !item._id) return;

    try {
      setCommentsLoading(true);
      const config = await getRequestConfig();
      const res = await axios.get(
        buildApiUrl(`/api/pandals/${memoryPandalId}/featured/${item._id}/comments`),
        config
      );
      const nextComments = res.data.comments || [];
      setComments(nextComments);
      setCommentCount(res.data.commentsCount ?? nextComments.length);
    } catch (error) {
      console.error("Load comments failed:", error);
      Alert.alert("Could not load comments", "Please try again.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const openComments = () => {
    setCommentsVisible(true);
    loadComments();
  };

  const closeComments = () => {
    setCommentsVisible(false);
    setCommentText("");
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || commentSubmitting || !memoryPandalId) return;

    try {
      setCommentSubmitting(true);
      const config = await getRequestConfig();
      const res = await axios.post(
        buildApiUrl(`/api/pandals/${memoryPandalId}/featured/${item._id}/comments`),
        { text },
        config
      );

      if (res.data.comment) {
        setComments((prev) => [...prev, res.data.comment]);
      }
      setCommentCount((prev) => res.data.commentsCount ?? prev + 1);
      setCommentText("");
    } catch (error) {
      console.error("Post comment failed:", error);
      Alert.alert("Could not post comment", "Please try again.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const canDeleteComment = (comment) => {
    const commentOwnerId = getCommentOwnerId(comment);
    return Boolean(
      canManage ||
      comment.isOwner ||
      (commentOwnerId && currentUserId && String(commentOwnerId) === String(currentUserId))
    );
  };

  const deleteComment = async (comment) => {
    if (!comment?._id || deletingCommentId || !memoryPandalId) return;

    try {
      setDeletingCommentId(comment._id);
      const config = await getRequestConfig();
      const res = await axios.delete(
        buildApiUrl(
          `/api/pandals/${memoryPandalId}/featured/${item._id}/comments/${comment._id}`
        ),
        config
      );

      setComments((prev) => prev.filter((existing) => existing._id !== comment._id));
      setCommentCount((prev) => res.data.commentsCount ?? Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Delete comment failed:", error);
      Alert.alert("Could not delete comment", "Please try again.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const confirmDeleteComment = (comment) => {
    Alert.alert(
      "Delete comment?",
      "This comment will be removed from the memory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment(comment),
        },
      ]
    );
  };

  const handleCommentAuthorPress = (comment) => {
    const ownerId = getCommentOwnerId(comment);
    if (!ownerId) return;

    setCommentsVisible(false);
    navigation.navigate("PersonProfile", { userId: String(ownerId) });
  };

  const renderComment = ({ item: comment }) => {
    const commentUsername = comment.userId?.username || "User";
    const commentAvatar = comment.userId?.profileImage?.[0] || FALLBACK_AVATAR;
    const removing = deletingCommentId === comment._id;

    return (
      <View style={styles.commentRow}>
        <TouchableOpacity onPress={() => handleCommentAuthorPress(comment)} activeOpacity={0.75}>
          <Image source={{ uri: commentAvatar }} style={styles.commentAvatar} />
        </TouchableOpacity>
        <View style={styles.commentBody}>
          <Text style={styles.commentText}>
            <Text style={styles.commentUsername}>{commentUsername} </Text>
            {comment.text}
          </Text>
          <Text style={styles.commentTime}>
            {comment.createdAt ? moment(comment.createdAt).fromNow() : "Just now"}
          </Text>
        </View>
        {canDeleteComment(comment) && (
          <TouchableOpacity
            style={styles.commentDelete}
            onPress={() => confirmDeleteComment(comment)}
            activeOpacity={0.7}
            disabled={removing}
          >
            {removing ? (
              <ActivityIndicator color="#8E8E8E" size="small" />
            ) : (
              <Ionicons name="trash-outline" size={17} color="#8E8E8E" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.post,
        { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNavigate} style={styles.author} activeOpacity={0.75}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.authorText}>
            <Text style={styles.username} numberOfLines={1}>
              {username}
            </Text>
            <Text style={styles.subline} numberOfLines={1}>
              {item.pandalTitle || "Memory"} - {moment(item.createdAt).fromNow()}
            </Text>
          </View>
        </TouchableOpacity>

        {canManage && (
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={confirmDelete}
            activeOpacity={0.7}
            disabled={deleting}
          >
            <Ionicons
              name={deleting ? "hourglass-outline" : "ellipsis-horizontal"}
              size={20}
              color={deleting ? "#8E8E8E" : "#262626"}
            />
          </TouchableOpacity>
        )}
      </View>

      <Image source={{ uri: item.url }} style={styles.photo} resizeMode="cover" />

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={28}
                color={liked ? "#FF3040" : "#262626"}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={openComments} style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={25} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={26} color="#262626" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={26} color="#262626" />
        </TouchableOpacity>
      </View>

      <View style={styles.meta}>
        <View style={styles.statsRow}>
          <Text style={styles.likesText}>
            {likes === 1 ? "1 like" : `${likes} likes`}
          </Text>
          <TouchableOpacity onPress={openComments} activeOpacity={0.75}>
            <Text style={styles.commentCountText}>
              {commentCount === 1 ? "1 comment" : `${commentCount} comments`}
            </Text>
          </TouchableOpacity>
        </View>

        {item.caption ? (
          <Text style={styles.caption} numberOfLines={3}>
            <Text style={styles.captionUsername}>{username} </Text>
            {item.caption}
          </Text>
        ) : null}

        <TouchableOpacity onPress={openComments} activeOpacity={0.75}>
          <Text style={commentCount > 0 ? styles.commentsLink : styles.addCommentLink}>
            {commentCount > 0
              ? commentCount === 1
                ? "View comment"
                : "View all comments"
              : "Add a comment..."}
          </Text>
        </TouchableOpacity>

        <Text style={styles.timestamp}>
          {moment(item.createdAt).format("MMM D, YYYY")}
        </Text>
      </View>

      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeComments}
      >
        <KeyboardAvoidingView
          style={styles.commentModalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.commentBackdrop}
            activeOpacity={1}
            onPress={closeComments}
          />
          <View style={styles.commentSheet}>
            <View style={styles.commentHandle} />
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity style={styles.commentClose} onPress={closeComments}>
                <Ionicons name="close" size={21} color="#262626" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator color="#FF3040" />
                <Text style={styles.commentsLoadingText}>Loading comments...</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(comment) => comment._id}
                renderItem={renderComment}
                style={styles.commentsList}
                contentContainerStyle={[
                  styles.commentsListContent,
                  comments.length === 0 && styles.commentsListEmpty,
                ]}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={EmptyComments}
              />
            )}

            <View style={styles.commentComposer}>
              <Image source={{ uri: avatar }} style={styles.composerAvatar} />
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#8E8E8E"
                style={styles.commentInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.postCommentButton}
                onPress={submitComment}
                disabled={commentSubmitting || !commentText.trim()}
              >
                {commentSubmitting ? (
                  <ActivityIndicator color="#FF3040" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.postCommentText,
                      !commentText.trim() && styles.postCommentTextDisabled,
                    ]}
                  >
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  post: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EDEDED",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  author: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    marginRight: 10,
    backgroundColor: "#F5F5F5",
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    color: "#262626",
    fontSize: 13,
    fontWeight: "700",
  },
  subline: {
    color: "#8E8E8E",
    fontSize: 11,
    marginTop: 1,
  },
  headerIcon: {
    padding: 8,
    marginLeft: 8,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FAFAFA",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 7,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginRight: 15,
  },
  meta: {
    paddingHorizontal: 12,
    paddingBottom: 13,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 5,
  },
  likesText: {
    color: "#262626",
    fontSize: 13,
    fontWeight: "700",
  },
  commentCountText: {
    color: "#262626",
    fontSize: 13,
    fontWeight: "700",
  },
  caption: {
    color: "#262626",
    fontSize: 13,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: "700",
  },
  commentsLink: {
    color: "#8E8E8E",
    fontSize: 13,
    marginTop: 7,
  },
  addCommentLink: {
    color: "#8E8E8E",
    fontSize: 13,
    marginTop: 7,
  },
  timestamp: {
    color: "#8E8E8E",
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 7,
    textTransform: "uppercase",
  },
  commentModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  commentSheet: {
    height: "72%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  commentHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DADADA",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  commentHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    paddingHorizontal: 12,
  },
  commentTitle: {
    color: "#262626",
    fontSize: 15,
    fontWeight: "700",
  },
  commentClose: {
    position: "absolute",
    right: 8,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsLoadingText: {
    color: "#8E8E8E",
    fontSize: 13,
    marginTop: 10,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentsListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
  },
  commentText: {
    color: "#262626",
    fontSize: 13,
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: "700",
  },
  commentTime: {
    color: "#8E8E8E",
    fontSize: 11,
    marginTop: 4,
  },
  commentDelete: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  emptyComments: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyCommentsTitle: {
    color: "#262626",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyCommentsText: {
    color: "#8E8E8E",
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 18,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    backgroundColor: "#FFFFFF",
  },
  composerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    marginRight: 9,
    marginBottom: 2,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 92,
    borderRadius: 18,
    backgroundColor: "#F7F7F7",
    color: "#262626",
    fontSize: 13,
    paddingHorizontal: 13,
    paddingTop: Platform.OS === "ios" ? 9 : 7,
    paddingBottom: Platform.OS === "ios" ? 9 : 7,
    textAlignVertical: "top",
  },
  postCommentButton: {
    minWidth: 48,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  postCommentText: {
    color: "#FF3040",
    fontSize: 13,
    fontWeight: "700",
  },
  postCommentTextDisabled: {
    color: "#C7C7C7",
  },
});

export default MemoryCard;
