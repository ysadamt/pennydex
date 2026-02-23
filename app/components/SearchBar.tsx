'use client';

import {
  Box,
  TextInput,
  Group,
  Badge,
  Button,
  Stack,
  Text,
  Checkbox,
  Divider,
  Title,
} from '@mantine/core';
import { MagnifyingGlassIcon, CoinIcon } from '@phosphor-icons/react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  isSignedIn: boolean;
  selectedSavedFilters: string[];
  onSavedFilterChange: (filters: string[]) => void;
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'outoforder', label: 'Out of Order' },
  { value: 'gone', label: 'Gone' },
];

const SAVED_FILTER_OPTIONS = [
  { value: 'favorites', label: 'Favorites' },
  { value: 'visited', label: 'Visited' },
];

export default function SearchBar({
  searchTerm,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
  isSignedIn,
  selectedSavedFilters,
  onSavedFilterChange,
}: SearchBarProps) {
  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleSavedFilterToggle = (filter: string) => {
    if (selectedSavedFilters.includes(filter)) {
      onSavedFilterChange(selectedSavedFilters.filter((value) => value !== filter));
    } else {
      onSavedFilterChange([...selectedSavedFilters, filter]);
    }
  };

  return (
    <Box
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 100,
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
        padding: 16,
      }}
    >
      <Stack gap="md" style={{ minWidth: 320 }}>
        <Group gap={12}>
          <CoinIcon size={50} weight="duotone" color="#AD6F69" style={{ rotate: "60deg" }} />
          <Stack gap={0}>
            <Title
              order={1}
              size="h1"
              style={{
                fontFamily: "'Arial Rounded Bold', sans-serif",
                fontWeight: 700,
              }}
            >
              PennyDex
            </Title>
            <Text
              size="xs"
              c="dimmed"
              style={{
                fontFamily: "'Sn Pro', sans-serif",
              }}
            >
              Explore penny press machines worldwide.
            </Text>
          </Stack>
        </Group>
        {/* Search Input */}
        <TextInput
          placeholder="Filter by name or address..."
          leftSection={<MagnifyingGlassIcon weight="bold" size={18} />}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          radius="md"
          size="md"
          styles={{
            input: {
              border: '1px solid #e9ecef',
            },
          }}
        />

        <Divider />

        {/* Filter Section */}
        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={600}>
              Status Filters
            </Text>
            <Group gap="xs">
              <Button
                variant="light"
                size="compact-xs"
                onClick={() => onStatusChange(STATUS_OPTIONS.map((opt) => opt.value))}
              >
                Select all
              </Button>
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                onClick={() => onStatusChange([])}
              >
                Clear
              </Button>
            </Group>
          </Group>

          {/* Checkboxes */}
          <Stack gap="sm">
            {STATUS_OPTIONS.map((option) => (
              <Group key={option.value} gap="xs">
                <Checkbox
                  checked={selectedStatuses.includes(option.value)}
                  onChange={() => handleStatusToggle(option.value)}
                  styles={{
                    input: {
                      cursor: 'pointer',
                    },
                  }}
                />
                <Text
                  size="sm"
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => handleStatusToggle(option.value)}
                >
                  {option.label}
                </Text>
              </Group>
            ))}
          </Stack>
        </Box>

        {isSignedIn ? (
          <>
            <Divider />
            <Box>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600}>
                  Saved Filters
                </Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    size="compact-xs"
                    onClick={() => onSavedFilterChange(SAVED_FILTER_OPTIONS.map((filter) => filter.value))}
                  >
                    Select all
                  </Button>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-xs"
                    onClick={() => onSavedFilterChange([])}
                  >
                    Clear
                  </Button>
                </Group>
              </Group>

              <Stack gap="sm">
                {SAVED_FILTER_OPTIONS.map((filter) => (
                  <Group key={filter.value} gap="xs">
                    <Checkbox
                      checked={selectedSavedFilters.includes(filter.value)}
                      onChange={() => handleSavedFilterToggle(filter.value)}
                      styles={{
                        input: {
                          cursor: 'pointer',
                        },
                      }}
                    />
                    <Text
                      size="sm"
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => handleSavedFilterToggle(filter.value)}
                    >
                      {filter.label}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Box>
          </>
        ) : null}

        {/* Current Filters Display */}
        {
          (selectedStatuses.length > 0 || selectedSavedFilters.length > 0) && (
            <>
              <Divider />
              <Box>
                <Text size="xs" c="dimmed" mb="xs">
                  Current filters:
                </Text>
                <Group gap={4}>
                  {selectedStatuses.map((status) => (
                    <Badge
                      key={status}
                      variant="filled"
                      color={
                        status === 'available'
                          ? 'green'
                          : status === 'outoforder'
                            ? 'yellow'
                            : 'red'
                      }
                      onClick={() => handleStatusToggle(status)}
                      style={{ cursor: 'pointer' }}
                    >
                      {STATUS_OPTIONS.find((opt) => opt.value === status)?.label}
                    </Badge>
                  ))}
                  {selectedSavedFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="filled"
                      color={filter === 'favorites' ? 'pink' : 'blue'}
                      onClick={() => handleSavedFilterToggle(filter)}
                      style={{ cursor: 'pointer' }}
                    >
                      {SAVED_FILTER_OPTIONS.find((opt) => opt.value === filter)?.label}
                    </Badge>
                  ))}
                </Group>
              </Box>
            </>
          )
        }
      </Stack >
    </Box >
  );
}
