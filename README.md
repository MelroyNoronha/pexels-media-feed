# PexelMediaFeed

## Overview

- **FeedScreen** displays a high-performance, virtualized media grid using FlashList, supporting both images and videos.
- **MediaCard** component encapsulates all logic for rendering and transitioning between image and video, handling caching, autoplay, and animations.
- **Video autoplay** is managed so that only one video plays at a time and that viewability detection is debounced for efficiency.
- **expo-image** and **expo-av** are used for optimized image caching and video playback, respectively.
- **Reanimated** powers all animated transitions for a flicker-free UI.
- **MediaViewerScreen** provides a fullscreen, immersive viewing experience for both images and videos, supporting vertical swipe navigation and smooth animated transitions between media items.
- **TikTok style swipe navigation** in the MediaViewerScreen is implemented using react-native-gesture-handler, enabling smooth vertical swipe up/down gestures to seamlessly navigate through all media items.
- **FlashList** for ultra-fast, memory-efficient list rendering.
- **Animated transitions** between image and video for flicker-free UX.
- **Autoplay logic**: Only one video plays at a time, optimized for visibility and performance.
- **Debounced scroll event handling** for resource-efficient viewability tracking and maintaining a smooth scrolling experience.
- **React Native New Architecture** (Fabric + TurboModules) and Hermes JS engine enabled for maximum performance.
- All navigation and gesture handling is implemented with React Navigation’s native stack, supporting native gestures and safe area handling.

---

## Running the App

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **iOS setup:**

   ```sh
   cd ios
   pod install
   cd ..
   ```

3. **Build a development client (required for new architecture):**

   - For iOS:
     ```sh
     expo run:ios
     ```
   - For Android:
     ```sh
     expo run:android
     ```

   > **Note:** The new architecture and FlashList v2 require a development build. Expo Go is not supported.

4. **Start the Metro bundler:**
   ```sh
   npm start
   ```

---

## Media Handling & Performance Techniques

### FlashList for Efficient Rendering

- The feed uses [`@shopify/flash-list`](https://shopify.github.io/flash-list/) instead of FlatList for rendering large lists of media items.
- FlashList v2 leverages the new React Native architecture and Hermes for optimal speed and memory usage.

### Image Caching with expo-image

- All images are rendered using `expo-image` with `cachePolicy="memory-disk"`, ensuring fast, reliable caching across sessions.

### Video Playback & Autoplay Optimization

- Videos are rendered with `expo-av` and display a thumbnail poster until playback is ready.
- **Autoplay logic:** Only the video most visible in the viewport will play at any time, reducing resource usage and preventing multiple videos from playing simultaneously.
- Poster images are shown while the video loads, with a smooth fade transition to the video when ready.

### Animated Transitions

- Transitions between image and video are handled using `react-native-reanimated`, providing a flicker-free, smooth fade effect.

### Debounced Scroll Optimization

- The feed’s viewability detection (used to trigger video autoplay) is **debounced** using `lodash.debounce`.
- This reduces the frequency of state updates and re-renders during fast scrolling, improving both performance and battery life.

---
