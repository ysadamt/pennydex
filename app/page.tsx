'use client';

import { useEffect, useState } from 'react';
import { Box, Stack, Center, Loader, Text } from '@mantine/core';
import dynamic from 'next/dynamic';
import SearchBar from './components/SearchBar';

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

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatuses={selectedStatuses}
        onStatusChange={setSelectedStatuses}
      />

      {isLoading ? (
        <Center style={{ width: '100%', height: '100vh' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading penny machines...</Text>
          </Stack>
        </Center>
      ) : (
        <MapComponent
          machines={machines}
          searchTerm={searchTerm}
          selectedStatuses={selectedStatuses}
        />
      )}
    </Box>
  );
}
