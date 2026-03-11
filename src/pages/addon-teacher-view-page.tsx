import { useLoaderData } from "react-router-dom";

import { TeacherViewEmbedded } from "@/components/embedded/teacher-view-embedded";
import { EmbeddedAppShell } from "@/components/layouts/embedded-app-shell";
import type { ClassPageData, DashboardClassCard } from "@/types/view-models";

type AddonTeacherViewLoaderData = {
  classPageData: ClassPageData | null;
  dashboardClasses: DashboardClassCard[];
  reviewHref: string;
};

export function AddonTeacherViewPage() {
  const { classPageData, dashboardClasses, reviewHref } = useLoaderData() as AddonTeacherViewLoaderData;

  return (
    <EmbeddedAppShell>
      <TeacherViewEmbedded
        classCards={dashboardClasses}
        classRoom={classPageData?.classRoom}
        assignments={classPageData?.assignments ?? []}
        reviewHref={reviewHref}
      />
    </EmbeddedAppShell>
  );
}
