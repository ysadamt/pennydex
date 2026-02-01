import { Modal, Stack, Text, Group, Badge, Anchor } from '@mantine/core';

interface HelpModalProps {
  opened: boolean;
  onClose: () => void;
}

export function HelpModal({ opened, onClose }: HelpModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="How to Use PennyDex"
      size="md"
      styles={{
        title: {
          fontWeight: 600,
          fontSize: '1.5rem',
        },
      }}
    >
      <Stack gap="md">
        <Text size="sm">
          Welcome to <strong>PennyDex</strong>; your interactive guide to finding pressed penny machines worldwide! As a longtime pressed penny enthusiast, I've created this tool that visualizes all the penny press locations from <Anchor href="http://locations.pennycollector.com/" target="_blank" rel="noopener noreferrer">PennyCollector.com</Anchor>.
        </Text>

        <Stack gap="xs">
          <Text size="sm" fw={500}>Search</Text>
          <Text size="sm" c="dimmed">
            Use the search bar to filter machines by name or address. Start typing to see matching results.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={500}>Status Filters</Text>
          <Text size="sm" c="dimmed">
            Use the status filters to show machines by their current status:
          </Text>
          <Group gap="xs">
            <Badge color="green" size="sm">Available</Badge>
            <Text size="xs" c="dimmed">Machine is working</Text>
          </Group>
          <Group gap="xs">
            <Badge color="yellow" size="sm">Out of Order</Badge>
            <Text size="xs" c="dimmed">Machine needs repair</Text>
          </Group>
          <Group gap="xs">
            <Badge color="red" size="sm">Gone</Badge>
            <Text size="xs" c="dimmed">Machine has been removed</Text>
          </Group>
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={500}>Map Navigation</Text>
          <Text size="sm" c="dimmed">
            Click on clusters to zoom in and see individual machines. Click on a machine marker to view its details, including a link for more information.
          </Text>
        </Stack>

        <Text size="xs" c="dimmed" mt="sm">
          Data sourced from <Anchor href="http://locations.pennycollector.com/" target="_blank" rel="noopener noreferrer">PennyCollector.com</Anchor>. Made with ❤️ by <Anchor href="https://ysadamt.com/" target="_blank" rel="noopener noreferrer">Adam Teo</Anchor>.
        </Text>
      </Stack>
    </Modal>
  );
}
