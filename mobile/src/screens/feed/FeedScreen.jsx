import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    Text,
    TouchableOpacity,
    Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { jwtDecode } from "jwt-decode";
import MemoryCard from "../../components/memoryCard";
import { buildApiUrl } from "../../constants/api";

const PAGE_SIZE = 5;

const getTokenUserId = (token) => {
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded?.userId || decoded?.id || decoded?._id || null;
    } catch (error) {
        console.warn("Could not decode user token:", error);
        return null;
    }
};

const FeedScreen = () => {
    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [deletingMemoryId, setDeletingMemoryId] = useState(null);

    const fetchFeed = useCallback(async (pageNumber = 1, isRefresh = false) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const tokenUserId = getTokenUserId(token);
            if (tokenUserId) setCurrentUserId(String(tokenUserId));

            const res = await axios.get(
                buildApiUrl(`/api/feed?page=${pageNumber}&limit=${PAGE_SIZE}`),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newData = (res.data.data || []).map((item) => ({
                ...item,
                isOwner: item.isOwner || String(item.userId) === String(tokenUserId),
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
    }, []);

    useEffect(() => {
        fetchFeed(1, true);
    }, [fetchFeed]);

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

    const handleDeleteMemory = async (item) => {
        if (!item?._id || !item?.pandalId || deletingMemoryId) return;

        try {
            setDeletingMemoryId(item._id);
            const token = await AsyncStorage.getItem("token");

            await axios.delete(
                buildApiUrl(`/api/pandals/${item.pandalId}/featured/${item._id}`),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFeed((prev) => prev.filter((post) => post._id !== item._id));
        } catch (error) {
            console.error("Feed delete memory failed:", error);
            Alert.alert("Could not delete memory", "Please try again.");
        } finally {
            setDeletingMemoryId(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.memoryItem}>
            <MemoryCard
                item={item}
                pandalId={item.pandalId}
                onDelete={handleDeleteMemory}
                deleting={deletingMemoryId === item._id}
                currentUserId={currentUserId}
            />
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
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                    loading ? (
                        <ActivityIndicator size="small" color="#262626" style={styles.loader} />
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#262626"
                    />
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
    listContent: {
        paddingTop: 12,
        paddingBottom: 24,
    },
    memoryItem: {
        paddingHorizontal: 12,
    },
    loader: {
        marginVertical: 20,
    },
});

export default FeedScreen;
