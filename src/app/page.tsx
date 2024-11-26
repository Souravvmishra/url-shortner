'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  user: {
    id: string;
    username: string;
    account_type: string;
    media_count: number;
  };
  media: {
    id: string;
    caption: string;
    media_type: string;
    media_url: string;
    permalink: string;
    thumbnail_url?: string;
    timestamp: string;
  }[];
}

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if access token exists in localStorage
        const accessToken = localStorage.getItem('instagram_access_token');
        
        if (!accessToken) {
          router.push('/sign-in');
          return;
        }

        const response = await fetch('/api/user-data', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (!response.ok) {
          if (response.status === 401) {
            // If unauthorized, clear token and redirect to sign in
            localStorage.removeItem('instagram_access_token');
            router.push('/sign-in');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Check URL for access token on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('access_token');
    
    if (tokenFromUrl) {
      localStorage.setItem('instagram_access_token', tokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchUserData();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <main className="min-h-screen p-4">
      {userData && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{userData.user.username}</h1>
            <p>Media Count: {userData.user.media_count}</p>
            <p>Account Type: {userData.user.account_type}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData?.media?.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <img 
                  src={item.media_type === 'VIDEO' ? item.thumbnail_url || item.media_url : item.media_url}
                  alt={item.caption || 'Instagram media'}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm line-clamp-2">{item.caption}</p>
                  <a 
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm mt-2 block"
                  >
                    View on Instagram
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
