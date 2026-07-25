'use client';

// REFERENCE VIEW. This is what correct looks like for list-shaped content.
// Companion to settings-view.tsx, which covers forms, tables, and dialogs.
//
// What it demonstrates:
// - Tabs in button mode: panels rendered by this view, not inside the tabs
// - DataList/DataRow: the row owns its layout and padding, the view passes
//   content only (A16)
// - StatusIndicator: status inside a dense row, where a filled Badge would be
//   noise
// - Select inside FormField: same label and error wiring as Input
// - AlertDialog: the only correct guard for a destructive action

import * as React from 'react';
import { Add, Document, TrashCan } from '@/components/icons';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataList, DataRow } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Select, SelectItem } from '@/components/ui/select';
import { StatusIndicator, type Status } from '@/components/ui/status-indicator';
import { Tabs, type ButtonTabItem } from '@/components/ui/tabs';

interface Source {
  id: string;
  name: string;
  detail: string;
  status: Status;
  statusLabel: string;
  items: number;
}

const sources: Source[] = [
  { id: 'weekly', name: 'Weekly research digest', detail: 'Feed, checked hourly', status: 'active', statusLabel: 'Active', items: 412 },
  { id: 'handbook', name: 'Design handbook', detail: 'Folder, 24 files', status: 'paused', statusLabel: 'Paused', items: 24 },
  { id: 'changelog', name: 'Product changelog', detail: 'Feed, last check failed', status: 'error', statusLabel: 'Needs attention', items: 88 },
];

const tabs: ButtonTabItem[] = [
  { key: 'connected', label: 'Connected', tabId: 'tab-connected', panelId: 'panel-connected', count: sources.length },
  { key: 'archived', label: 'Archived', tabId: 'tab-archived', panelId: 'panel-archived', count: 0 },
];

export default function SourcesView() {
  const [activeTab, setActiveTab] = React.useState('connected');
  const [frequency, setFrequency] = React.useState('hourly');
  const [pendingRemoval, setPendingRemoval] = React.useState<Source | undefined>();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-[var(--space-8)] p-[var(--space-8)]">
      <header className="flex flex-col gap-[var(--space-2)]">
        <h1 className="text-[length:var(--text-3xl)] font-semibold leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
          Sources
        </h1>
        <p className="text-[length:var(--text-base)] text-[var(--color-text-secondary)]">
          Everything that feeds this project, and how often it is checked.
        </p>
      </header>

      <Tabs items={tabs} activeKey={activeTab} label="Source status" onSelect={setActiveTab} />

      {activeTab === 'connected' ? (
        <div id="panel-connected" role="tabpanel" aria-labelledby="tab-connected" className="flex flex-col gap-[var(--space-8)]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-[var(--space-4)]">
                <CardTitle>Connected sources</CardTitle>
                <Button size="sm">
                  <Add size={20} aria-hidden="true" />
                  Add source
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataList>
                {sources.map((source) => (
                  <DataRow
                    key={source.id}
                    href={`/sources/${source.id}`}
                    selectLabel={`Open ${source.name}`}
                    leading={<Document size={20} aria-hidden="true" className="text-[var(--color-text-tertiary)]" />}
                    trailing={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${source.name}`}
                        onClick={() => setPendingRemoval(source)}
                      >
                        <TrashCan size={20} aria-hidden="true" />
                      </Button>
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{source.name}</span>
                      <span className="text-[var(--color-text-tertiary)]">{source.detail}</span>
                    </div>
                  </DataRow>
                ))}
              </DataList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField label="How often to check for new items" hint="Applies to every connected feed.">
                <Select value={frequency} onValueChange={setFrequency} placeholder="Pick a frequency">
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Once a day</SelectItem>
                  <SelectItem value="weekly">Once a week</SelectItem>
                </Select>
              </FormField>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div id="panel-archived" role="tabpanel" aria-labelledby="tab-archived">
          <EmptyState
            icon={<Document size={32} />}
            title="Nothing archived"
            description="Sources you archive are kept here for 30 days before they are removed."
          />
        </div>
      )}

      <AlertDialog
        open={pendingRemoval !== undefined}
        destructive
        title={`Remove ${pendingRemoval?.name ?? 'this source'}?`}
        description="The items it already captured stay in your library. New items stop arriving."
        confirmLabel="Remove source"
        onConfirm={() => setPendingRemoval(undefined)}
        onCancel={() => setPendingRemoval(undefined)}
      />
    </main>
  );
}

// Status summary strip, kept out of the main view to show StatusIndicator on
// its own: colour is always paired with the label, never carrying meaning alone.
export function SourceStatusSummary() {
  return (
    <div className="flex items-center gap-[var(--space-4)]">
      {sources.map((source) => (
        <StatusIndicator
          key={source.id}
          status={source.status}
          label={source.statusLabel}
          count={source.items}
        />
      ))}
    </div>
  );
}
