'use client';

import { useEffect, useState } from 'react';
import { Box, Stack, Center, Loader, Text, Button, Modal } from '@mantine/core';
import dynamic from 'next/dynamic';
import type { User } from 'firebase/auth';
import SearchBar from './components/SearchBar';
import AuthPanel from './components/AuthPanel';
import {
  auth,
  createAccountWithEmailPassword,
  getAuthErrorMessage,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
} from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface PennyMachineImage {
  title: string;
  url: string;
}
interface PennyMachine {
  id: string;
  name: string;
  address: string;
  status: 'available' | 'outoforder' | 'gone';
  designs: string;
  latitude: number;
  longitude: number;
  desc?: string;
  updated?: string;
  images: PennyMachineImage[];
}

const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => (
    <Center style={{ width: '100%', height: '100vh' }}>
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text>Loading map...</Text>
      </Stack>
    </Center>
  ),
});

export default function Home() {
  const [machines, setMachines] = useState<PennyMachine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'available',
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        const data = await response.json();
        setMachines(data);
      } catch (error) {
        console.error('Error loading machines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMachines();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const withAuthRequest = async (action: () => Promise<void>) => {
    try {
      setAuthError(null);
      setIsAuthenticating(true);
      await action();
      return true;
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    const success = await withAuthRequest(async () => {
      await signInWithEmailPassword(email, password);
    });

    if (success) {
      setIsAuthModalOpen(false);
    }
  };

  const handleCreateAccount = async (email: string, password: string) => {
    const success = await withAuthRequest(async () => {
      await createAccountWithEmailPassword(email, password);
    });

    if (success) {
      setIsAuthModalOpen(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const success = await withAuthRequest(async () => {
      await signInWithGoogle();
    });

    if (success) {
      setIsAuthModalOpen(false);
    }
  };

  const handleSignOut = async () => {
    await withAuthRequest(async () => {
      await signOutUser();
    });
  };

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {!isAuthLoading ? (
        <Box style={{ position: 'absolute', top: 16, right: 16, zIndex: 1200 }}>
          <Button variant="filled" onClick={() => setIsAuthModalOpen(true)}>
            {user ? 'Account' : 'Sign in'}
          </Button>
        </Box>
      ) : null}

      <Modal
        opened={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={user ? 'Your account' : 'Sign in'}
        centered
      >
        <AuthPanel
          user={user}
          isAuthenticating={isAuthenticating}
          authError={authError}
          onEmailSignIn={handleEmailSignIn}
          onCreateAccount={handleCreateAccount}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
        />
      </Modal>

      {!isLoading && mapReady && (
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatuses={selectedStatuses}
          onStatusChange={setSelectedStatuses}
        />
      )}

      {isLoading ? (
        <Center style={{ width: '100%', height: '100vh' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Finding penny machines...</Text>
          </Stack>
        </Center>
      ) : (
        <MapComponent
          machines={machines}
          searchTerm={searchTerm}
          selectedStatuses={selectedStatuses}
          onMapLoaded={() => setMapReady(true)}
        />
      )}
    </Box>
  );
}
