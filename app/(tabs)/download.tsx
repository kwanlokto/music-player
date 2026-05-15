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

import { CustomFlatList } from '@/components/CustomFlatList';
import { Colors, primaryButton } from '@/constants/Colors';
import { formatDuration } from '@/helpers';

const COBALT_API = 'https://api.cobalt.tools/';

// Multiple instances as fallback in case one is down
const INVIDIOUS_INSTANCES = [
  'https://invidious.privacyredirect.com',
  'https://inv.nadeko.net',
  'https://yt.artemislena.eu',
];

type SearchResult = {
  videoId: string;
  title: string;
  author: string;
  duration: number;
};

type InvidiousItem = {
  type: string;
  videoId: string;
  title: string;
  author: string;
  lengthSeconds?: number;
};

type DownloadStage = '' | 'fetching' | 'downloading' | 'saving';

export default function DownloadScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStage, setDownloadStage] = useState<DownloadStage>('');

  const scheme = useColorScheme() ?? 'dark';
  const styles = getStyles(scheme);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);

    let lastError: string | null = null;

    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `${instance}/api/v1/search?q=${encodeURIComponent(query.trim())}&type=video&page=1`,
          { signal: controller.signal },
        );
        clearTimeout(timeout);

        if (!response.ok) continue;

        const data: InvidiousItem[] = await response.json();
        const videos: SearchResult[] = data
          .filter(item => item.type === 'video')
          .slice(0, 20)
          .map(item => ({
            videoId: item.videoId,
            title: item.title,
            author: item.author,
            duration: item.lengthSeconds ?? 0,
          }));

        setResults(videos);
        setSearching(false);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Request failed';
      }
    }

    setSearchError(lastError ?? 'All search servers failed. Please try again.');
    setSearching(false);
  };

  const handleDownload = async (video: SearchResult) => {
    if (downloadingId) return;

    const { status: permStatus } = await MediaLibrary.requestPermissionsAsync(true);
    if (permStatus !== 'granted') {
      Alert.alert(
        'Permission required',
        'Media library permission is needed to save downloaded audio.',
      );
      return;
    }

    setDownloadingId(video.videoId);
    setDownloadProgress(0);
    setDownloadStage('fetching');

    try {
      const response = await fetch(COBALT_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
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
        throw new Error(data.error?.code ?? 'Could not get a download URL');
      }

      const downloadUrl: string =
        data.status === 'picker' ? data.picker[0].url : data.url;

      const safeTitle = video.title.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
      const filename: string = data.filename ?? `${safeTitle || video.videoId}.mp3`;
      const tempUri = `${FileSystem.cacheDirectory}${filename}`;

      setDownloadStage('downloading');

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        tempUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setDownloadProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('Download failed — no file was written');
      }

      setDownloadStage('saving');

      const asset = await MediaLibrary.createAssetAsync(result.uri);
      const album = await MediaLibrary.getAlbumAsync('YouTubeDownloads');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('YouTubeDownloads', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      setDownloadStage('');
      setDownloadingId(null);
      Alert.alert('Downloaded!', `"${video.title}" was saved to YouTubeDownloads.`);
    } catch (err) {
      setDownloadStage('');
      setDownloadingId(null);
      Alert.alert(
        'Download failed',
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    }
  };

  const getStageLabel = (id: string): string => {
    if (downloadingId !== id) return '';
    if (downloadStage === 'fetching') return 'Getting audio info...';
    if (downloadStage === 'downloading') return `${Math.round(downloadProgress * 100)}%`;
    if (downloadStage === 'saving') return 'Saving to library...';
    return '';
  };

  const isAnyDownloading = downloadingId !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YouTube Download</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search YouTube..."
          placeholderTextColor={Colors[scheme].subText}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          editable={!searching}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            primaryButton[scheme],
            styles.searchButton,
            (searching || !query.trim()) && styles.disabled,
          ]}
          onPress={handleSearch}
          disabled={searching || !query.trim()}
          activeOpacity={0.7}
        >
          {searching ? (
            <ActivityIndicator color={Colors[scheme].primaryButtonText} size="small" />
          ) : (
            <Text style={[styles.searchButtonText, { color: Colors[scheme].primaryButtonText }]}>
              Search
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}

      <CustomFlatList
        data={results}
        keyExtractor={item => item.videoId}
        emptyMessage={searching ? '' : 'Search for a YouTube video above'}
        renderItem={({ item }) => {
          const isThisDownloading = downloadingId === item.videoId;

          return (
            <View style={styles.resultRow}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {item.author}
                  {item.duration > 0 ? `  ·  ${formatDuration(item.duration)}` : ''}
                </Text>

                {isThisDownloading && downloadStage === 'downloading' && (
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.round(downloadProgress * 100)}%` },
                      ]}
                    />
                  </View>
                )}
                {isThisDownloading && (
                  <Text style={styles.stageText}>{getStageLabel(item.videoId)}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.dlButton,
                  isAnyDownloading && !isThisDownloading && styles.disabled,
                ]}
                onPress={() => handleDownload(item)}
                disabled={isAnyDownloading}
                activeOpacity={0.7}
              >
                {isThisDownloading ? (
                  <ActivityIndicator size="small" color={Colors[scheme].tint} />
                ) : (
                  <Text style={[styles.dlIcon, { color: Colors[scheme].text }]}>↓</Text>
                )}
              </TouchableOpacity>
            </View>
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
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
      gap: 10,
    },
    input: {
      flex: 1,
      backgroundColor: Colors[scheme].card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: Colors[scheme].text,
      borderWidth: 1,
      borderColor: Colors[scheme].border,
    },
    searchButton: {
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.4,
    },
    errorText: {
      color: '#ff4d4d',
      fontSize: 13,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    resultInfo: {
      flex: 1,
      marginRight: 12,
    },
    resultTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: Colors[scheme].text,
      marginBottom: 4,
    },
    resultMeta: {
      fontSize: 12,
      color: Colors[scheme].subText,
    },
    progressBarBg: {
      height: 4,
      backgroundColor: Colors[scheme].disc,
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 6,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: Colors[scheme].tint,
      borderRadius: 2,
    },
    stageText: {
      fontSize: 11,
      color: Colors[scheme].tint,
      marginTop: 4,
    },
    dlButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors[scheme].card,
      borderWidth: 1,
      borderColor: Colors[scheme].border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dlIcon: {
      fontSize: 18,
      fontWeight: '600',
    },
  });
