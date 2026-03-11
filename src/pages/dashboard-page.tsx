import { useLoaderData, useLocation } from "react-router-dom";

import { LmsDebugPanel } from "@/components/debug/lms-debug-panel";
import { TeacherViewEmbedded } from "@/components/embedded/teacher-view-embedded";
import { AppShell } from "@/components/layouts/app-shell";
import { ClassCard } from "@/components/class-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIframeLaunchContextFromLocation, isTeacherViewContext } from "@/features/iframe-context/iframe-context.service";
import { getLastLmsProviderIssue } from "@/services/lms/lms.provider";
import type { DashboardClassCard } from "@/types/view-models";

export function DashboardPage() {
  const classes = useLoaderData() as DashboardClassCard[];
  const location = useLocation();
  const providerIssue = getLastLmsProviderIssue();
  const launchContext = getIframeLaunchContextFromLocation(location.pathname, location.search);

  if (isTeacherViewContext(launchContext)) {
    return (
      <AppShell>
        <TeacherViewEmbedded classCards={classes} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4">
          <Badge variant="accent" className="w-fit">
            Dashboard
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Your classes</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Choose a class to review recent assignments, refine learning objectives, and observe patterns that may deserve follow-up.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {providerIssue ? (
            <Card className="md:col-span-2 xl:col-span-3 border-amber-200 bg-amber-50/90">
              <CardHeader>
                <CardTitle>Google Classroom fallback active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-amber-900/80">{providerIssue}</p>
              </CardContent>
            </Card>
          ) : null}
          {classes.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3 border-white/80 bg-white/90">
              <CardHeader>
                <CardTitle>No classes available yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Connect a classroom data source or enable the Google Classroom provider to populate this dashboard.
                </p>
              </CardContent>
            </Card>
          ) : null}
          {classes.map((classItem) => (
            <ClassCard key={classItem.classRoom.id} classItem={classItem} />
          ))}
        </div>
        {import.meta.env.DEV ? (
          <div className="mt-8">
            <LmsDebugPanel classes={classes} />
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
