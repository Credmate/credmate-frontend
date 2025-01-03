'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, Auth } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { motion } from 'framer-motion';
import { storeAuthTokens } from '@/utils/auth';

// Country codes data
const countryCodes = [
  { id: 'IN', code: '91', flag: '🇮🇳' },
  { id: 'US', code: '1', flag: '🇺🇸' },
  { id: 'CA', code: '1', flag: '🇨🇦' },
  { id: 'GB', code: '44', flag: '🇬🇧' },
  { id: 'AU', code: '61', flag: '🇦🇺' },
  { id: 'SG', code: '65', flag: '🇸🇬' },
  { id: 'AE', code: '971', flag: '🇦🇪' },
];

export default function PhoneAuthPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (showOTP && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [showOTP, resendTimer]);

  const setupRecaptcha = () => {
    // Ensure the recaptcha-container exists in the DOM
    const containerId = 'recaptcha-container';
    if (!(window as any).recaptchaVerifier) {
      const container = document.getElementById(containerId);
      if (container) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(
          auth,
          containerId,
          {
            size: 'invisible', // or 'normal'
            callback: () => {
              console.log('Recaptcha solved!');
            },
            'expired-callback': () => {
              console.log('Recaptcha expired');
            },
          }
        );
      } else {
        console.error(`Element with ID ${containerId} not found.`);
      }
    }
  };

  const handlePhoneSubmit = async (phone: string) => {
    try {
      setLoading(true);
      setError('');

      setupRecaptcha();
      const formattedPhone = `+${selectedCountry.code}${phone.replace(/\s+/g, '')}`;
      const appVerifier = (window as any).recaptchaVerifier;

      console.log('Attempting sign in with:', formattedPhone);

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );

      setConfirmationResult(confirmation);
      setPhoneNumber(phone);
      setShowOTP(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      console.error('Phone auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log('handleVerifyOTP called');
    console.log('OTP Value:', otpValue);
    console.log('Confirmation Result:', confirmationResult ? 'exists' : 'null');

    try {
      // Validate OTP format before submission
      if (!/^\d{6}$/.test(otpValue)) {
        console.log('Invalid OTP format');
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      setLoading(true);
      setError('');

      if (!confirmationResult) {
        console.log('No confirmation result found');
        setError('Session expired. Please request a new OTP');
        return;
      }

      console.log('Attempting to confirm OTP with Firebase...');
      const result = await confirmationResult.confirm(otpValue);
      console.log(
        'Firebase confirmation successful:',
        result ? 'success' : 'failed'
      );

      if (!result || !result.user) {
        console.log('No user returned from confirmation');
        setError('Verification failed. Please try again.');
        return;
      }

      console.log('Getting ID token...');
      const idToken = await result.user.getIdToken();
      console.log('ID token received:', idToken ? 'success' : 'failed');

      if (!idToken) {
        console.log('Failed to get ID token');
        setError('Failed to get authentication token. Please try again.');
        return;
      }

      // Store tokens in localStorage
      storeAuthTokens({
        accessToken: idToken,
        refreshToken: result.user.refreshToken || '',
        accessTokenExpiresIn: 3600, // 1 hour
        refreshTokenExpiresIn: 2592000, // 30 days
        timestamp: new Date().toISOString(),
      });

      // Set the auth cookie
      document.cookie = `authToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;

      // Call the complete-profile API
      try {
        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/complete-profile`;
        const headers = {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        };

        alert(
          `Calling API Endpoint: ${endpoint}\n\nHeaders:\n${JSON.stringify(headers, null, 2)}`
        );

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: headers,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const profileData = await response.json();

        localStorage.setItem('user_profile', JSON.stringify(profileData));
        localStorage.setItem('profile_last_fetched', Date.now().toString());

        alert(`API Response:\n${JSON.stringify(profileData, null, 2)}`);
        console.log('Profile data:', profileData);

        // Check if name and businessType are empty
        if (!profileData.name || !profileData.businessType) {
          router.push('/auth/complete-profile');
        } else {
          router.push('/');
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        alert('Error fetching profile data: ' + error.message);
      }
    } catch (error: any) {
      console.error('Error during verification:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Handle specific Firebase auth errors
      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new code.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.message || 'Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country: (typeof countryCodes)[0]) => {
    setSelectedCountry(country);
    setShowCountryList(false);
  };

  const isValidPhoneNumber = phoneNumber.length === 10;

  const handleSendOTP = () => {
    handlePhoneSubmit(phoneNumber);
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    await handlePhoneSubmit(phoneNumber);
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numeric values
    if (!/^\d*$/.test(value)) {
      return;
    }

    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = otpValue.split('');
    newOtp[index] = value;
    const newOtpString = newOtp.join('');

    // Set the OTP value
    setOtpValue(newOtpString);

    // Auto advance to next input if not the last box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleRef = (el: HTMLInputElement | null): void => {
    otpInputRefs.current.push(el);
  };

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-white via-pink-50 to-white'>
      <main className='flex items-center justify-center flex-1'>
        <div className='w-full px-4 py-8 sm:px-6'>
          <div className='max-w-md mx-auto'>
            <motion.div
              className='flex flex-col items-center mb-8'
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h2
                className='text-3xl font-bold text-center text-transparent bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text'
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Your Credit Journey Starts Here
              </motion.h2>
            </motion.div>

            <motion.div
              className='relative p-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-xl rounded-3xl border-pink-100/50'
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className='absolute top-0 left-0 w-full h-1 opacity-50 bg-gradient-to-r from-pink-500 to-pink-600' />
              <h1 className='mb-3 text-2xl font-bold text-transparent text-neutral-800 bg-gradient-to-r from-pink-700 to-pink-500 bg-clip-text'>
                {showOTP ? 'Verify OTP' : 'Welcome Back'}
              </h1>
              <p className='mb-8 text-base text-neutral-600'>
                {showOTP
                  ? `Please enter the verification code sent to +${selectedCountry.code} ${phoneNumber}`
                  : 'Enter your phone number to continue'}
              </p>

              {showOTP ? (
                <>
                  <div className='flex justify-center gap-3 my-6 otp-container'>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={handleRef}
                        type='text'
                        maxLength={1}
                        value={otpValue[index] || ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`w-12 h-12 text-center text-lg font-semibold rounded-xl border ${
                          error ? 'border-red-500' : 'border-neutral-200'
                        } bg-white/80 focus:border-pink-500 focus:ring focus:ring-pink-200/50 transition-all duration-300`}
                        disabled={loading}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='mb-4 text-sm text-center text-red-500'
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                    className={`text-sm text-center w-full mb-4 ${
                      canResend
                        ? 'text-pink-600 hover:text-pink-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
                  </button>

                  <button
                    type='button'
                    onClick={() => {
                      console.log('Verify button clicked');
                      console.log('Current OTP value:', otpValue);
                      console.log('Loading state:', loading);
                      if (!loading && otpValue.length === 6) {
                        handleVerifyOTP();
                      }
                    }}
                    disabled={loading || otpValue.length !== 6}
                    className='w-full py-4 px-4 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-700 hover:to-pink-600 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'
                  >
                    {loading ? (
                      <div className='flex items-center justify-center gap-2'>
                        <div className='w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin' />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                </>
              ) : (
                <div>
                  <label
                    htmlFor='phone'
                    className='block mb-2 text-sm font-semibold text-neutral-700'
                  >
                    Phone Number
                  </label>
                  <div className='relative flex gap-3 mb-6'>
                    <div className='relative'>
                      <button
                        type='button'
                        className='flex items-center h-12 gap-2 px-3 transition-all duration-300 border rounded-xl border-neutral-200 bg-white/80 hover:bg-white hover:border-pink-200 group'
                        onClick={() => setShowCountryList(!showCountryList)}
                      >
                        <span className='text-lg'>{selectedCountry.flag}</span>
                        <span className='font-medium text-neutral-800'>
                          +{selectedCountry.code}
                        </span>
                        <svg
                          className={`w-4 h-4 text-neutral-400 group-hover:text-pink-500 transition-all duration-200 ${showCountryList ? 'rotate-180' : ''}`}
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                          />
                        </svg>
                      </button>

                      {/* Country Dropdown with improved styling */}
                      {showCountryList && (
                        <div className='absolute left-0 z-50 w-48 mt-2 overflow-y-auto border border-pink-100 shadow-lg top-full bg-white/80 backdrop-blur-xl rounded-xl max-h-48'>
                          {countryCodes.map((country) => (
                            <div
                              key={country.id}
                              className='px-4 py-2.5 hover:bg-pink-50 cursor-pointer flex items-center gap-3 transition-colors duration-150'
                              onClick={() => handleCountrySelect(country)}
                            >
                              <span className='text-lg'>{country.flag}</span>
                              <span className='font-medium text-neutral-700'>
                                +{country.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type='tel'
                      id='phone'
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder='Enter your phone number'
                      className='flex-1 px-4 py-3.5 rounded-xl border border-neutral-200 bg-white/80 focus:border-pink-500 focus:ring focus:ring-pink-200/50 transition-all duration-300 text-neutral-800 placeholder-neutral-400 font-medium text-lg'
                      maxLength={10}
                    />
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={!isValidPhoneNumber || loading}
                    className='w-full py-4 px-4 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-700 hover:to-pink-600 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'
                  >
                    {loading ? (
                      <div className='flex items-center justify-center gap-2'>
                        <div className='w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin' />
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='p-4 mt-4 border border-red-100 rounded-lg bg-red-50'
                >
                  <p className='text-sm text-red-600'>{error}</p>
                </motion.div>
              )}
            </motion.div>

            {/* Footer section with improved styling */}
            <motion.div
              className='mt-8 space-y-4'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className='flex items-center justify-center gap-2.5 text-sm text-neutral-600'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='font-medium'>Bank Grade Security</span>
              </div>

              <p className='text-sm text-center text-neutral-500'>
                By continuing, you agree to our{' '}
                <a
                  href='#'
                  className='font-medium text-pink-600 hover:text-pink-700 underline-offset-2 decoration-pink-200 hover:underline'
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href='#'
                  className='font-medium text-pink-600 hover:text-pink-700 underline-offset-2 decoration-pink-200 hover:underline'
                >
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </main>
      <div id='recaptcha-container'></div>
    </div>
  );
}
