'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchAndStoreSavedProfiles } from '../utils/api';
import { getProfileData } from '@/lib/api/getProfileData';
import { ProfileData } from '@/types/profile';

interface UserContextType {
  userProfile: ProfileData | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  refreshSavedProfiles: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setUserProfile(null);
        localStorage.removeItem('user_profile');
        return;
      }

      const data = await getProfileData(user.uid);

      setUserProfile(data);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError('Failed to fetch user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSavedProfiles = async () => {
    try {
      await fetchAndStoreSavedProfiles();
    } catch (error) {
      console.error('Error fetching saved profiles:', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        'Auth state changed:',
        firebaseUser ? 'User logged in' : 'No user'
      );
      if (firebaseUser) {
        try {
          console.log('Fetching profile data for user:', firebaseUser.uid);
          const data = await getProfileData(firebaseUser.uid);
          console.log('Profile data fetched:', data);
          setUserProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        isLoading,
        error,
        refreshProfile,
        refreshSavedProfiles,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
