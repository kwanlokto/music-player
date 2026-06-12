import 'react-native-reanimated';

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
} from 'expo-router';
import { useEffect, useState } from 'react';

import { PlaybackProvider } from '@/context/playbackContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [initialLinkHandled, setInitialLinkHandled] = useState(false);

  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (url === 'trackplayer://notification.click') {
        // Only navigate if not already on tabs
        router.replace('/(tabs)');
      }
      setInitialLinkHandled(true);
    };

    const subscription = Linking.addListener('url', handleDeepLink);

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      } else {
        setInitialLinkHandled(true); // no initial URL, ready to render
      }
    })();

    return () => subscription.remove();
  }, [router]);

  // Wait until fonts are loaded and initial deep link is handled
  if (!loaded || !initialLinkHandled) return null;

  return (
    <PlaybackProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PlaybackProvider>
  );
}
