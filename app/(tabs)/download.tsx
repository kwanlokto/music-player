import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { Colors, primaryButton } from '@/constants/Colors';

const COBALT_API = 'https://api.cobalt.tools/';

type DownloadStatus = 'idle' | 'fetching' | 'downloading' | 'saving' | 'done' | 'error';

export default function DownloadScreen() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const scheme = useColorScheme() ?? 'dark';
  const styles = getStyles(scheme);

  const handleDownload = async () => {
    if (!url.trim()) return;

    setStatus('fetching');
    setProgress(0);
    setErrorMsg('');

    try {
      const { status: permStatus } = await MediaLibrary.requestPermissionsAsync(true);
      if (permStatus !== 'granted') {
        throw new Error('Media library permission is required to save downloads');
      }

      const response = await fetch(COBALT_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          downloadMode: 'audio',
          audioFormat: 'mp3',
          filenameStyle: 'basic',
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'error' || !data.url) {
        throw new Error(data.error?.code ?? 'Could not get a download URL from cobalt');
      }

      // cobalt may return "picker" with multiple audio streams; pick the first
      const downloadUrl: string =
        data.status === 'picker' ? data.picker[0].url : data.url;

      const filename: string = data.filename ?? `yt_audio_${Date.now()}.mp3`;
      const tempUri = FileSystem.cacheDirectory + filename;

      setStatus('downloading');

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        tempUri,
        {},
        downloadProgress => {
          const total = downloadProgress.totalBytesExpectedToWrite;
          if (total > 0) {
            setProgress(downloadProgress.totalBytesWritten / total);
          }
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('Download failed — no file was written');
      }

      setStatus('saving');

      const asset = await MediaLibrary.createAssetAsync(result.uri);
      const album = await MediaLibrary.getAlbumAsync('YouTubeDownloads');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('YouTubeDownloads', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      setStatus('done');
      setUrl('');
      Alert.alert(
        'Download complete',
        `"${filename}" was saved to the YouTubeDownloads folder.`,
      );
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const isLoading =
    status === 'fetching' || status === 'downloading' || status === 'saving';

  const statusLabel: Record<DownloadStatus, string> = {
    idle: '',
    fetching: 'Fetching audio info...',
    downloading: `Downloading... ${Math.round(progress * 100)}%`,
    saving: 'Saving to library...',
    done: '',
    error: '',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YouTube Download</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste YouTube URL here..."
        placeholderTextColor={Colors[scheme].subText}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        returnKeyType="done"
        onSubmitEditing={handleDownload}
      />

      <TouchableOpacity
        style={[
          primaryButton[scheme],
          styles.button,
          (isLoading || !url.trim()) && styles.buttonDisabled,
        ]}
        onPress={handleDownload}
        disabled={isLoading || !url.trim()}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors[scheme].primaryButtonText} />
        ) : (
          <Text style={[styles.buttonText, { color: Colors[scheme].primaryButtonText }]}>
            Download Audio
          </Text>
        )}
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusLabel[status]}</Text>
          {status === 'downloading' && (
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {status === 'error' && <Text style={styles.errorText}>{errorMsg}</Text>}

      {status === 'done' && (
        <Text style={styles.successText}>
          Saved! Open the Folder tab and look for "YouTubeDownloads".
        </Text>
      )}

      <Text style={styles.hint}>
        Downloads are saved to a "YouTubeDownloads" folder and appear in the Folder tab
        automatically.
      </Text>
    </View>
  );
}

const getStyles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[scheme].background,
      paddingTop: 65,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 24,
      color: Colors[scheme].text,
    },
    input: {
      backgroundColor: Colors[scheme].card,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: Colors[scheme].text,
      borderWidth: 1,
      borderColor: Colors[scheme].border,
      marginBottom: 16,
    },
    button: {
      borderRadius: 10,
      paddingVertical: 14,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    statusContainer: {
      marginTop: 24,
    },
    statusText: {
      color: Colors[scheme].subText,
      fontSize: 14,
      marginBottom: 10,
      textAlign: 'center',
    },
    progressBarBg: {
      height: 6,
      backgroundColor: Colors[scheme].disc,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: Colors[scheme].tint,
      borderRadius: 3,
    },
    errorText: {
      color: '#ff4d4d',
      fontSize: 14,
      marginTop: 16,
      textAlign: 'center',
    },
    successText: {
      color: '#4caf50',
      fontSize: 14,
      marginTop: 16,
      textAlign: 'center',
    },
    hint: {
      color: Colors[scheme].subText,
      fontSize: 13,
      marginTop: 'auto',
      paddingBottom: 40,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
