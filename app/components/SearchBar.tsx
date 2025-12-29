'use client';

import {
  Box,
  TextInput,
  Group,
  Badge,
  Button,
  Stack,
  Text,
  Menu,
  Checkbox,
  Divider,
  Title,
} from '@mantine/core';
import { MagnifyingGlassIcon, FunnelSimpleIcon, ChecksIcon, XCircleIcon, CoinsIcon, CoinIcon } from '@phosphor-icons/react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'outoforder', label: 'Out of Order' },
  { value: 'gone', label: 'Gone' },
];

export default function SearchBar({
  searchTerm,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
}: SearchBarProps) {
  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  return (
    <Box
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 500,
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
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 700,
              }}
            >
              PennyDex
            </Title>
            <Text
              size="xs"
              c="dimmed"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Explore penny press machines worldwide
            </Text>
          </Stack>
        </Group>
        {/* Search Input */}
        <TextInput
          placeholder="Filter by name or address..."
          leftSection={<MagnifyingGlassIcon size={18} />}
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
            <Menu shadow="md" position="bottom-end" withArrow>
              <Menu.Target>
                <Button
                  variant="light"
                  size="xs"
                  rightSection={<FunnelSimpleIcon size={13} />}
                >
                  Options
                </Button>
              </Menu.Target>
              <Menu.Dropdown style={{ zIndex: 1000 }}>
                <Menu.Item
                  leftSection={<ChecksIcon size={18} />}
                  onClick={() => {
                    onStatusChange(STATUS_OPTIONS.map((opt) => opt.value));
                  }}
                >
                  Select All
                </Menu.Item>
                <Menu.Item
                  leftSection={<XCircleIcon size={18} />}
                  onClick={() => {
                    onStatusChange([]);
                  }}
                >
                  Clear All
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
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

        {/* Active Filters Display */}
        {
          selectedStatuses.length > 0 && (
            <>
              <Divider />
              <Box>
                <Text size="xs" c="dimmed" mb="xs">
                  Active filters:
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
                </Group>
              </Box>
            </>
          )
        }
      </Stack >
    </Box >
  );
}
