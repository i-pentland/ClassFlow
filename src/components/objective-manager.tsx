import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LearningObjective } from "@/types/domain";

type ObjectiveManagerProps = {
  activeObjectives: LearningObjective[];
  availableObjectives: LearningObjective[];
  onAddObjective: (objective: LearningObjective) => void;
  onRemoveObjective: (objectiveId: string) => void;
};

export function ObjectiveManager({
  activeObjectives,
  availableObjectives,
  onAddObjective,
  onRemoveObjective,
}: ObjectiveManagerProps) {
  const [query, setQuery] = useState("");
  const filteredAvailableObjectives = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return availableObjectives.filter(
      (objective) =>
        objective.title.toLowerCase().includes(normalizedQuery) ||
        objective.description.toLowerCase().includes(normalizedQuery),
    );
  }, [availableObjectives, query]);

  return (
    <Card className="border-white/80 bg-white/90">
      <CardHeader>
        <CardTitle>Learning objectives</CardTitle>
        <CardDescription>
          Keep this list focused on what you want ClassFlow to watch for across assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {activeObjectives.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
              No learning objectives are available for this class yet.
            </div>
          ) : null}
          {activeObjectives.map((objective) => (
            <Badge key={objective.id} className="gap-2 rounded-2xl px-4 py-2 text-sm">
              <span>{objective.title}</span>
              <button
                type="button"
                onClick={() => onRemoveObjective(objective.id)}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
                aria-label={`Remove ${objective.title}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search other objectives to add"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAvailableObjectives.slice(0, 4).map((objective) => (
              <button
                key={objective.id}
                type="button"
                onClick={() => onAddObjective(objective)}
                className="rounded-3xl border border-border bg-secondary/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{objective.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{objective.description}</p>
                  </div>
                  <Plus className="mt-1 h-4 w-4 text-primary" />
                </div>
              </button>
            ))}
          </div>
          {filteredAvailableObjectives.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
              No additional objectives match this search.
            </div>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" className="px-0 text-muted-foreground">
          Objective changes stay local in this MVP preview
        </Button>
      </CardContent>
    </Card>
  );
}
