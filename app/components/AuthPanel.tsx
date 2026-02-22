'use client';

import { useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react';
import type { User } from 'firebase/auth';

interface AuthPanelProps {
  user: User | null;
  isAuthenticating: boolean;
  authError: string | null;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onCreateAccount: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export default function AuthPanel({
  user,
  isAuthenticating,
  authError,
  onEmailSignIn,
  onCreateAccount,
  onGoogleSignIn,
  onSignOut,
}: AuthPanelProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onEmailSignIn(loginEmail.trim(), loginPassword);
  };

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateAccount(createEmail.trim(), createPassword);
  };

  if (user) {
    return (
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Avatar radius="xl" color="pennyRed">
            {user.email?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Stack gap={0}>
            <Text size="sm" fw={600}>
              Signed in
            </Text>
            <Text size="xs" c="dimmed">
              {user.email ?? 'Anonymous user'}
            </Text>
          </Stack>
        </Group>
        <Button variant="light" size="xs" loading={isAuthenticating} onClick={onSignOut}>
          Sign out
        </Button>
      </Group>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Use your account to save your session and explore machines.
      </Text>

      {authError ? (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {authError}
        </Alert>
      ) : null}

      <Tabs defaultValue="signin" variant="outline">
        <Tabs.List grow>
          <Tabs.Tab value="signin">Sign in</Tabs.Tab>
          <Tabs.Tab value="create">Create account</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="signin" pt="sm">
          <form onSubmit={handleEmailSignIn}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.currentTarget.value)}
              />
              <PasswordInput
                label="Password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.currentTarget.value)}
              />
              <Button type="submit" loading={isAuthenticating} fullWidth>
                Sign in
              </Button>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="create" pt="sm">
          <form onSubmit={handleCreateAccount}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
                value={createEmail}
                onChange={(event) => setCreateEmail(event.currentTarget.value)}
              />
              <PasswordInput
                label="Password"
                description="Use at least 6 characters"
                autoComplete="new-password"
                required
                value={createPassword}
                onChange={(event) => setCreatePassword(event.currentTarget.value)}
              />
              <Button type="submit" loading={isAuthenticating} fullWidth>
                Create account
              </Button>
            </Stack>
          </form>
        </Tabs.Panel>
      </Tabs>

      <Divider label="or" labelPosition="center" />

      <Button
        variant="default"
        leftSection={<IconBrandGoogle size={16} />}
        onClick={onGoogleSignIn}
        loading={isAuthenticating}
        fullWidth
      >
        Continue with Google
      </Button>
    </Stack>
  );
}