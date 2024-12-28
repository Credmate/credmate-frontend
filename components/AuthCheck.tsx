'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const isAuthPage = pathname?.startsWith('/auth');
        
        // Only redirect if we're not already on the correct page
        if (!token && !isAuthPage && pathname !== '/auth/phone') {
          await router.push('/auth/phone');
        } else if (token && isAuthPage) {
          await router.push('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Don't render children while checking auth to prevent flash
  if (isChecking) {
    return null;
  }

  return null;
}
