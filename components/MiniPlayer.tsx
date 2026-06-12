'use client';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { usePlayback } from '@/context/playbackContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export const MiniPlayer = () => {
  const { title, isPlaying, togglePlay, playNext, playPrevious } =
    usePlayback();
  const scheme = useColorScheme();
  const styles = getStyles(scheme ?? 'dark');

  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.title}>
        {title ?? 'No track playing'}
      </Text>

      <View style={styles.controls}>
        <TouchableOpacity onPress={playPrevious} style={styles.button}>
          <Ionicons name="play-skip-back" size={24} color={Colors[scheme ?? 'dark'].text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.button}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={Colors[scheme ?? 'dark'].text}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.button}>
          <Ionicons name="play-skip-forward" size={24} color={Colors[scheme ?? 'dark'].text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: Colors[scheme].background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: -2 },
      zIndex: 999, // Make sure it's above other content
    },
    title: {
      flex: 1,
      color: Colors[scheme].text,
      fontSize: 16,
      fontWeight: '600',
      marginRight: 12,
    },
    controls: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      padding: 6,
    },
  });
