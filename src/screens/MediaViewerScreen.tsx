import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  ActivityIndicator,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { RootStackParamList } from '../../App';
import { MediaItem, MediaType } from '../types/pexels';

type Props = NativeStackScreenProps<RootStackParamList, 'MediaViewer'>;

const MediaViewerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { initialIndex, mediaItems } = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);

  const currentItem = mediaItems[currentIndex];

  // Preload adjacent media items
  useEffect(() => {
    const preloadItems = [];
    if (currentIndex > 0) preloadItems.push(mediaItems[currentIndex - 1]);
    if (currentIndex < mediaItems.length - 1) preloadItems.push(mediaItems[currentIndex + 1]);

    preloadItems.forEach(item => {
      if (item.type === MediaType.Photo) {
        Image.prefetch(item.src.large2x);
      } else if (item.type === MediaType.Video && item.video_pictures?.[0]?.picture) {
        Image.prefetch(item.video_pictures[0].picture);
      }
    });
  }, [currentIndex, mediaItems]);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (Platform.OS === 'android') {
          closeViewer();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const closeViewer = () => {
    navigation.goBack();
  };

  const MediaComponent = React.memo(
    ({
      item,
      isActive,
      onLoad = () => {},
      onError = () => {},
      style,
    }: {
      item: MediaItem;
      isActive: boolean;
      onLoad?: () => void;
      onError?: () => void;
      style?: StyleProp<ViewStyle>;
    }) => {
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);

      const handleLoad = () => {
        setIsLoading(false);
        onLoad();
      };

      const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        onError();
      };

      if (item.type === MediaType.Video) {
        const videoUrl = item.video_files[1].link;
        const thumbnailUrl = item.video_pictures?.[0]?.picture || '';

        return (
          <View style={[styles.mediaContainer, style]}>
            <Video
              source={{ uri: videoUrl }}
              style={styles.media}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={isActive}
              isMuted={false}
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (!status.isLoaded) {
                  if (status.error) {
                    console.error('Playback error:', status.error);
                    handleError();
                  }
                } else {
                  if (status.didJustFinish) {
                    // Handle video end if needed
                  }
                }
              }}
              onLoadStart={() => setIsLoading(true)}
              onLoad={(status: AVPlaybackStatus) => {
                if (status.isLoaded) {
                  handleLoad();
                }
              }}
              onError={handleError}
              usePoster
              posterSource={{ uri: thumbnailUrl }}
              posterStyle={styles.media}
            />
            {hasError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load video</Text>
              </View>
            )}
          </View>
        );
      }

      // For photos
      return (
        <View style={[styles.mediaContainer, style]}>
          <Image
            source={{ uri: item.src.large2x }}
            style={styles.media}
            contentFit="contain"
            onLoad={handleLoad}
            onError={handleError}
            cachePolicy="memory-disk"
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          {hasError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load image</Text>
            </View>
          )}
        </View>
      );
    }
  );

  // Step 3: Animate media transitions vertically
  const transitionY = useSharedValue(0);
  const prevIndex = useRef(currentIndex);

  useEffect(() => {
    if (currentIndex > prevIndex.current) {
      // Swiped up: animate up
      transitionY.value = 500;
      transitionY.value = withTiming(0, { duration: 250 });
    } else if (currentIndex < prevIndex.current) {
      // Swiped down: animate down
      transitionY.value = -500;
      transitionY.value = withTiming(0, { duration: 250 });
    }
    prevIndex.current = currentIndex;
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: transitionY.value }],
  }));

  // PanGestureHandler for vertical swipe navigation
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY } = event.nativeEvent;
      if (translationY < -50) {
        // Swipe Up: Next media
        if (currentIndex < mediaItems.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else if (translationY > 50) {
        // Swipe Down: Previous media
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
      // No action if swipe is not significant or at edges
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onHandlerStateChange} minDist={10}>
        <Animated.View style={[styles.mediaContainer, animatedStyle]}>
          {currentItem && (
            <MediaComponent
              item={currentItem}
              isActive={true}
              style={styles.media}
              onLoad={() => {
                if (currentItem.type === MediaType.Video) {
                  setIsPaused(false);
                }
              }}
            />
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    zIndex: 1,
  },
  videoThumbnail: {
    alignContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    zIndex: 2,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});

export default MediaViewerScreen;
