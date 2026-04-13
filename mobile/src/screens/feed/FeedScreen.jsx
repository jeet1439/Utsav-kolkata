import React, { useEffect, useState } from "react";
import {
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    Text,
    Image,
    TouchableOpacity,
    Dimensions
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons"; // Using only Ionicons now
import { buildApiUrl } from "../../constants/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const PAGE_SIZE = 5;
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const { width } = Dimensions.get("window");

const FeedScreen = () => {
    const navigation = useNavigation();
    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [likingId, setLikingId] = useState(null);

    const fetchFeed = async (pageNumber = 1, isRefresh = false) => {
        if (loading) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await axios.get(buildApiUrl(`/api/feed?page=${pageNumber}&limit=${PAGE_SIZE}`),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Injecting a stable random view count
            const newData = (res.data.data || []).map(item => ({
                ...item,
                viewsCount: item.viewsCount || Math.floor(Math.random() * 15000) + 120
            }));

            if (isRefresh) {
                setFeed(newData);
            } else {
                setFeed((prev) => [...prev, ...newData]);
            }

            setHasMore(newData.length === PAGE_SIZE);
        } catch (error) {
            console.error("Feed fetch error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFeed(1, true);
    }, []);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchFeed(nextPage);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setHasMore(true);
        setPage(1);
        fetchFeed(1, true);
    };

    const handleToggleLike = async (item) => {
        if (likingId === item._id) return;

        const previousLiked = !!item.isLiked;
        const previousCount = item.likesCount ?? item.likes?.length ?? 0;
        const optimisticLiked = !previousLiked;
        const optimisticCount = optimisticLiked
            ? previousCount + 1
            : Math.max(previousCount - 1, 0);

        setLikingId(item._id);
        setFeed((prev) =>
            prev.map((post) =>
                post._id === item._id
                    ? { ...post, isLiked: optimisticLiked, likesCount: optimisticCount }
                    : post
            )
        );

        try {
            const token = await AsyncStorage.getItem("token");
            const res = await axios.post(
                buildApiUrl(`/api/pandals/${item.pandalId}/featured/${item._id}/like`),
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFeed((prev) =>
                prev.map((post) =>
                    post._id === item._id
                        ? { ...post, isLiked: res.data.liked, likesCount: res.data.likesCount }
                        : post
                )
            );
        } catch (error) {
            console.error("Feed like toggle error:", error);
            setFeed((prev) =>
                prev.map((post) =>
                    post._id === item._id
                        ? { ...post, isLiked: previousLiked, likesCount: previousCount }
                        : post
                )
            );
        } finally {
            setLikingId(null);
        }
    };

    const handleNavigate = (item) => {
        console.log("Navigating to user profile with ID:", item);
        navigation.navigate("PersonProfile", { userId: item.userId }); 
    };

    const renderItem = ({ item }) => (
        <View style={styles.postContainer}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <TouchableOpacity 
                    style={styles.userInfo} 
                    activeOpacity={0.7}
                    onPress={() => handleNavigate(item)}
                >
                    <Image
                        source={{
                            uri: Array.isArray(item.profileImage)
                                ? item.profileImage[0]
                                : item.profileImage || FALLBACK_AVATAR,
                        }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.username}>{item.username || "User"}</Text>
                        {item.pandalTitle ? (
                            <Text style={styles.location}>{item.pandalTitle}</Text>
                        ) : null}
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.moreOptions}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#262626" />
                </TouchableOpacity>
            </View>

            {/* Post Image */}
            <Image source={{ uri: item.url }} style={styles.postImage} resizeMode="cover" />

            {/* Post Actions */}
            <View style={styles.actionRow}>
                <View style={styles.leftActions}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.actionIcon}
                        onPress={() => handleToggleLike(item)}
                        disabled={likingId === item._id}
                    >
                        <Ionicons
                            name={item.isLiked ? "heart" : "heart-outline"}
                            size={28}
                            color={item.isLiked ? "#FF3040" : "#262626"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                        {/* Changed Feather to Ionicons */}
                        <Ionicons name="paper-plane-outline" size={26} color="#262626" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.bookmarkIcon}>
                    {/* Changed Feather to Ionicons */}
                    <Ionicons name="bookmark-outline" size={26} color="#262626" />
                </TouchableOpacity>
            </View>

            {/* Stats: Views & Likes */}
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {item.viewsCount?.toLocaleString()} views • {item.likesCount ?? item.likes?.length ?? 0} likes
                </Text>
            </View>

            {/* Caption */}
            {item.caption ? (
                <View style={styles.captionContainer}>
                    <Text style={styles.captionText}>
                        <Text style={styles.captionUsername} onPress={() => handleNavigate(item)}>
                            {item.username || "User"}{" "}
                        </Text>
                        {item.caption}
                    </Text>
                </View>
            ) : null}

            <Text style={styles.timestamp}>2 HOURS AGO</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.appHeader}>
                <Text style={styles.appTitle}>Utsav Kolkata</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="notifications-outline" size={26} color="#262626" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={feed}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading ? <ActivityIndicator size="small" color="#262626" style={styles.loader} /> : null
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#262626" />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    appHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#DBDBDB",
    },
    appTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000000",
    },
    headerIcons: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerIcon: {
        marginLeft: 20,
    },
    postContainer: {
        backgroundColor: "#FFFFFF",
        paddingBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: "#DBDBDB",
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        borderWidth: 0.5,
        borderColor: "#DBDBDB",
    },
    username: {
        fontWeight: "600",
        fontSize: 13,
        color: "#262626",
    },
    location: {
        fontSize: 11,
        color: "#8E8E8E",
        marginTop: 1,
    },
    moreOptions: {
        paddingHorizontal: 8,
    },
    postImage: {
        width: width,
        height: width, 
        backgroundColor: "#FAFAFA",
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
    },
    leftActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionIcon: {
        marginRight: 16,
    },
    bookmarkIcon: {
        marginRight: 0,
    },
    statsContainer: {
        paddingHorizontal: 14,
        marginBottom: 4,
    },
    statsText: {
        fontWeight: "600",
        fontSize: 13,
        color: "#262626",
    },
    captionContainer: {
        paddingHorizontal: 14,
        marginBottom: 4,
    },
    captionText: {
        fontSize: 13,
        color: "#262626",
        lineHeight: 18,
    },
    captionUsername: {
        fontWeight: "600",
        color: "#262626",
    },
    timestamp: {
        fontSize: 10,
        color: "#8E8E8E",
        paddingHorizontal: 14,
        marginTop: 4,
        letterSpacing: 0.2,
    },
    loader: {
        marginVertical: 20,
    },
});

export default FeedScreen;