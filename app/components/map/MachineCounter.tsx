import { Box, Text, Group, ActionIcon } from '@mantine/core';
import { QuestionIcon } from '@phosphor-icons/react/dist/ssr';

interface MachineCounterProps {
  filteredCount: number;
  totalCount: number;
  onHelpClick: () => void;
}

export function MachineCounter({ filteredCount, totalCount, onHelpClick }: MachineCounterProps) {
  return (
    <Group pos="absolute" bottom={12} left={12} gap={8} align="center">
      <Box
        bg="white"
        p="12px 16px"
        bdrs={8}
        fz={12}
        color="#666"
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 1,
        }}
      >
        <Text size="xs" fw={500}>
          Showing {filteredCount} of {totalCount} machines
        </Text>
      </Box>
      <ActionIcon
        variant="filled"
        bdrs={8}
        size={40.797}
        onClick={onHelpClick}
      >
        <QuestionIcon weight="bold" size={24} />
      </ActionIcon>
    </Group>
  );
}
