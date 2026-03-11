import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardClassCard } from "@/types/view-models";
import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";

type AttachmentDiscoveryEmbeddedProps = {
  launchContext: IframeLaunchContext;
  classes: DashboardClassCard[];
};

export function AttachmentDiscoveryEmbedded({
  launchContext,
  classes,
}: AttachmentDiscoveryEmbeddedProps) {
  const suggestedClass = classes.find(
    (item) =>
      item.classRoom.sourceCourseRef === launchContext.lmsCourseId || item.classRoom.id === launchContext.lmsCourseId,
  ) ?? classes[0];

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-white/80 bg-white/92">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {import.meta.env.DEV ? (
              <Badge variant="outline" className="w-fit">
                Embedded mode
              </Badge>
            ) : null}
            <Badge variant="accent" className="w-fit">
              Attachment discovery
            </Badge>
          </div>
          <CardTitle className="text-2xl">Choose where ClassFlow should appear</CardTitle>
          <CardDescription>
            This hosted route is the future setup surface for attaching ClassFlow inside Google
            Classroom. It stays compact because the primary teacher workflow belongs in Classroom.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.25rem] bg-secondary/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Compass className="h-4 w-4 text-primary" />
              <span>Intended use</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Launch from Google Classroom without moving teachers into a separate product workflow.</li>
              <li>Keep analysis inside a compact iframe surface.</li>
              <li>Route teachers into student work review when deeper insight is needed.</li>
            </ul>
          </div>
          <div className="space-y-3 rounded-[1.25rem] bg-slate-900 p-4 text-white">
            <p className="text-sm text-slate-300">Suggested next surface</p>
            <p className="text-sm leading-6 text-slate-200">
              {suggestedClass
                ? `Use the student work review route for ${suggestedClass.classRoom.title} once an assignment context is available.`
                : "Add a course or assignment context to simulate where ClassFlow should open next."}
            </p>
            <Button asChild variant="accent" className="w-full justify-center">
              <Link
                to={
                  suggestedClass
                    ? `/addon/teacher-view?source=classroom_addon&courseId=${encodeURIComponent(
                        suggestedClass.classRoom.sourceCourseRef,
                      )}`
                    : "/addon/teacher-view?source=classroom_addon"
                }
              >
                Open teacher view
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
