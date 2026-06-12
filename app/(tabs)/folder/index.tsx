import * as MediaLibrary from 'expo-media-library/legacy';

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CustomFlatList } from '@/components/CustomFlatList';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { capitalize } from '@/helpers';
import { useRouter } from 'expo-router';

export default function FolderListScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState<string[]>([]);
  const scheme = useColorScheme();
  const styles = getStyles(scheme ?? 'dark');

  const loadFolders = async () => {
    try {
      // Get all audio assets (can paginate if needed)
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
      });

      const musicAssets = media.assets.filter(asset =>
        asset.uri.toLowerCase().includes('/music/'),
      );

      // Map assets to their immediate parent folder
      const folderMap: Record<string, string> = {};
      musicAssets.forEach(asset => {
        const parts = asset.uri.split('/');
        // -2 gives parent folder name, -1 is file name
        const folderName = parts[parts.length - 2];
        const folderPath = parts.slice(0, parts.length - 1).join('/');
        folderMap[folderPath] = folderName;
      });

      setFolders(Object.values(folderMap));
    } catch (err) {
      console.log('Error loading music folders:', err);
    }
  };

  useEffect(() => {
    const requestPermissionAndLoad = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        loadFolders();
      } else {
        console.warn('Permission not granted:', status);
      }
    };
    requestPermissionAndLoad();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music folders</Text>
      <CustomFlatList
        data={folders}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/folder/${item}`)}
          >
            <Text style={styles.folderText} numberOfLines={1}>
              {capitalize(item)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// TODO: create global styles
const getStyles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[scheme].background,
      paddingTop: 65,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 16,
      paddingHorizontal: 20,
      color: Colors[scheme].text,
    },
    row: {
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    folderText: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors[scheme].text,
    },
  });
