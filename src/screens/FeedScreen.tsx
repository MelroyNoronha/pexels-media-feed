import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMedia } from '../api/pexels';
import { MediaItem } from '../types/pexels';
import MediaCard from '../components/MediaCard';
import { RootStackParamList } from '../../App';

const NUM_COLUMNS = 3;

const FeedScreen: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadMedia = useCallback(async (pageNum: number, isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await fetchMedia(pageNum);

      if (isRefreshing || pageNum === 1) {
        setMedia(response.media);
      } else {
        setMedia(prev => [...prev, ...response.media]);
      }

      setHasMore(response.media.length > 0);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    loadMedia(1, true);
    setPage(1);
  }, [loadMedia]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMedia(nextPage);
    }
  }, [loading, hasMore, page, loadMedia]);

  const handleMediaPress = useCallback(
    (item: MediaItem) => {
      navigation.navigate('MediaViewer', {
        initialIndex: media.findIndex(m => m.id === item.id),
        mediaItems: media,
      });
    },
    [media, navigation]
  );

  useEffect(() => {
    loadMedia(1);
  }, [loadMedia]);

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <MediaCard item={item} onPress={() => handleMediaPress(item)} />
    ),
    [handleMediaPress]
  );

  const renderFooter = useCallback(() => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }, [loading]);

  if (loading && media.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={media}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={NUM_COLUMNS}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={100}
        initialNumToRender={12}
        windowSize={11}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 1, // For the gap between items
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  loadingContainer: {
    padding: 16,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default React.memo(FeedScreen);
