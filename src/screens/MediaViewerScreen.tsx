import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  ActivityIndicator,
  Text,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

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

  const goToNext = useCallback(() => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, mediaItems.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

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
        const videoUrl = item.video_files[0].link;
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
            resizeMode="contain"
            onLoad={handleLoad}
            onError={handleError}
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

  // Step 2: PanGestureHandler for vertical swipe navigation
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
      <PanGestureHandler
        onHandlerStateChange={onHandlerStateChange}
        minDist={10}
      >
        <View style={styles.mediaContainer}>
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
        </View>
      </PanGestureHandler>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={closeViewer}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <View style={styles.closeIcon} />
      </TouchableOpacity>

      {/* Navigation controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
        >
          <View style={styles.arrowUp} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={goToNext}
          disabled={currentIndex === mediaItems.length - 1}
        >
          <View style={styles.arrowDown} />
        </TouchableOpacity>
      </View>
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
  thumbnail: {
    position: 'absolute',
    zIndex: 0,
    bottom: 0,
  },
  inactiveMedia: {
    opacity: 0,
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
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    width: 14,
    height: 14,
    borderLeftWidth: 2,
    borderLeftColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'white',
    transform: [{ rotate: '-45deg' }],
  },
  navigationContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -50 }],
    zIndex: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  prevButton: {
    marginBottom: 20,
  },
  nextButton: {
    marginTop: 20,
  },
  arrowUp: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    marginBottom: 4,
  },
  arrowDown: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: 4,
  },
});

export default MediaViewerScreen;
