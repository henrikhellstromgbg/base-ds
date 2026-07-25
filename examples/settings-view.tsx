'use client';

// REFERENCE VIEW. This is what correct looks like.
// Composition only: every element comes from components/ui/.
// Layout: div/flex/grid with --space-* tokens. No new components (P4).
// Copy: sentence case, plain verbs, errors say how to recover.

import * as React from 'react';
import { Add, Search, TrashCan } from '@/components/icons';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField, Input } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const members = [
  { name: 'Anna Lindqvist', email: 'anna@example.com', role: 'Owner', status: 'success' as const, statusLabel: 'Active' },
  { name: 'Johan Berg', email: 'johan@example.com', role: 'Editor', status: 'warning' as const, statusLabel: 'Invite pending' },
];

export default function SettingsView() {
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [loading] = React.useState(false);

  function validateEmail() {
    if (email && !email.includes('@')) {
      setEmailError('Enter a valid email address, like name@company.com');
    } else {
      setEmailError(undefined);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-[var(--space-8)] p-[var(--space-8)]">
      <header className="flex flex-col gap-[var(--space-2)]">
        {/* No eyebrow (C2). "Workspace settings" above "Team members" was two
            headings competing. The description below carries the context. */}
        <h1 className="text-[length:var(--text-3xl)] font-semibold leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
          Team members
        </h1>
        <p className="text-[length:var(--text-base)] text-[var(--color-text-secondary)]">
          Invite people to this workspace and manage their access.
        </p>
      </header>

      <Alert variant="info" title="Two seats left on your plan">
        Upgrade to invite more than five members.
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-[var(--space-4)]">
            <div className="flex flex-col gap-1">
              <CardTitle>Members</CardTitle>
              <CardDescription>People with access to this workspace.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Add size={20} aria-hidden="true" />
                  Invite member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite member</DialogTitle>
                  <DialogDescription>They get an email with a link to join this workspace.</DialogDescription>
                </DialogHeader>
                <FormField label="Email" error={emailError} required>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={validateEmail}
                    placeholder="name@company.com"
                  />
                </FormField>
                <DialogFooter>
                  <Button variant="secondary">Cancel</Button>
                  <Button disabled={!email || Boolean(emailError)}>Send invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-[var(--space-3)]">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No members yet"
              description="Invite your first team member to start collaborating."
              action={<Button>Invite member</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.email}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-[var(--color-text-tertiary)]">{m.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{m.role}</TableCell>
                    <TableCell>
                      <Badge variant={m.status}>{m.statusLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Remove ${m.name}`}>
                        <TrashCan size={20} aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
