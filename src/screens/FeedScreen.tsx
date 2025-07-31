import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, ViewToken } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMedia } from '../api/pexels';
import { MediaItem, MediaType } from '../types/pexels';
import MediaCard from '../components/MediaCard';
import { RootStackParamList } from '../../App';

const NUM_COLUMNS = 2;

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

  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<MediaItem>[];
      changed: ViewToken<MediaItem>[];
    }) => {
      // Find the video item closest to the center of the screen
      const videoViewables = viewableItems.filter((vi: any) => vi.item.type === 'Video');
      if (videoViewables.length === 0) {
        setActiveVideoId(null);
        return;
      }
      // Pick the video whose index is closest to the middle of the visible items
      const centerIndex = Math.floor(videoViewables.length / 2);
      setActiveVideoId(videoViewables[centerIndex].item.id);
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 100, // Only consider items that are fully visible
    minimumViewablePercent: 100,
    waitForInteraction: true,
  };

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <MediaCard
        item={item}
        onPress={() => handleMediaPress(item)}
        shouldPlayVideo={item.type === MediaType.Video ? item.id === activeVideoId : false}
      />
    ),
    [handleMediaPress, activeVideoId]
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
        windowSize={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
