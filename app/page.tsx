'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Center, Loader, Text, Button, Modal } from '@mantine/core';
import dynamic from 'next/dynamic';
import type { User } from 'firebase/auth';
import SearchBar from './components/SearchBar';
import AuthPanel from './components/AuthPanel';
import {
  auth,
  createAccountWithEmailPassword,
  getAuthErrorMessage,
  getUserLocationState,
  setUserFavoriteMachine,
  setUserVisitedMachine,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
  UserLocationState,
} from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { UserMachineSummary } from './components/map';
import { SignInIcon, UserCircleIcon } from '@phosphor-icons/react';

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
  const [selectedSavedFilters, setSelectedSavedFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userLocationState, setUserLocationState] = useState<UserLocationState>({
    favoriteMachineIds: [],
    visitedMachineIds: [],
  });

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

  useEffect(() => {
    const loadUserLocations = async () => {
      if (!user) {
        setUserLocationState({ favoriteMachineIds: [], visitedMachineIds: [] });
        setSelectedSavedFilters([]);
        return;
      }

      try {
        const state = await getUserLocationState(user.uid);
        setUserLocationState(state);
      } catch (error) {
        console.error('Error loading user location state:', error);
      }
    };

    loadUserLocations();
  }, [user]);

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

  const handleFavoriteChange = async (machineId: string, isFavorite: boolean) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const normalizedMachineId = String(machineId);

    try {
      const nextState = await setUserFavoriteMachine(user.uid, normalizedMachineId, isFavorite);
      setUserLocationState(nextState);
    } catch (error) {
      console.error('Error updating favorite machine:', error);
    }
  };

  const handleVisitedChange = async (machineId: string, isVisited: boolean) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const normalizedMachineId = String(machineId);

    try {
      const nextState = await setUserVisitedMachine(user.uid, normalizedMachineId, isVisited);
      setUserLocationState(nextState);
    } catch (error) {
      console.error('Error updating visited machine:', error);
    }
  };

  const machineLookup = useMemo(() => {
    return new Map(machines.map((machine) => [machine.id, machine]));
  }, [machines]);

  const favoriteMachines = useMemo<UserMachineSummary[]>(() => {
    return userLocationState.favoriteMachineIds
      .map((machineId) => {
        const machine = machineLookup.get(machineId);
        if (!machine) {
          return null;
        }

        return {
          id: machine.id,
          name: machine.name,
          address: machine.address,
        };
      })
      .filter((machine): machine is UserMachineSummary => machine !== null);
  }, [machineLookup, userLocationState.favoriteMachineIds]);

  const visitedMachines = useMemo<UserMachineSummary[]>(() => {
    return userLocationState.visitedMachineIds
      .map((machineId) => {
        const machine = machineLookup.get(machineId);
        if (!machine) {
          return null;
        }

        return {
          id: machine.id,
          name: machine.name,
          address: machine.address,
        };
      })
      .filter((machine): machine is UserMachineSummary => machine !== null);
  }, [machineLookup, userLocationState.visitedMachineIds]);

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {!isAuthLoading ? (
        <Box style={{ position: 'absolute', top: 16, right: 16, zIndex: 1200 }}>
          <Button variant="filled" onClick={() => setIsAuthModalOpen(true)} rightSection={user ? <UserCircleIcon size={16} weight="bold" /> : <SignInIcon size={16} weight="bold" />} >
            {user ? 'Profile' : 'Sign in'}
          </Button>
        </Box>
      ) : null}

      <Modal
        opened={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={user ? 'Profile' : 'Sign in'}
        centered
      >
        <AuthPanel
          user={user}
          isAuthenticating={isAuthenticating}
          authError={authError}
          favoriteMachines={favoriteMachines}
          visitedMachines={visitedMachines}
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
          isSignedIn={Boolean(user)}
          selectedSavedFilters={selectedSavedFilters}
          onSavedFilterChange={setSelectedSavedFilters}
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
          selectedSavedFilters={selectedSavedFilters}
          onMapLoaded={() => setMapReady(true)}
          favoriteMachineIds={userLocationState.favoriteMachineIds}
          visitedMachineIds={userLocationState.visitedMachineIds}
          isSignedIn={Boolean(user)}
          onRequireSignIn={() => setIsAuthModalOpen(true)}
          onFavoriteChange={handleFavoriteChange}
          onVisitedChange={handleVisitedChange}
        />
      )}
    </Box>
  );
}
