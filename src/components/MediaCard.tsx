import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { MediaItem, MediaType } from '../types/pexels';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 2 - 4; // 2px gap

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
  shouldPlayVideo?: boolean;
}

const OPACITY_ANIMATION_DURATION = 800;

const MediaCard: React.FC<MediaCardProps> = ({ item, onPress, shouldPlayVideo }) => {
  const thumbnailUrl =
    item.type === MediaType.Photo ? item.src.medium : item.video_pictures?.[0]?.picture || '';
  const videoUrl = item.type === MediaType.Video ? item.video_files[0]?.link : '';
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const imageOpacity = useSharedValue(1);
  const videoOpacity = useSharedValue(0);

  useEffect(() => {
    if (item.type === MediaType.Video && shouldPlayVideo) {
      // When video should play, start with image visible
      imageOpacity.value = 1;
      videoOpacity.value = 0;
    } else {
      // When video should not play, show image
      imageOpacity.value = withTiming(1, { duration: OPACITY_ANIMATION_DURATION });
      videoOpacity.value = withTiming(0, { duration: OPACITY_ANIMATION_DURATION });
      setVideoLoaded(false);
    }
  }, [shouldPlayVideo, item.type]);

  // Animate transition when video loads
  useEffect(() => {
    if (videoLoaded) {
      imageOpacity.value = withTiming(0, { duration: OPACITY_ANIMATION_DURATION });
      videoOpacity.value = withTiming(1, { duration: OPACITY_ANIMATION_DURATION });
    }
  }, [videoLoaded]);

  const animatedImageStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));
  const animatedVideoStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value }));

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.image, animatedImageStyle]}>
          <Image
            cachePolicy="memory-disk"
            source={{ uri: thumbnailUrl }}
            style={[styles.image]}
            contentFit="cover"
          />
        </Animated.View>
        {item.type === MediaType.Video && shouldPlayVideo && (
          <Animated.View style={[styles.image, animatedVideoStyle]}>
            <Video
              source={{ uri: videoUrl }}
              style={styles.image}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isMuted
              isLooping
              onLoad={status => setVideoLoaded(status.isLoaded)}
            />
          </Animated.View>
        )}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default React.memo(MediaCard);
