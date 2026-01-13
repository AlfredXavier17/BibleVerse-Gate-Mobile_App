/**
 * Bible Verse Gate
 */

import React, {useEffect, useState} from 'react';
import {
  Button,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  NativeModules,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const {BlockedAppsModule} = NativeModules;

interface InstalledApp {
  packageName: string;
  appName: string;
  icon: string;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [blockedApps, setBlockedApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'apps' | 'settings'>('apps');
  const [showOnlyBlocked, setShowOnlyBlocked] = useState(false);
  const [countdownTime, setCountdownTime] = useState(5);
  const [usageStats, setUsageStats] = useState<{[key: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkPermissionAndLoadApps();
  }, []);

  const checkPermissionAndLoadApps = async () => {
    try {
      console.log('checkPermissionAndLoadApps called');
      console.log('BlockedAppsModule:', BlockedAppsModule);

      if (!BlockedAppsModule) {
        console.error('BlockedAppsModule is undefined!');
        setLoading(false);
        return;
      }

      const [usageGranted, overlayGranted, savedCountdown] = await Promise.all([
        BlockedAppsModule.hasUsageStatsPermission(),
        BlockedAppsModule.hasOverlayPermission(),
        BlockedAppsModule.getCountdownTime(),
      ]);

      console.log('Usage permission granted:', usageGranted);
      console.log('Overlay permission granted:', overlayGranted);
      console.log('Saved countdown time:', savedCountdown);

      setHasPermission(usageGranted);
      setHasOverlayPermission(overlayGranted);
      setCountdownTime(savedCountdown);

      if (usageGranted && overlayGranted) {
        console.log('Loading apps...');
        await loadApps();
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      console.log('loadApps: Starting to load apps...');
      const [apps, blocked, usage] = await Promise.all([
        BlockedAppsModule.getInstalledApps(),
        BlockedAppsModule.getBlockedApps(),
        BlockedAppsModule.getAppUsageStats(),
      ]);

      console.log('loadApps: Received', apps.length, 'apps and', blocked.length, 'blocked apps');

      if (!apps || apps.length === 0) {
        Alert.alert('Info', 'No user-installed apps found. System apps are filtered out.');
      }

      setInstalledApps(apps.sort((a: InstalledApp, b: InstalledApp) => a.appName.localeCompare(b.appName)));
      setBlockedApps(new Set(blocked));
      setUsageStats(usage || {});
    } catch (error) {
      console.error('Error loading apps:', error);
      Alert.alert('Error', 'Failed to load apps: ' + error);
    }
  };

  const formatUsageTime = (milliseconds: number): string => {
    const totalMinutes = Math.floor(milliseconds / 60000);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const openUsageAccessSettings = async () => {
    try {
      await BlockedAppsModule.openUsageAccessSettings();
      // Check permission again after user returns
      setTimeout(checkPermissionAndLoadApps, 1000);
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const requestOverlayPermission = async () => {
    try {
      await BlockedAppsModule.requestOverlayPermission();
      // Check permission again after user returns
      setTimeout(checkPermissionAndLoadApps, 1000);
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
    }
  };

  const toggleBlockedApp = async (packageName: string) => {
    try {
      const isBlocked = blockedApps.has(packageName);

      if (isBlocked) {
        await BlockedAppsModule.removeBlockedApp(packageName);
        setBlockedApps(prev => {
          const newSet = new Set(prev);
          newSet.delete(packageName);
          return newSet;
        });
      } else {
        await BlockedAppsModule.addBlockedApp(packageName);
        setBlockedApps(prev => new Set([...prev, packageName]));
      }
    } catch (error) {
      console.error('Error toggling app:', error);
      Alert.alert('Error', 'Failed to update blocked apps');
    }
  };

  const updateCountdownTime = async (seconds: number) => {
    try {
      await BlockedAppsModule.setCountdownTime(seconds);
      setCountdownTime(seconds);
    } catch (error) {
      console.error('Error updating countdown time:', error);
      Alert.alert('Error', 'Failed to update countdown time');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!hasPermission || !hasOverlayPermission) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Text style={styles.title}>📖 Bible Verse Gate</Text>

        <Text style={styles.subtitle}>
          Peace. Wisdom. One verse at a time.
        </Text>

        {!hasPermission && (
          <>
            <Text style={styles.instructionText}>
              To monitor app usage, we need permission to access usage data.
            </Text>

            <View style={{marginTop: 30}}>
              <Button
                title="1. Enable Usage Access"
                onPress={openUsageAccessSettings}
              />
            </View>
          </>
        )}

        {hasPermission && !hasOverlayPermission && (
          <>
            <Text style={styles.instructionText}>
              To show the Bible verse gate, we need permission to display over other apps.
            </Text>

            <View style={{marginTop: 30}}>
              <Button
                title="2. Allow Display Over Other Apps"
                onPress={requestOverlayPermission}
                color="#4CAF50"
              />
            </View>
          </>
        )}
      </View>
    );
  }

  const filteredApps = installedApps
    .filter(app => {
      const matchesSearch = searchQuery === '' ||
        app.appName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !showOnlyBlocked || blockedApps.has(app.packageName);
      return matchesSearch && matchesFilter;
    });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Text style={styles.title}>📖 Bible Verse Gate</Text>

      <Text style={styles.subtitle}>
        {blockedApps.size === 0
          ? 'Select apps to block'
          : `${blockedApps.size} app${blockedApps.size === 1 ? '' : 's'} blocked`}
      </Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'apps' && styles.tabActive]}
          onPress={() => setCurrentTab('apps')}
        >
          <Text style={[styles.tabText, currentTab === 'apps' && styles.tabTextActive]}>
            Apps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'settings' && styles.tabActive]}
          onPress={() => setCurrentTab('settings')}
        >
          <Text style={[styles.tabText, currentTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {currentTab === 'apps' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search apps..."
              placeholderTextColor="#666666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Toggle */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowOnlyBlocked(!showOnlyBlocked)}
            >
              <Text style={styles.filterText}>
                {showOnlyBlocked ? '📋 Show All Apps' : '🔒 Show Blocked Only'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredApps}
            keyExtractor={item => item.packageName}
            style={styles.list}
            ListEmptyComponent={
              showOnlyBlocked ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No blocked apps yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the "Show All Apps" button above to select apps to block
                  </Text>
                </View>
              ) : null
            }
            renderItem={({item}) => {
              const isBlocked = blockedApps.has(item.packageName);
              const usageTime = usageStats[item.packageName] || 0;
              return (
                <TouchableOpacity
                  style={[styles.appItem, isBlocked && styles.appItemBlocked]}
                  onPress={() => toggleBlockedApp(item.packageName)}
                >
                  <Image
                    source={{uri: `data:image/png;base64,${item.icon}`}}
                    style={styles.appIcon}
                  />
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{item.appName}</Text>
                    {usageTime > 0 && (
                      <Text style={styles.usageTime}>
                        {formatUsageTime(usageTime)}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isBlocked && styles.checkboxChecked,
                    ]}
                  >
                    {isBlocked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>⏱️ Countdown Timer</Text>
          <Text style={styles.settingsDescription}>
            Time before "Continue" button becomes active
          </Text>

          <View style={styles.countdownOptions}>
            {[3, 5, 10].map(seconds => (
              <TouchableOpacity
                key={seconds}
                style={[
                  styles.countdownOption,
                  countdownTime === seconds && styles.countdownOptionActive,
                ]}
                onPress={() => updateCountdownTime(seconds)}
              >
                <Text
                  style={[
                    styles.countdownOptionText,
                    countdownTime === seconds && styles.countdownOptionTextActive,
                  ]}
                >
                  {seconds}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 Statistics</Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Apps</Text>
              <Text style={styles.statValue}>{installedApps.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Blocked Apps</Text>
              <Text style={styles.statValue}>{blockedApps.size}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Unblocked Apps</Text>
              <Text style={styles.statValue}>{installedApps.length - blockedApps.size}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 14,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e1e1e',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  appItemBlocked: {
    borderColor: '#2196F3',
    backgroundColor: '#1a2a3a',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  usageTime: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsContainer: {
    flex: 1,
    paddingTop: 12,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 20,
  },
  countdownOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  countdownOption: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1e1e1e',
    alignItems: 'center',
  },
  countdownOptionActive: {
    backgroundColor: '#1a2a3a',
    borderColor: '#2196F3',
  },
  countdownOptionText: {
    color: '#888888',
    fontSize: 18,
    fontWeight: '700',
  },
  countdownOptionTextActive: {
    color: '#2196F3',
  },
  statsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaaaaa',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default App;
