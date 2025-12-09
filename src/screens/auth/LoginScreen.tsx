import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RootStackParamList, LoginMethod } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { login, loginWithPhone } = useApp();
  
  const [loginMethod, setLoginMethod] = useState<'phone' | 'username'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      setIsLoading(false);
      if (!success) {
        Alert.alert('Error', 'Invalid credentials. Try admin/admin123');
      }
    }, 500);
  };

  const handlePhoneLogin = () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const success = loginWithPhone(phone, pin);
      setIsLoading(false);
      if (!success) {
        Alert.alert('Error', 'Invalid phone or PIN. Try 9999999999/1234');
      }
    }, 500);
  };

  const handleSendOTP = () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    navigation.navigate('OTP', { phone });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient effect */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="storefront" size={64} color={colors.accent} />
          </View>
          <Text style={styles.appName}>ShopBill Pro</Text>
          <Text style={styles.tagline}>Smart Billing Made Simple</Text>
        </View>

        {/* Login Method Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === 'username' && styles.toggleButtonActive,
            ]}
            onPress={() => setLoginMethod('username')}
          >
            <Ionicons
              name="person"
              size={18}
              color={loginMethod === 'username' ? colors.white : colors.gray[600]}
            />
            <Text
              style={[
                styles.toggleText,
                loginMethod === 'username' && styles.toggleTextActive,
              ]}
            >
              Username
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === 'phone' && styles.toggleButtonActive,
            ]}
            onPress={() => setLoginMethod('phone')}
          >
            <Ionicons
              name="phone-portrait"
              size={18}
              color={loginMethod === 'phone' ? colors.white : colors.gray[600]}
            />
            <Text
              style={[
                styles.toggleText,
                loginMethod === 'phone' && styles.toggleTextActive,
              ]}
            >
              Phone + PIN
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {loginMethod === 'username' ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={colors.gray[400]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.gray[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleUsernameLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.gray[400]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={20} color={colors.gray[500]} />
                <TextInput
                  style={styles.input}
                  placeholder="4-digit PIN"
                  placeholderTextColor={colors.gray[400]}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handlePhoneLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Verifying...' : 'Login with PIN'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.otpButton} onPress={handleSendOTP}>
                <Text style={styles.otpButtonText}>Or Login with OTP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Demo Credentials:</Text>
          <Text style={styles.demoText}>Username: admin | Password: admin123</Text>
          <Text style={styles.demoText}>Phone: 9999999999 | PIN: 1234</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by</Text>
          <Text style={styles.footerBrand}>ShopBill Technologies</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  appName: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.gray[400],
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
  },
  toggleTextActive: {
    color: colors.white,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  otpButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  otpButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.secondary,
  },
  demoContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  demoText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  footerBrand: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
});

