import { createBrowserRouter, redirect } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { getIframeLaunchContextFromUrl } from "@/features/iframe-context/iframe-context.service";
import { buildAuthRedirectUrl } from "@/lib/auth-intended-route";
import { getCurrentSession, getReadableAuthError } from "@/lib/auth";
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
        path: "/addon/attachment-discovery",
        element: <AddonAttachmentDiscoveryPage />,
        loader: async ({ request }) => {
          await requireAuthenticatedSession(request);
          return classflowService.getDashboardClasses();
        },
      },
      {
        path: "/addon/teacher-view",
        element: <AddonTeacherViewPage />,
        loader: async ({ request }) => {
          await requireAuthenticatedSession(request);
          const url = new URL(request.url);
          const launchContext = getIframeLaunchContextFromUrl(url);
          const [dashboardClasses, classPageData, assignmentData] = await Promise.all([
            classflowService.getDashboardClasses(),
            classflowService.getClassPageDataForLaunchContext(launchContext),
            classflowService.getAssignmentPageDataForLaunchContext(launchContext),
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
            reviewHref,
          };
        },
      },
      {
        path: "/addon/student-work-review",
        element: <AddonStudentWorkReviewPage />,
        loader: async ({ request }) => {
          await requireAuthenticatedSession(request);
          const url = new URL(request.url);
          const launchContext = getIframeLaunchContextFromUrl(url);

          return classflowService.getAssignmentPageDataForLaunchContext(launchContext);
        },
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
