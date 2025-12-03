// files.tsx (UPDATED)
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import path from 'path-browserify'; // <--- Ensure this is here after npm install path-browserify

// --- IMPORTANT: USE YOUR DEVICE'S ACTUAL IP ADDRESS ---
const BACKEND_URL = 'http://192.0.0.4:3000'; // Your Termux IP
// ----------------------------------------------------

// Define the type for file/directory entries from the backend
interface FileEntry {
  name: string;
  isDirectory: boolean;
}

export default function FilesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentRelativePath = (params.path as string || '').replace(/\/$/, '');

  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Ensure fetchEntries is defined within the component scope ---
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRefreshing(true);

    const encodedPath = encodeURIComponent(currentRelativePath);
    const url = `${BACKEND_URL}/files/${encodedPath}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEntries(data.entries);
    } catch (err) {
      console.error(`Failed to fetch entries for path "${currentRelativePath}":`, err);
      setError(`Could not load path: ${currentRelativePath}. Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentRelativePath]);

  // --- Ensure onRefresh is defined within the component scope ---
  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // VVV VVV VVV THE UPDATED NAVIGATION LOGIC VVV VVV VVV
  const navigateTo = (entryName: string, isDirectory: boolean) => {
    // 1. Determine the full path of the entry
    const fullPath = path.join(currentRelativePath, entryName);

    if (isDirectory) {
      // 2. If it's a directory, navigate to the next 'files' screen
      router.push({ pathname: '/files', params: { path: fullPath } });
    } else {
      // 3. If it's a file, navigate to the editor screen
      // This route maps to app/editor/[...path].tsx
      router.push({ pathname: `/editor/${fullPath}` });
    }
  };
  // ^^^ ^^^ ^^^ THE UPDATED NAVIGATION LOGIC ^^^ ^^^ ^^^

  const goUp = () => {
    if (currentRelativePath === '' || currentRelativePath === '.') return;

    const parentPath = path.dirname(currentRelativePath);
    router.push({ pathname: '/files', params: { path: parentPath === '.' ? '' : parentPath } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{
        title: currentRelativePath === '' ? 'File Browser (Root)' : `Browsing: ${currentRelativePath}`,
        headerLeft: () => currentRelativePath !== '' && (
          <TouchableOpacity onPress={goUp} style={styles.upButton}>
            <Text style={styles.upButtonText}>↑ Up</Text>
          </TouchableOpacity>
        )
      }} />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error:</Text>
          <Text style={styles.errorDetails}>{error}</Text>
          <TouchableOpacity onPress={fetchEntries} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && entries.length === 0 ? (
        <Text style={styles.emptyText}>No entries found in this directory.</Text>
      ) : (
        <FlatList
          data={entries.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          })}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.entryItem}
              onPress={() => navigateTo(item.name, item.isDirectory)}
            >
              <Text style={styles.entryIcon}>{item.isDirectory ? '📁' : '📄'}</Text>
              <Text style={styles.entryName}>{item.name}</Text>
              {item.isDirectory && <Text style={styles.entryArrow}>→</Text>}
            </TouchableOpacity>
          )}
          style={styles.entryList}
          contentContainerStyle={styles.entryListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: StatusBar.currentHeight,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 20,
    textAlign: 'center',
  },
  entryList: {
    width: '100%',
  },
  entryListContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  entryItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  entryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  entryArrow: {
    fontSize: 16,
    color: '#888',
    marginLeft: 10,
  },
  upButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  upButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
});

