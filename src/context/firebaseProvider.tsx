'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface FirebaseContextType {
    user: User | null;
    loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
    user: null,
    loading: true
});

export const useFirebase = () => useContext(FirebaseContext);

interface FirebaseProviderProps {
    children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);

            if (!user && pathname !== '/sign-in') {
                router.push('/sign-in');
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    return (
        <FirebaseContext.Provider value={{ user, loading }}>
            {children}
        </FirebaseContext.Provider>
    );
}

export const useAuth = () => {
    const { user, loading } = useFirebase();
    return { user, loading };
};
