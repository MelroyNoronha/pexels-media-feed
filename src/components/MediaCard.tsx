import React from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MediaItem, MediaType } from '../types/pexels';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3 - 4; // 3 items per row with 2px gap

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onPress }) => {
  const thumbnailUrl =
    item.type === MediaType.Photo ? item.src.medium : item.video_pictures?.[0]?.picture || '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image
          cachePolicy="memory-disk"
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
        />
        {item.type === MediaType.Video && (
          <View style={styles.videoIndicator}>
            <View style={styles.playButton}>
              <View style={styles.playTriangle} />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#e0e0e0',
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
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333',
    transform: [{ rotate: '90deg' }],
    marginLeft: 4,
  },
});

export default React.memo(MediaCard);
