import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const launchExamples = [
  {
    label: "Teacher view iframe",
    to: "/dashboard?source=classroom_addon&iframeType=teacher_view&courseId=gc-course-1",
  },
  {
    label: "Student work review iframe",
    to: "/class/c1/assignment/a1?source=classroom_addon&iframeType=student_work_review&courseId=gc-course-1&assignmentId=gc-assignment-1&submissionId=gc-sub-1",
  },
  {
    label: "Attachment discovery iframe",
    to: "/dashboard?source=classroom_addon&iframeType=attachment_discovery&courseId=gc-course-1",
  },
];

export function MockLaunchExamples() {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className="border-white/80 bg-white/85">
      <CardHeader>
        <CardTitle className="text-base">Add-on launch examples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">
          Developer utility for simulating Google Classroom iframe contexts during local development.
        </p>
        <div className="flex flex-col gap-2">
          {launchExamples.map((example) => (
            <Link
              key={example.to}
              to={example.to}
              className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {example.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
