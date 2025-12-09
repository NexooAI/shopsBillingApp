import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type OTPScreenRouteProp = RouteProp<RootStackParamList, 'OTP'>;

export default function OTPScreen() {
  const navigation = useNavigation();
  const route = useRoute<OTPScreenRouteProp>();
  const { loginWithPhone, state } = useApp();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    // For demo, accept any 6-digit OTP and find user by phone
    const user = state.users.find((u) => u.phone === route.params.phone);
    if (user) {
      loginWithPhone(route.params.phone, user.pin || '1234');
    } else {
      // Demo: login with master user for any OTP
      Alert.alert('Success', 'OTP verified! Logging in...');
      loginWithPhone('9999999999', '1234');
    }
  };

  const handleResendOTP = () => {
    setTimer(30);
    setCanResend(false);
    Alert.alert('OTP Sent', `A new OTP has been sent to ${route.params.phone}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="chatbox" size={48} color={colors.accent} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phone}>{route.params.phone}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend OTP in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Demo Note */}
        <View style={styles.demoNote}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          <Text style={styles.demoNoteText}>
            Demo: Enter any 6-digit code to proceed
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phone: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight + '20',
  },
  timerContainer: {
    marginBottom: spacing.xl,
  },
  timerText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  timerCount: {
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  resendText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.secondary,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    width: '100%',
  },
  verifyButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
  },
  demoNoteText: {
    fontSize: fontSize.sm,
    color: colors.info,
  },
});

