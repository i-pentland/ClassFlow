import { BookOpen, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardClassCard } from "@/types/view-models";

type ClassCardProps = {
  classItem: DashboardClassCard;
};

export function ClassCard({ classItem }: ClassCardProps) {
  const { classRoom, assignmentCount } = classItem;

  return (
    <Card className="border-white/70 bg-white/90">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{classRoom.title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {classRoom.section} · {classRoom.periodLabel}
            </p>
          </div>
          <Badge variant="accent">{classRoom.learningObjectiveIds.length} objectives</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span>{classRoom.studentIds.length} students</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>{assignmentCount} recent assignments ready for review</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full justify-between">
          <Link to={`/class/${classRoom.id}`}>
            Open class
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
