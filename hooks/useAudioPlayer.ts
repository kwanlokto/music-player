import { useEffect, useState } from 'react';
import TrackPlayer, {
  Event,
  PlayerCommand,
  RepeatMode,
  type MediaItem,
  useActiveMediaItem,
  useIsPlaying,
  useProgress,
} from '@rntp/player';

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Provider component that wraps the app and manages linked-list audio playback.
 */
export const useCustomAudioPlayer = () => {
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const isPlaying = useIsPlaying();
  const { position, duration } = useProgress(0.1);
  const activeTrack = useActiveMediaItem();

  useEffect(() => {
    const setup = async () => {
      try {
        TrackPlayer.setupPlayer({
          handleAudioBecomingNoisy: true,
          android: {
            wakeMode: 'network',
            taskRemovedBehavior: 'continue',
          },
        });
        TrackPlayer.setCommands({
          capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Stop,
            PlayerCommand.Seek,
          ],
        });
        TrackPlayer.setRepeatMode(RepeatMode.All);
      } catch {}

      const savedQueue = await AsyncStorage.getItem('trackQueue');
      if (savedQueue) {
        const tracks: MediaItem[] = JSON.parse(savedQueue);
        if (tracks.length > 0) {
          TrackPlayer.setMediaItems(tracks);
          setQueue(tracks);
        }
      }
    };

    setup();

    // Cleanup
    return () => {
      TrackPlayer.clear();
    };
  }, []);

  // Persist the queue whenever it changes
  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(
      Event.QueueChanged,
      () => {
        const updatedQueue = TrackPlayer.getQueue();
        setQueue(updatedQueue);
        AsyncStorage.setItem('trackQueue', JSON.stringify(updatedQueue));
      },
    );

    return () => subscription.remove();
  }, []);

  /**
   * Plays a single track immediately.
   * Stops any currently playing track.
   * Automatically sets up next track when finished.
   * @param index Index of the track in the queue to play
   */
  const playTrack = async (index: number) => {
    try {
      TrackPlayer.skipToIndex(index);
      TrackPlayer.play();
    } catch (e) {
      console.error('Error playing track:', e);
    }
  };

  /**
   * Replaces the queue with the given tracks.
   * @param tracks Array of MediaItem objects
   */
  const addToQueue = async (tracks: MediaItem[]) => {
    TrackPlayer.setMediaItems(tracks);
    setQueue(tracks);
  };

  /**
   * Plays the next track in the queue.
   */
  const playNext = async () => {
    TrackPlayer.skipToNext();
  };

  /**
   * Plays the previous track in the queue, if available.
   */
  const playPrevious = async () => {
    TrackPlayer.skipToPrevious();
  };

  const handleSlidingComplete = async (value: number) => {
    TrackPlayer.seekTo(value); // TrackPlayer uses seconds
  };

  /**
   * Toggles playback of the current track.
   * Pauses if playing, resumes if paused.
   */
  const togglePlay = async () => {
    if (isPlaying) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  };

  /**
   * Stops playback completely
   */
  const stopTrack = async () => {
    TrackPlayer.stop();
    await AsyncStorage.removeItem('currentTrack');
    await AsyncStorage.removeItem('trackQueue');
  };

  return {
    title: activeTrack?.title,
    isPlaying,
    position,
    duration,
    queue,
    playTrack,
    addToQueue,
    playNext,
    playPrevious,
    handleSlidingComplete,
    togglePlay,
    stopTrack,
  };
};
