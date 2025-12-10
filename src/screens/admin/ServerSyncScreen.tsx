import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import {
  syncAllData,
  syncCategories,
  syncProducts,
  syncBills,
  testServerConnection,
  getServerConfig,
  saveServerConfig,
  SyncResult,
} from '../../services/apiService';

interface SyncItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  onSync: () => void;
  disabled?: boolean;
}

function SyncItem({ icon, title, count, status, message, onSync, disabled }: SyncItemProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color={colors.success} />;
      case 'error':
        return <Ionicons name="alert-circle" size={24} color={colors.error} />;
      default:
        return <Ionicons name="cloud-upload" size={24} color={colors.gray[400]} />;
    }
  };

  return (
    <View style={styles.syncItem}>
      <View style={styles.syncItemLeft}>
        <View style={[styles.syncIcon, status === 'success' && styles.syncIconSuccess]}>
          <Ionicons name={icon} size={24} color={status === 'success' ? colors.success : colors.primary} />
        </View>
        <View style={styles.syncInfo}>
          <Text style={styles.syncTitle}>{title}</Text>
          <Text style={styles.syncCount}>{count} items</Text>
          {message && (
            <Text style={[styles.syncMessage, status === 'error' && styles.errorMessage]}>
              {message}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.syncButton, disabled && styles.syncButtonDisabled]}
        onPress={onSync}
        disabled={disabled || status === 'syncing'}
      >
        {getStatusIcon()}
      </TouchableOpacity>
    </View>
  );
}

export default function ServerSyncScreen() {
  const { state } = useApp();
  const [serverUrl, setServerUrl] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const [syncStatus, setSyncStatus] = useState({
    categories: { status: 'idle' as const, message: '' },
    products: { status: 'idle' as const, message: '' },
    bills: { status: 'idle' as const, message: '' },
  });

  useEffect(() => {
    loadServerConfig();
  }, []);

  const loadServerConfig = async () => {
    const config = await getServerConfig();
    if (config?.baseUrl) {
      setServerUrl(config.baseUrl);
      setIsConfigured(true);
    }
  };

  const handleSaveConfig = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    // Validate URL format
    try {
      new URL(serverUrl);
    } catch {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://your-server.com/api)');
      return;
    }

    try {
      await saveServerConfig({ baseUrl: serverUrl.trim() });
      setIsConfigured(true);
      Alert.alert('Success', 'Server configuration saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save server configuration');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');

    const result = await testServerConnection();
    
    setConnectionStatus(result.success ? 'success' : 'error');
    setIsTestingConnection(false);

    Alert.alert(
      result.success ? 'Success' : 'Connection Failed',
      result.message
    );
  };

  const updateSyncStatus = (
    key: 'categories' | 'products' | 'bills',
    status: 'idle' | 'syncing' | 'success' | 'error',
    message: string
  ) => {
    setSyncStatus(prev => ({
      ...prev,
      [key]: { status, message },
    }));
  };

  const handleSyncCategories = async () => {
    updateSyncStatus('categories', 'syncing', 'Uploading...');
    const result = await syncCategories(state.categories);
    updateSyncStatus(
      'categories',
      result.success ? 'success' : 'error',
      result.message
    );
  };

  const handleSyncProducts = async () => {
    updateSyncStatus('products', 'syncing', 'Uploading...');
    const result = await syncProducts(state.products);
    updateSyncStatus(
      'products',
      result.success ? 'success' : 'error',
      result.message
    );
  };

  const handleSyncBills = async () => {
    updateSyncStatus('bills', 'syncing', 'Uploading...');
    const result = await syncBills(state.bills);
    updateSyncStatus(
      'bills',
      result.success ? 'success' : 'error',
      result.message
    );
  };

  const handleSyncAll = async () => {
    if (!isConfigured) {
      Alert.alert('Error', 'Please configure server URL first');
      return;
    }

    Alert.alert(
      'Sync All Data',
      'This will upload all categories, products, and bills to the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync All',
          onPress: async () => {
            setIsSyncingAll(true);
            updateSyncStatus('categories', 'syncing', 'Uploading...');
            updateSyncStatus('products', 'syncing', 'Uploading...');
            updateSyncStatus('bills', 'syncing', 'Uploading...');

            const results = await syncAllData(
              state.categories,
              state.products,
              state.bills,
              state.users
            );

            updateSyncStatus(
              'categories',
              results.categories.success ? 'success' : 'error',
              results.categories.message
            );
            updateSyncStatus(
              'products',
              results.products.success ? 'success' : 'error',
              results.products.message
            );
            updateSyncStatus(
              'bills',
              results.bills.success ? 'success' : 'error',
              results.bills.message
            );

            setIsSyncingAll(false);

            if (results.overallSuccess) {
              Alert.alert('Success', 'All data synced successfully!');
            } else {
              Alert.alert('Partial Sync', 'Some items failed to sync. Check individual status.');
            }
          },
        },
      ]
    );
  };

  const getLastSyncInfo = () => {
    // This would come from stored sync history
    return 'Never synced';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Server Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Configuration</Text>
        <View style={styles.configCard}>
          <Text style={styles.inputLabel}>Server URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://your-server.com/api"
            placeholderTextColor={colors.gray[400]}
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.configButtons}>
            <TouchableOpacity
              style={styles.configButton}
              onPress={handleSaveConfig}
            >
              <Ionicons name="save" size={18} color={colors.white} />
              <Text style={styles.configButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.configButton, styles.testButton]}
              onPress={handleTestConnection}
              disabled={isTestingConnection || !serverUrl}
            >
              {isTestingConnection ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={connectionStatus === 'success' ? 'checkmark-circle' : 'wifi'}
                    size={18}
                    color={connectionStatus === 'success' ? colors.success : colors.primary}
                  />
                  <Text style={[styles.configButtonText, styles.testButtonText]}>Test</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {connectionStatus !== 'idle' && (
            <View style={[styles.connectionStatus, connectionStatus === 'success' ? styles.connectedStatus : styles.errorStatus]}>
              <Ionicons
                name={connectionStatus === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={connectionStatus === 'success' ? colors.success : colors.error}
              />
              <Text style={[styles.connectionText, connectionStatus === 'success' ? styles.connectedText : styles.errorText]}>
                {connectionStatus === 'success' ? 'Connected to server' : 'Connection failed'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Data Sync</Text>
          <Text style={styles.lastSync}>Last sync: {getLastSyncInfo()}</Text>
        </View>

        <View style={styles.syncCard}>
          <SyncItem
            icon="layers"
            title="Categories"
            count={state.categories.length}
            status={syncStatus.categories.status}
            message={syncStatus.categories.message}
            onSync={handleSyncCategories}
            disabled={!isConfigured || isSyncingAll}
          />
          <View style={styles.divider} />
          <SyncItem
            icon="cube"
            title="Products"
            count={state.products.length}
            status={syncStatus.products.status}
            message={syncStatus.products.message}
            onSync={handleSyncProducts}
            disabled={!isConfigured || isSyncingAll}
          />
          <View style={styles.divider} />
          <SyncItem
            icon="receipt"
            title="Bills"
            count={state.bills.length}
            status={syncStatus.bills.status}
            message={syncStatus.bills.message}
            onSync={handleSyncBills}
            disabled={!isConfigured || isSyncingAll}
          />
        </View>
      </View>

      {/* Sync All Button */}
      <TouchableOpacity
        style={[styles.syncAllButton, (!isConfigured || isSyncingAll) && styles.syncAllButtonDisabled]}
        onPress={handleSyncAll}
        disabled={!isConfigured || isSyncingAll}
      >
        {isSyncingAll ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="cloud-upload" size={24} color={colors.white} />
        )}
        <Text style={styles.syncAllButtonText}>
          {isSyncingAll ? 'Syncing...' : 'Sync All Data to Server'}
        </Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color={colors.gray[400]} />
        <Text style={styles.infoText}>
          Data is saved locally on your device. Use this screen to backup your data to a server.
          Product images are converted and uploaded along with product data.
        </Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  lastSync: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  configCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  configButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  configButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  configButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  testButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testButtonText: {
    color: colors.primary,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  connectedStatus: {
    backgroundColor: colors.success + '15',
  },
  errorStatus: {
    backgroundColor: colors.error + '15',
  },
  connectionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  connectedText: {
    color: colors.success,
  },
  errorText: {
    color: colors.error,
  },
  syncCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  syncItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  syncItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncIconSuccess: {
    backgroundColor: colors.success + '15',
  },
  syncInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  syncTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  syncCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  syncMessage: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: 2,
  },
  errorMessage: {
    color: colors.error,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.medium,
  },
  syncAllButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  syncAllButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

