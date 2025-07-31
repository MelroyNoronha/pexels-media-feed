import React from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';

import { MediaItem, MediaType } from '../types/pexels';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 2 - 4; // 2px gap

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
  shouldPlayVideo?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onPress, shouldPlayVideo }) => {
  const thumbnailUrl =
    item.type === MediaType.Photo ? item.src.medium : item.video_pictures?.[0]?.picture || '';

  if (item.type === MediaType.Video && shouldPlayVideo) {
    const videoUrl = item.video_files[0]?.link;
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          <Video
            source={{ uri: videoUrl }}
            style={styles.image}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            isLooping
          />
        </View>
      </TouchableOpacity>
    );
  }
  // fallback to image for photo or non-visible video
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image
          cachePolicy="memory-disk"
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default React.memo(MediaCard);
