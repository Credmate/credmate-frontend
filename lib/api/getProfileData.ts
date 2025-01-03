import { ProfileData } from '@/types/profile';
import { auth } from '../firebase';

export async function getProfileData(uid: string): Promise<ProfileData> {
  try {
    // Check cached profile
    const storedProfile = localStorage.getItem('user_profile');
    const lastFetched = localStorage.getItem('profile_last_fetched');
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

    if (
      storedProfile &&
      lastFetched &&
      Date.now() - parseInt(lastFetched) < cacheDuration
    ) {
      return JSON.parse(storedProfile);
    }

    // Fetch fresh data
    const user = auth.currentUser;
    const idToken = await user?.getIdToken(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/complete-profile`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch profile data');

    const data = await response.json();

    // fallback
    const profileData = {
      ...data,
      plan: 'FREE',
      credmate_score: data.credmate_score || 750,
      cibil_score: data.cibil_score || 675,
    };

    localStorage.setItem('user_profile', JSON.stringify(profileData));
    localStorage.setItem('profile_last_fetched', Date.now().toString());

    console.log(' get Profile profileData:', profileData);
    return profileData;
  } catch (error) {
    console.error('Error getting profile data:', error);
    throw error;
  }
}

export async function updateProfileData(
  uid: string,
  profileData: ProfileData
): Promise<void> {
  try {
    const storedProfiles = localStorage.getItem('profiles');
    const profiles = storedProfiles ? JSON.parse(storedProfiles) : {};

    profiles[uid] = { ...profileData, id: uid };
    localStorage.setItem('profiles', JSON.stringify(profiles));
  } catch (error) {
    console.error('Error updating profile data:', error);
    throw error;
  }
}

export async function getStoredProfile(): Promise<{ id: string } | null> {
  try {
    const currentProfile = localStorage.getItem('current_profile');
    return currentProfile ? JSON.parse(currentProfile) : null;
  } catch (error) {
    console.error('Error getting stored profile:', error);
    return null;
  }
}
