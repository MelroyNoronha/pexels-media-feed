import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
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
import { 
  PanGestureHandler, 
  State, 
  TapGestureHandler, 
  PinchGestureHandler,
  GestureHandlerRootView 
} from 'react-native-gesture-handler';

import { RootStackParamList } from '../../App';
import { MediaItem, MediaType } from '../types/pexels';
import { getBestVideoUrl } from '../api/pexels';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

type Props = NativeStackScreenProps<RootStackParamList, 'MediaViewer'>;

const MediaViewerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { initialIndex, mediaItems } = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const doubleTapRef = useRef<any>(null);
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

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const closeViewer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY: ty } = event.nativeEvent;
      
      if (Math.abs(ty) > SWIPE_THRESHOLD) {
        // Swipe down to close
        if (ty > 0) {
          closeViewer();
        }
      } else {
        // Return to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
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

  const MediaComponent = React.memo(({ 
    item, 
    isActive, 
    onLoad = () => {}, 
    onError = () => {},
    style 
  }: { 
    item: MediaItem; 
    isActive: boolean; 
    onLoad?: () => void; 
    onError?: () => void;
    style?: StyleProp<ViewStyle>;
  }) => {
    const baseScale = useRef(new Animated.Value(1)).current;
    const pinchScale = useRef(new Animated.Value(1)).current;
    const scale = Animated.multiply(baseScale, pinchScale);
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const lastOffset = useRef({ x: 0, y: 0 });
    const lastScale = useRef(1);

    const onPinchGestureEvent = Animated.event(
      [{ nativeEvent: { scale: pinchScale } }],
      { useNativeDriver: true }
    );

    const onPanGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            translationX: translateX,
            translationY: translateY,
          },
        },
      ],
      { useNativeDriver: true }
    );

    const onPinchHandlerStateChange = (event: any) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        lastScale.current *= event.nativeEvent.scale;
        baseScale.setValue(lastScale.current);
        pinchScale.setValue(1);
      }
    };

    const onPanHandlerStateChange = (event: any) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        lastOffset.current = {
          x: lastOffset.current.x + event.nativeEvent.translationX,
          y: lastOffset.current.y + event.nativeEvent.translationY,
        };
        translateX.setOffset(lastOffset.current.x);
        translateX.setValue(0);
        translateY.setOffset(lastOffset.current.y);
        translateY.setValue(0);
      }
    };

    const resetImage = () => {
      Animated.parallel([
        Animated.spring(baseScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        lastScale.current = 1;
        lastOffset.current = { x: 0, y: 0 };
        baseScale.setValue(1);
        pinchScale.setValue(1);
        translateX.setOffset(0);
        translateX.setValue(0);
        translateY.setOffset(0);
        translateY.setValue(0);
      });
    };
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
      const videoUrl = getBestVideoUrl(item);
      const thumbnailUrl = item.video_pictures?.[0]?.picture || '';
      
      return (
        <View style={[styles.mediaContainer, style]}>
          <Video
            source={{ uri: videoUrl }}
            style={styles.media}
            useNativeControls
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
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
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
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
          minPointers={1}
          maxPointers={2}
          avgTouches
        >
          <Animated.View style={styles.pinchContainer}>
            <PinchGestureHandler
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <Animated.View
                style={[
                  styles.pinchContent,
                  {
                    transform: [
                      { scale },
                      { translateX },
                      { translateY },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: item.src.large2x }}
                  style={styles.media}
                  resizeMode='contain'
                  onLoad={handleLoad}
                  onError={handleError}
                />
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
        
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
        
        {lastScale.current > 1 && (
          <TouchableOpacity 
            style={styles.resetZoomButton}
            onPress={resetImage}
          >
            <Text style={styles.resetZoomText}>Reset Zoom</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  });

  const handleDoubleTap = useCallback(() => {
    if (currentItem.type === MediaType.Video) {
      setIsPaused(prev => !prev);
    }
  }, [currentItem]);
  
  const handleSwipeUp = useCallback(() => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [currentIndex, mediaItems.length]);
  
  const handleSwipeDown = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      closeViewer();
    }
  }, [currentIndex]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minDist={10}
        minPointers={1}
        maxPointers={1}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <TapGestureHandler
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE) {
                // Single tap - could be used to toggle controls
              }
            }}
            waitFor={doubleTapRef}
          >
            <TapGestureHandler
              ref={doubleTapRef}
              maxDelayMs={250}
              numberOfTaps={2}
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.ACTIVE) {
                  handleDoubleTap();
                }
              }}
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
                
                <View style={styles.counterContainer}>
                  <Text style={styles.counterText}>
                    {currentIndex + 1} / {mediaItems.length}
                  </Text>
                </View>
              </View>
            </TapGestureHandler>
          </TapGestureHandler>
          
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
  pinchContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinchContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  resetZoomButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  resetZoomText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  counterContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
