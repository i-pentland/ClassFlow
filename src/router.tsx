import { createBrowserRouter, redirect } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { getIframeLaunchContextFromSearch } from "@/features/iframe-context/iframe-context.service";
import { getCurrentSession, getReadableAuthError } from "@/lib/auth";
import { AuthCallbackPage } from "@/pages/auth-callback-page";
import { AssignmentPage } from "@/pages/assignment-page";
import { AuthPage } from "@/pages/auth-page";
import { ClassPage } from "@/pages/class-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LandingPage } from "@/pages/landing-page";
import { classflowService } from "@/services/classflowService";

async function requireAuthenticatedSession() {
  const { data, error } = await getCurrentSession();

  if (error) {
    throw redirect(`/auth?error=${encodeURIComponent(getReadableAuthError(error))}`);
  }

  if (!data.session) {
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

  return getIframeLaunchContextFromSearch(`?${params.toString()}`);
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
          await requireAuthenticatedSession();
          const search = new URL(request.url).search;
          const launchContext = getIframeLaunchContextFromSearch(search);
          const launchTarget = await classflowService.resolveLaunchTarget(launchContext);

          if (launchTarget) {
            throw redirect(`${launchTarget}${search}`);
          }

          return classflowService.getDashboardClasses();
        },
      },
      {
        path: "/class/:classId",
        element: <ClassPage />,
        loader: async ({ params, request }) => {
          await requireAuthenticatedSession();
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
          await requireAuthenticatedSession();
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
