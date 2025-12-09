import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

interface UserCardProps {
  user: User;
  isCurrentUser: boolean;
  onDelete: () => void;
}

function UserCard({ user, isCurrentUser, onDelete }: UserCardProps) {
  const isAdmin = user.role === 'admin';
  const isMaster = user.id === 'master';

  return (
    <View style={styles.userCard}>
      <View style={[styles.avatarContainer, isAdmin && styles.adminAvatar]}>
        <Ionicons
          name={isAdmin ? 'shield' : 'person'}
          size={24}
          color={isAdmin ? colors.accent : colors.secondary}
        />
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>{user.username}</Text>
          {isMaster && (
            <View style={styles.masterBadge}>
              <Text style={styles.masterBadgeText}>Master</Text>
            </View>
          )}
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          )}
        </View>
        <Text style={styles.userRole}>
          {isAdmin ? 'Administrator' : 'Staff Member'}
        </Text>
        {user.phone && (
          <Text style={styles.userPhone}>📱 {user.phone}</Text>
        )}
      </View>
      {!isMaster && !isCurrentUser && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function UserManagementScreen() {
  const { state, addUser, dispatch } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_USER', payload: user.id });
          },
        },
      ]
    );
  };

  const handleAddUser = () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (state.users.find((u) => u.username === newUsername)) {
      Alert.alert('Error', 'Username already exists');
      return;
    }

    if (newPhone && newPhone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (newPin && newPin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    addUser({
      username: newUsername,
      phone: newPhone || undefined,
      pin: newPin || '1234',
      role: newRole,
    });

    setShowAddModal(false);
    setNewUsername('');
    setNewPhone('');
    setNewPin('');
    setNewRole('user');

    Alert.alert(
      'User Created',
      `User "${newUsername}" has been created.\n\nPassword: ${newUsername}123\nPIN: ${newPin || '1234'}`
    );
  };

  const admins = state.users.filter((u) => u.role === 'admin');
  const staff = state.users.filter((u) => u.role === 'user');

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="shield" size={24} color={colors.accent} />
          <Text style={styles.statValue}>{admins.length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Ionicons name="people" size={24} color={colors.secondary} />
          <Text style={styles.statValue}>{staff.length}</Text>
          <Text style={styles.statLabel}>Staff</Text>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={state.users}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isCurrentUser={item.id === state.user?.id}
            onDelete={() => handleDeleteUser(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>All Users</Text>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="person-add" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Username */}
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={colors.gray[400]}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
              />

              {/* Phone */}
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor={colors.gray[400]}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              {/* PIN */}
              <Text style={styles.inputLabel}>PIN (4 digits)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={colors.gray[400]}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="number-pad"
                maxLength={4}
              />

              {/* Role */}
              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleOption, newRole === 'user' && styles.roleOptionActive]}
                  onPress={() => setNewRole('user')}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={newRole === 'user' ? colors.white : colors.gray[500]}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      newRole === 'user' && styles.roleOptionTextActive,
                    ]}
                  >
                    Staff
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, newRole === 'admin' && styles.roleOptionActive]}
                  onPress={() => setNewRole('admin')}
                >
                  <Ionicons
                    name="shield"
                    size={20}
                    color={newRole === 'admin' ? colors.white : colors.gray[500]}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      newRole === 'admin' && styles.roleOptionTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Note */}
              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={16} color={colors.info} />
                <Text style={styles.noteText}>
                  Password will be: {newUsername || 'username'}123
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.createButton} onPress={handleAddUser}>
              <Text style={styles.createButtonText}>Create User</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatar: {
    backgroundColor: colors.accent + '20',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  username: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  masterBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  masterBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  youBadge: {
    backgroundColor: colors.info + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  youBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
  userRole: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalContent: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
  },
  roleOptionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
  },
  roleOptionTextActive: {
    color: colors.white,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.info,
  },
  createButton: {
    backgroundColor: colors.accent,
    margin: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});

