import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MediaItem } from './src/types/pexels';

// Screens
import FeedScreen from './src/screens/FeedScreen';
import MediaViewerScreen from './src/screens/MediaViewerScreen';

export type RootStackParamList = {
  Feed: undefined;
  MediaViewer: { 
    initialIndex: number;
    mediaItems: MediaItem[];
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen 
          name="MediaViewer" 
          component={MediaViewerScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
