import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dumbbell, LogIn, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md border-border bg-card text-text-main shadow-2xl shadow-accent/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Dumbbell className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">IRONTRACK</CardTitle>
              <CardDescription className="text-text-dim">
                Seu rastreador de treinos simples e eficiente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin} 
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-background font-bold"
                size="lg"
              >
                <LogIn className="h-5 w-5" />
                Entrar com Google
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children(user)}</>;
};
