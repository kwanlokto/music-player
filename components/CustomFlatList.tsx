import {
    FlatList,
    FlatListProps,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

// StyledFlatList.tsx
import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';

// Extend FlatListProps with your default item type
export type CustomFlatListProps<ItemT> = FlatListProps<ItemT> & {
  // Optionally accept a custom empty state message
  emptyMessage?: string;
  // Allow custom container styles
  containerStyle?: ViewStyle;
};

export function CustomFlatList<ItemT>({
  emptyMessage = 'No items to display',
  containerStyle,
  ...props
}: CustomFlatListProps<ItemT>) {
  const scheme = useColorScheme();
  const styles = getStyles(scheme ?? 'dark');

  return (
    <FlatList
      {...props}
      style={[styles.list, containerStyle, props.style]}
      contentContainerStyle={[
        styles.contentContainer,
        props.contentContainerStyle,
        props.data?.length === 0 && styles.emptyContainer,
      ]}
      ListEmptyComponent={
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const getStyles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    list: {
      flex: 1,
    },
    contentContainer: {
      paddingVertical: 8,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: scheme === 'dark' ? '#2A2A2A' : '#E5E5E5',
      marginLeft: 20, // aligns under text, not icons
    },
    emptyWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: '#999',
    },
    emptyContainer: {
      flexGrow: 1, // Center empty state
      justifyContent: 'center',
    },
  });
