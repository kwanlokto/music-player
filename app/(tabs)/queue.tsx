import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CustomFlatList } from '@/components/CustomFlatList';
import { Colors } from '@/constants/Colors';
import { usePlayback } from '@/context/playbackContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function QueuePage() {
  const { title, isPlaying, queue, playTrack } = usePlayback();

  const scheme = useColorScheme();
  const styles = getStyles(scheme ?? 'dark');

  // Optionally, function to jump to a track in the queue
  const handlePlayTrack = async (index: number) => {
    await playTrack(index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playback Queue</Text>
      <CustomFlatList
        data={queue}
        keyExtractor={(item, index) => `${item.mediaId}-${index}`}
        renderItem={({ item, index }) => {
          const isSongPlaying = item.title === title && isPlaying;

          return (
            <TouchableOpacity
              style={[
                styles.row,
                isSongPlaying && { backgroundColor: '#2c2c2c' }, // highlight row
              ]}
              onPress={() => handlePlayTrack(index)}
            >
              <Text numberOfLines={1} style={[styles.songTitle]}>
                {isSongPlaying ? '[ Now Playing ]    ' : ''}
                {item.title || 'Untitled'}
              </Text>
              <Text style={[styles.songArtist]}>
                {item.artist || 'Unknown Artist'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
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
      paddingVertical: 8,
      paddingHorizontal: 20,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors[scheme].text,
    },
    songArtist: {
      fontSize: 13,
      color: Colors[scheme].subText,
      marginTop: 2,
    },
  });
