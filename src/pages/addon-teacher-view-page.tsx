import { useLoaderData } from "react-router-dom";

import { TeacherViewEmbedded } from "@/components/embedded/teacher-view-embedded";
import type { AssignmentPageData, ClassPageData, DashboardClassCard } from "@/types/view-models";

type AddonTeacherViewLoaderData = {
  classPageData: ClassPageData | null;
  assignmentData: AssignmentPageData | null;
  assignmentContextIssue: string | null;
  dashboardClasses: DashboardClassCard[];
  reviewHref: string;
};

export function AddonTeacherViewPage() {
  const { classPageData, assignmentData, assignmentContextIssue, dashboardClasses, reviewHref } =
    useLoaderData() as AddonTeacherViewLoaderData;

  return (
    <TeacherViewEmbedded
      classCards={dashboardClasses}
      classRoom={classPageData?.classRoom}
      assignments={classPageData?.assignments ?? []}
      assignment={assignmentData?.assignment ?? null}
      assignmentContextIssue={assignmentContextIssue}
      reviewHref={reviewHref}
    />
  );
}
