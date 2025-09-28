import { auth } from '@/config/firebase';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

export interface OTPResult {
  success: boolean;
  message: string;
  verificationId?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  user?: any;
}

class AuthServiceFirebaseJS {
  private confirmationResult: ConfirmationResult | null = null;

  // ✅ Setup Recaptcha for Expo Go (web style)
  private setupRecaptcha() {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response: any) => {
            console.log("✅ Recaptcha solved:", response);
          },
        },
        auth
      );
    }
  }

  // Send OTP
  async sendOTP(phoneNumber: string): Promise<OTPResult> {
    try {
      this.setupRecaptcha();

      const formattedPhoneNumber = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber}`;

      console.log('🔥 Sending OTP to:', formattedPhoneNumber);

      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        window.recaptchaVerifier
      );

      return {
        success: true,
        message: 'OTP sent successfully!',
        verificationId: this.confirmationResult.verificationId,
      };
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      };
    }
  }

  // Verify OTP
  async verifyOTP(otp: string): Promise<VerifyOTPResult> {
    try {
      if (!this.confirmationResult) {
        return {
          success: false,
          message: 'No verification session found. Please request OTP again.',
        };
      }

      const result = await this.confirmationResult.confirm(otp);

      return {
        success: true,
        message: 'OTP verified successfully!',
        user: result.user,
      };
    } catch (error: any) {
      console.error('❌ Verification Error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      };
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format.';
      case 'auth/too-many-requests':
        return 'Too many requests. Try again later.';
      case 'auth/invalid-verification-code':
        return 'Invalid OTP.';
      case 'auth/code-expired':
        return 'OTP expired.';
      case 'auth/session-expired':
        return 'Session expired. Please request OTP again.';
      default:
        return `Error: ${errorCode}`;
    }
  }

  async signOut(): Promise<void> {
    await auth.signOut();
    this.confirmationResult = null;
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export default new AuthServiceFirebaseJS();
