import { Box, Text, Badge, Group, Stack, Button } from '@mantine/core';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { PennyMachine } from './types';
import { getStatusLabel, getStatusBadgeColor } from './utils';

interface PopupContentProps {
  machine: PennyMachine;
}

export function PopupContent({ machine }: PopupContentProps) {
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
