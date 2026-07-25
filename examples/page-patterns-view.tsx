// Reference composition for page-level structure and asynchronous content.
// Pattern components own their inner layout. The view supplies slot content.

import { Add, Document } from '@/components/icons';
import { Alert } from '@/components/ui/alert';
import { AsyncState } from '@/components/ui/async-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageFrame } from '@/components/ui/page-frame';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';

const reports = ['Weekly activity', 'Source health', 'Workspace access'];

export default function PagePatternsView() {
  return (
    <PageFrame>
      <PageHeader
        title="Reports"
        description="Review saved reports and create the next one."
        action={
          <Button>
            <Add size={20} aria-hidden="true" />
            Create report
          </Button>
        }
      />

      <section className="flex flex-col gap-[var(--space-4)]" aria-labelledby="saved-reports-heading">
        <SectionHeader
          headingId="saved-reports-heading"
          title="Saved reports"
          action={<Button variant="secondary">Manage reports</Button>}
        />

        <AsyncState
          status="ready"
          loading={
            <div className="flex flex-col gap-[var(--space-3)]" aria-label="Loading reports">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          }
          error={
            <Alert variant="error" title="Reports could not load">
              Check your connection, then reload this page.
            </Alert>
          }
          empty={
            <EmptyState
              icon={<Document size={32} />}
              title="No reports yet"
              description="Create a report to save a repeatable view of your workspace."
              action={<Button>Create report</Button>}
            />
          }
        >
          <div className="grid gap-[var(--space-4)] md:grid-cols-3">
            {reports.map((report) => (
              <Card key={report}>
                <CardHeader>
                  <CardTitle>{report}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
                    Updated today
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncState>
      </section>
    </PageFrame>
  );
}
