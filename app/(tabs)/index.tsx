import { Colors, primaryButton } from '@/constants/Colors';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { usePlayback } from '@/context/playbackContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatTime } from '@/helpers';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';

export default function Main() {
  const {
    position, // In seconds
    duration, // In seconds
    title,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    handleSlidingComplete,
  } = usePlayback();
  const scheme = useColorScheme();
  const styles = getStyles(scheme ?? 'dark');

  return (
    <View style={styles.container}>
      {!title ? (
        <>
          <Text style={styles.title}>Music Player</Text>
          <Text style={styles.track}>No track playing</Text>
        </>
      ) : (
        <View style={styles.card}>
          {/* <Image source={{ uri: albumArt }} style={styles.albumArt} /> */}
          <View style={styles.cdContainer}>
            <View style={styles.outerDisc}>
              <View style={styles.middleDisc}>
                <View style={styles.innerDisc}></View>
              </View>
            </View>
          </View>

          <View
            style={{ marginBottom: '10%', alignItems: 'center', width: '90%' }}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.artist}>Unknown Artist</Text>

            {/* Progress Bar */}
            <Slider
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={handleSlidingComplete}
              minimumTrackTintColor={Colors[scheme ?? 'dark'].progressBg}
              maximumTrackTintColor="#666"
              thumbTintColor={Colors[scheme ?? 'dark'].progressBg}
              style={{ width: '100%', height: 50, zIndex: 999 }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text style={{ color: Colors[scheme ?? 'dark'].subText }}>
                {formatTime(position)}
              </Text>
              <Text style={{ color: Colors[scheme ?? 'dark'].subText }}>
                {formatTime(duration)}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={playPrevious}
                style={{
                  ...styles.controlButton,
                }}
              >
                <Ionicons
                  name="play-skip-back"
                  size={32}
                  color={Colors[scheme ?? 'dark'].secondaryButtonText}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlay}
                style={{
                  ...styles.playButton,
                  ...primaryButton[scheme ?? 'dark'],
                }}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color={Colors[scheme ?? 'dark'].primaryButtonText}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={playNext}
                style={{
                  ...styles.controlButton,
                }}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={32}
                  color={Colors[scheme ?? 'dark'].secondaryButtonText}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[scheme].background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    cdContainer: {
      backgroundColor: Colors[scheme].disc,
      borderRadius: 20,
      padding: 85,
      alignItems: 'center',
      marginTop: '30%',
    },
    card: {
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: Colors[scheme].text,
      textAlign: 'center',
    },
    artist: {
      fontSize: 16,
      color: Colors[scheme].subText,
      marginBottom: 56,
      textAlign: 'center',
    },
    track: {
      color: Colors[scheme].track,
      fontSize: 18,
      marginBottom: 40,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '80%',
    },
    controlButton: {
      padding: 14,
      borderRadius: 50,
    },
    playButton: {
      padding: 20,
      borderRadius: 50,
      marginHorizontal: 20,
    },
    outerDisc: {
      width: 180,
      height: 180,
      borderRadius: 90,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[scheme].card,
    },
    middleDisc: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[scheme].disc,
    },
    innerDisc: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: Colors[scheme].card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderLetter: {
      fontSize: 32,
      fontWeight: '700',
      color: '#000',
    },
  });
