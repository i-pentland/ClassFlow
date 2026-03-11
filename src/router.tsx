import { createBrowserRouter, redirect } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AddonRouteLayout } from "@/components/layouts/addon-route-layout";
import { getIframeLaunchContextFromUrl } from "@/features/iframe-context/iframe-context.service";
import { buildAuthRedirectUrl } from "@/lib/auth-intended-route";
import { getCurrentSession, getReadableAuthError } from "@/lib/auth";
import { getLastLmsProviderIssue } from "@/services/lms/lms.provider";
import { AddonAttachmentDiscoveryPage } from "@/pages/addon-attachment-discovery-page";
import { AddonStudentWorkReviewPage } from "@/pages/addon-student-work-review-page";
import { AddonTeacherViewPage } from "@/pages/addon-teacher-view-page";
import { AuthCallbackPage } from "@/pages/auth-callback-page";
import { AssignmentPage } from "@/pages/assignment-page";
import { AuthPage } from "@/pages/auth-page";
import { ClassPage } from "@/pages/class-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LandingPage } from "@/pages/landing-page";
import { classflowService } from "@/services/classflowService";

async function requireAuthenticatedSession(request?: Request) {
  const { data, error } = await getCurrentSession();

  if (error) {
    const fallbackRoute = request ? new URL(request.url) : null;
    const intendedRoute = fallbackRoute ? `${fallbackRoute.pathname}${fallbackRoute.search}` : null;
    const authUrl = intendedRoute ? buildAuthRedirectUrl(intendedRoute) : "/auth";
    const separator = authUrl.includes("?") ? "&" : "?";

    throw redirect(`${authUrl}${separator}error=${encodeURIComponent(getReadableAuthError(error))}`);
  }

  if (!data.session) {
    if (request) {
      const url = new URL(request.url);
      throw redirect(buildAuthRedirectUrl(`${url.pathname}${url.search}`));
    }

    throw redirect("/auth");
  }

  return data.session;
}

function withRouteContext(request: Request, fallbackIds: { courseId?: string; assignmentId?: string }) {
  const url = new URL(request.url);
  const params = url.searchParams;

  if (!params.get("courseId") && fallbackIds.courseId) {
    params.set("courseId", fallbackIds.courseId);
  }

  if (!params.get("assignmentId") && fallbackIds.assignmentId) {
    params.set("assignmentId", fallbackIds.assignmentId);
  }

  return getIframeLaunchContextFromUrl(new URL(`${url.origin}${url.pathname}?${params.toString()}`));
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
        loader: async ({ request }) => {
          await requireAuthenticatedSession(request);
          const url = new URL(request.url);
          const search = url.search;
          const launchContext = getIframeLaunchContextFromUrl(url);
          const launchTarget = await classflowService.resolveLaunchTarget(launchContext);

          if (launchTarget) {
            throw redirect(`${launchTarget}${search}`);
          }

          return classflowService.getDashboardClasses();
        },
      },
      {
        path: "/addon",
        element: <AddonRouteLayout />,
        children: [
          {
            path: "attachment-discovery",
            element: <AddonAttachmentDiscoveryPage />,
            loader: async ({ request }) => {
              await requireAuthenticatedSession(request);
              return classflowService.getDashboardClasses();
            },
          },
          {
            path: "teacher-view",
            element: <AddonTeacherViewPage />,
            loader: async ({ request }) => {
              await requireAuthenticatedSession(request);
              const url = new URL(request.url);
              const launchContext = getIframeLaunchContextFromUrl(url);
              let assignmentData = null;
              let assignmentContextIssue: string | null = null;

              try {
                assignmentData = await classflowService.getAssignmentPageDataForLaunchContext(launchContext);
              } catch {
                assignmentContextIssue =
                  getLastLmsProviderIssue() ??
                  "We could not resolve the selected Google Classroom assignment for this embedded view.";
              }

              const [dashboardClasses, classPageData] = await Promise.all([
                classflowService.getDashboardClasses(),
                classflowService.getClassPageDataForLaunchContext(launchContext),
              ]);

              const reviewHref = assignmentData
                ? `/addon/student-work-review?source=classroom_addon&courseId=${encodeURIComponent(
                    assignmentData.classRoom.sourceCourseRef,
                  )}&assignmentId=${encodeURIComponent(assignmentData.assignment.sourceAssignmentRef)}${
                    launchContext.lmsSubmissionId ? `&submissionId=${encodeURIComponent(launchContext.lmsSubmissionId)}` : ""
                  }`
                : "/addon/student-work-review?source=classroom_addon";

              return {
                dashboardClasses,
                classPageData,
                assignmentData,
                assignmentContextIssue,
                reviewHref,
              };
            },
          },
          {
            path: "student-work-review",
            element: <AddonStudentWorkReviewPage />,
            loader: async ({ request }) => {
              await requireAuthenticatedSession(request);
              const url = new URL(request.url);
              const launchContext = getIframeLaunchContextFromUrl(url);
              try {
                const data = await classflowService.getStudentWorkReviewPageDataForLaunchContext(launchContext);

                if (import.meta.env.DEV) {
                  console.info("[classflow][student-work-review] Loader resolved.", {
                    courseId: launchContext.lmsCourseId ?? null,
                    assignmentId: launchContext.lmsAssignmentId ?? null,
                    submissionId: launchContext.lmsSubmissionId ?? null,
                    assignmentResolved: Boolean(data.assignmentData),
                    submissionCount: data.submissionReferences.length,
                    debugState: data.debugState,
                  });
                }

                return data;
              } catch {
                return {
                  assignmentData: null,
                  assignmentContextIssue:
                    getLastLmsProviderIssue() ??
                    "We could not resolve the selected Google Classroom assignment for student work review.",
                  submissionReferences: [],
                  submissionLoadIssue: null,
                  submissionPreparationSummary: null,
                  observationPatterns: [],
                  observationIssue: null,
                  selectedSubmission: null,
                  debugState: null,
                };
              }
            },
          },
        ],
      },
      {
        path: "/class/:classId",
        element: <ClassPage />,
        loader: async ({ params, request }) => {
          await requireAuthenticatedSession(request);
          const classId = params.classId;

          if (!classId) {
            return null;
          }

          const data = await classflowService.getClassPageData(classId);

          if (data) {
            return data;
          }

          const launchContext = withRouteContext(request, { courseId: classId });
          const launchTarget = await classflowService.resolveLaunchTarget(launchContext);

          if (launchTarget && launchTarget !== `/class/${classId}`) {
            throw redirect(`${launchTarget}${new URL(request.url).search}`);
          }

          return null;
        },
      },
      {
        path: "/class/:classId/assignment/:assignmentId",
        element: <AssignmentPage />,
        loader: async ({ params, request }) => {
          await requireAuthenticatedSession(request);
          const { classId, assignmentId } = params;

          if (!classId || !assignmentId) {
            return null;
          }

          const data = await classflowService.getAssignmentPageData(classId, assignmentId);

          if (data) {
            return data;
          }

          const launchContext = withRouteContext(request, {
            courseId: classId,
            assignmentId,
          });
          const launchTarget = await classflowService.resolveLaunchTarget(launchContext);

          if (launchTarget && launchTarget !== `/class/${classId}/assignment/${assignmentId}`) {
            throw redirect(`${launchTarget}${new URL(request.url).search}`);
          }

          return null;
        },
      },
    ],
  },
]);
