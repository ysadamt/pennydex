import { Box, Text, Badge, Group, Stack, Button } from '@mantine/core';
import { ArrowUpRightIcon, CheckCircleIcon, HeartIcon } from '@phosphor-icons/react';
import { PennyMachine } from './types';
import { getStatusLabel, getStatusBadgeColor } from './utils';
import { useState } from 'react';

interface PopupContentProps {
  machine: PennyMachine;
  isSignedIn: boolean;
  isFavorite: boolean;
  isVisited: boolean;
  onRequireSignIn: () => void;
  onFavoriteChange: (machineId: string, isFavorite: boolean) => Promise<void>;
  onVisitedChange: (machineId: string, isVisited: boolean) => Promise<void>;
}

export function PopupContent({
  machine,
  isSignedIn,
  isFavorite,
  isVisited,
  onRequireSignIn,
  onFavoriteChange,
  onVisitedChange,
}: PopupContentProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [visited, setVisited] = useState(isVisited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [visitedLoading, setVisitedLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }

    setFavoriteLoading(true);
    const nextFavorite = !favorite;
    try {
      setFavorite(nextFavorite);
      await onFavoriteChange(machine.id, nextFavorite);
    } catch {
      setFavorite(!nextFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleVisitedClick = async () => {
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }

    setVisitedLoading(true);
    const nextVisited = !visited;
    try {
      setVisited(nextVisited);
      await onVisitedChange(machine.id, nextVisited);
    } catch {
      setVisited(!nextVisited);
    } finally {
      setVisitedLoading(false);
    }
  };

  return (
    <Box miw={260} p="16px 4px 4px 4px">
      <Group justify="space-between" align="flex-start" gap="xs" mb="xs">
        <Stack gap={2} flex={1}>
          <Text fw={600} size="sm" c="dark">
            {machine.name}
          </Text>
          <Text size="xs" c="dimmed">
            {machine.address}
          </Text>
        </Stack>
        <Badge color={getStatusBadgeColor(machine.status)} variant="light" size="sm">
          {getStatusLabel(machine.status)}
        </Badge>
      </Group>

      <Group gap="xs" mb="xs">
        <Text size="xs" fw={500} mr={-6}>
          Designs:
        </Text>
        <Badge variant="outline" color="gray" size="sm">
          {machine.designs}
        </Badge>
      </Group>

      {machine.updated && (
        <Text size="xs" c="dimmed">
          Last updated: {machine.updated}
        </Text>
      )}

      <Group mt="xs" grow>
        <Button
          variant={favorite ? 'filled' : 'light'}
          color={favorite ? 'pink' : 'gray'}
          size="xs"
          rightSection={<HeartIcon size={15} weight={favorite ? 'fill' : 'bold'} />}
          onClick={handleFavoriteClick}
          loading={favoriteLoading}
        >
          {favorite ? 'Favorited' : 'Favorite'}
        </Button>
        <Button
          variant={visited ? 'filled' : 'light'}
          color={visited ? 'blue' : 'gray'}
          size="xs"
          rightSection={<CheckCircleIcon size={15} weight={visited ? 'fill' : 'bold'} />}
          onClick={handleVisitedClick}
          loading={visitedLoading}
        >
          {visited ? 'Visited' : 'Mark visited'}
        </Button>
      </Group>

      {!isSignedIn ? (
        <Text size="xs" c="dimmed" mt="xs">
          Sign in to save favorites and visited locations.
        </Text>
      ) : null}

      <Button
        component="a"
        href={`http://locations.pennycollector.com/Details.aspx?location=${machine.id}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="light"
        fullWidth
        size="xs"
        mt="xs"
        rightSection={
          <ArrowUpRightIcon size={14} weight="bold" />
        }
      >
        PennyCollector.com
      </Button>
    </Box>
  );
}
