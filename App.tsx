/**
 * Bible Verse App Blocker
 */

import React, {useEffect, useState} from 'react';
import {
  Button,
  StatusBar,
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  NativeModules,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Switch,
  Modal,
  ScrollView,
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

// Color schemes
const DARK_COLORS = {
  background: '#121212',
  surface: '#1e1e1e',
  surfaceVariant: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#aaaaaa',
  textDisabled: '#666666',
  accent: '#2196F3',
  border: '#333333',
};

const LIGHT_COLORS = {
  background: '#E8E8E8',
  surface: '#F0F0F0',
  surfaceVariant: '#D8E8F0',
  text: '#1A1A1A',
  textSecondary: '#3A3A3A',
  textTertiary: '#555555',
  textDisabled: '#888888',
  accent: '#1565C0',
  border: '#C0C0C0',
};

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await BlockedAppsModule.getThemePreference();
      setTheme(savedTheme as 'dark' | 'light');
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <AppContent theme={theme} setTheme={setTheme} colors={colors} />
    </SafeAreaProvider>
  );
}

interface AppContentProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  colors: typeof DARK_COLORS;
}

function AppContent({theme, setTheme, colors}: AppContentProps) {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [hasBatteryOptimization, setHasBatteryOptimization] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [blockedApps, setBlockedApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'apps' | 'settings'>('apps');
  const [showOnlyBlocked, setShowOnlyBlocked] = useState(false);
  const [countdownTime, setCountdownTime] = useState(5);
  const [usageStats, setUsageStats] = useState<{[key: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [bibleVersion, setBibleVersion] = useState<'KJV' | 'WEB'>('KJV');

  useEffect(() => {
    checkPermissionAndLoadApps();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      await BlockedAppsModule.setThemePreference(newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const checkPermissionAndLoadApps = async () => {
    try {
      console.log('checkPermissionAndLoadApps called');
      console.log('BlockedAppsModule:', BlockedAppsModule);

      if (!BlockedAppsModule) {
        console.error('BlockedAppsModule is undefined!');
        setLoading(false);
        return;
      }

      const [usageGranted, overlayGranted, batteryOptDisabled, savedCountdown, savedVersion] = await Promise.all([
        BlockedAppsModule.hasUsageStatsPermission(),
        BlockedAppsModule.hasOverlayPermission(),
        BlockedAppsModule.isBatteryOptimizationDisabled(),
        BlockedAppsModule.getCountdownTime(),
        BlockedAppsModule.getBibleVersion(),
      ]);

      console.log('Usage permission granted:', usageGranted);
      console.log('Overlay permission granted:', overlayGranted);
      console.log('Battery optimization disabled:', batteryOptDisabled);
      console.log('Saved countdown time:', savedCountdown);

      setHasPermission(usageGranted);
      setHasOverlayPermission(overlayGranted);
      setHasBatteryOptimization(batteryOptDisabled);
      setCountdownTime(savedCountdown);
      setBibleVersion(savedVersion as 'KJV' | 'WEB');

      if (usageGranted && overlayGranted && batteryOptDisabled) {
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

  const requestBatteryOptimizationExemption = async () => {
    try {
      await BlockedAppsModule.requestBatteryOptimizationExemption();
      // Check permission again after user returns
      setTimeout(checkPermissionAndLoadApps, 1000);
    } catch (error) {
      console.error('Error requesting battery optimization exemption:', error);
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

  const updateBibleVersion = async (version: 'KJV' | 'WEB') => {
    try {
      await BlockedAppsModule.setBibleVersion(version);
      setBibleVersion(version);
    } catch (error) {
      console.error('Error updating bible version:', error);
      Alert.alert('Error', 'Failed to update Bible version');
    }
  };

  const submitFeedback = async () => {
    if (!feedbackEmail.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSendingFeedback(true);
    try {
      const response = await fetch('https://formspree.io/f/mykkkklg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: feedbackEmail,
          message: feedbackMessage,
        }),
      });

      if (response.ok) {
        Alert.alert('Thank you!', 'Your feedback has been sent.');
        setFeedbackEmail('');
        setFeedbackMessage('');
        setShowFeedbackModal(false);
      } else {
        Alert.alert('Error', 'Failed to send feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      Alert.alert('Error', 'Failed to send feedback. Please check your connection.');
    } finally {
      setSendingFeedback(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top}]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!hasPermission || !hasOverlayPermission || !hasBatteryOptimization) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Text style={[styles.title, {color: colors.text}]}>📖 Bible Verse App Blocker</Text>

        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          Peace. Wisdom. One verse at a time.
        </Text>

        {!hasPermission && (
          <>
            <Text style={[styles.instructionText, {color: colors.textTertiary}]}>
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
            <Text style={[styles.instructionText, {color: colors.textTertiary}]}>
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

        {hasPermission && hasOverlayPermission && !hasBatteryOptimization && (
          <>
            <Text style={[styles.instructionText, {color: colors.textTertiary}]}>
              To ensure the app runs continuously in the background, we need to disable battery optimization.
            </Text>

            <View style={{marginTop: 30}}>
              <Button
                title="3. Disable Battery Optimization"
                onPress={requestBatteryOptimizationExemption}
                color="#FF9800"
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
        {backgroundColor: colors.background},
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
        <Text style={[styles.title, {color: colors.text}]}>📖 Bible Verse App Blocker</Text>

      <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
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
              style={[styles.searchInput, {backgroundColor: colors.surface, color: colors.text}]}
              placeholder="Search apps..."
              placeholderTextColor={colors.textDisabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Toggle */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, {backgroundColor: colors.surface}]}
              onPress={() => setShowOnlyBlocked(!showOnlyBlocked)}
            >
              <Text style={[styles.filterText, {color: colors.accent}]}>
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
                  <Text style={[styles.emptyStateText, {color: colors.text}]}>
                    No blocked apps yet
                  </Text>
                  <Text style={[styles.emptyStateSubtext, {color: colors.textTertiary}]}>
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
                  style={[
                    styles.appItem,
                    {backgroundColor: colors.surface},
                    isBlocked && {backgroundColor: colors.surfaceVariant, borderColor: colors.accent}
                  ]}
                  onPress={() => toggleBlockedApp(item.packageName)}
                >
                  <Image
                    source={{uri: `data:image/png;base64,${item.icon}`}}
                    style={styles.appIcon}
                  />
                  <View style={styles.appInfo}>
                    <Text style={[styles.appName, {color: colors.text}]}>{item.appName}</Text>
                    {usageTime > 0 && (
                      <Text style={[styles.usageTime, {color: colors.textTertiary}]}>
                        {formatUsageTime(usageTime)}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {borderColor: colors.border},
                      isBlocked && {backgroundColor: colors.accent, borderColor: colors.accent}
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
        <ScrollView style={styles.settingsContainer} contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
          <View style={styles.settingSection}>
            <View style={styles.settingHeader}>
              <Text style={[styles.settingsTitle, {color: colors.text}]}>
                {theme === 'dark' ? '🌙' : '☀️'} Theme
              </Text>
              <Switch
                value={theme === 'light'}
                onValueChange={toggleTheme}
                trackColor={{false: '#767577', true: colors.accent}}
                thumbColor={theme === 'light' ? '#ffffff' : '#f4f3f4'}
              />
            </View>
            <Text style={[styles.settingsDescription, {color: colors.textTertiary}]}>
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </Text>
          </View>

          <Text style={[styles.settingsTitle, {color: colors.text}]}>📖 Bible Version</Text>
          <Text style={[styles.settingsDescription, {color: colors.textTertiary}]}>
            Choose which translation to display on the gate screen
          </Text>

          <View style={styles.countdownOptions}>
            {(['KJV', 'WEB'] as const).map(version => (
              <TouchableOpacity
                key={version}
                style={[
                  styles.countdownOption,
                  {backgroundColor: colors.surface, borderColor: colors.surface},
                  bibleVersion === version && {backgroundColor: colors.surfaceVariant, borderColor: colors.accent},
                ]}
                onPress={() => updateBibleVersion(version)}
              >
                <Text
                  style={[
                    styles.countdownOptionText,
                    {color: colors.textDisabled},
                    bibleVersion === version && {color: colors.accent},
                  ]}
                >
                  {version}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.settingsTitle, {color: colors.text}]}>⏱️ Countdown Timer</Text>
          <Text style={[styles.settingsDescription, {color: colors.textTertiary}]}>
            Time before "Continue" button becomes active
          </Text>

          <View style={styles.countdownOptions}>
            {[3, 5, 10].map(seconds => (
              <TouchableOpacity
                key={seconds}
                style={[
                  styles.countdownOption,
                  {backgroundColor: colors.surface, borderColor: colors.surface},
                  countdownTime === seconds && {backgroundColor: colors.surfaceVariant, borderColor: colors.accent},
                ]}
                onPress={() => updateCountdownTime(seconds)}
              >
                <Text
                  style={[
                    styles.countdownOptionText,
                    {color: colors.textDisabled},
                    countdownTime === seconds && {color: colors.accent},
                  ]}
                >
                  {seconds}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.statsContainer, {backgroundColor: colors.surface}]}>
            <Text style={[styles.statsTitle, {color: colors.text}]}>📊 Statistics</Text>
            <View style={[styles.statItem, {borderBottomColor: colors.border}]}>
              <Text style={[styles.statLabel, {color: colors.textTertiary}]}>Total Apps</Text>
              <Text style={[styles.statValue, {color: colors.accent}]}>{installedApps.length}</Text>
            </View>
            <View style={[styles.statItem, {borderBottomColor: colors.border}]}>
              <Text style={[styles.statLabel, {color: colors.textTertiary}]}>Blocked Apps</Text>
              <Text style={[styles.statValue, {color: colors.accent}]}>{blockedApps.size}</Text>
            </View>
            <View style={[styles.statItem, {borderBottomColor: colors.border}]}>
              <Text style={[styles.statLabel, {color: colors.textTertiary}]}>Unblocked Apps</Text>
              <Text style={[styles.statValue, {color: colors.accent}]}>{installedApps.length - blockedApps.size}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.feedbackButton, {backgroundColor: colors.surface}]}
            onPress={() => setShowFeedbackModal(true)}
          >
            <Text style={[styles.feedbackButtonText, {color: colors.accent}]}>
              💬 Send Feedback
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Send Feedback</Text>

            <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
              Email <Text style={{color: '#ff6b6b'}}>*</Text>
            </Text>
            <TextInput
              style={[styles.modalInput, {backgroundColor: colors.background, color: colors.text, borderColor: colors.border}]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textDisabled}
              value={feedbackEmail}
              onChangeText={setFeedbackEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
              Message <Text style={{color: '#ff6b6b'}}>*</Text>
            </Text>
            <TextInput
              style={[styles.modalInput, styles.messageInput, {backgroundColor: colors.background, color: colors.text, borderColor: colors.border}]}
              placeholder="Your feedback..."
              placeholderTextColor={colors.textDisabled}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, {borderColor: colors.border}]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={[styles.cancelButtonText, {color: colors.textSecondary}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, {backgroundColor: colors.accent}]}
                onPress={submitFeedback}
                disabled={sendingFeedback}
              >
                {sendingFeedback ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  settingSection: {
    marginBottom: 30,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  feedbackButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
  },
  messageInput: {
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#2196F3',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
