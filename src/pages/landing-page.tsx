import { ArrowRight, BarChart3, Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { MockLaunchExamples } from "@/components/embedded/mock-launch-examples";
import { AppShell } from "@/components/layouts/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Watch recurring patterns, not one-off mistakes",
    description: "ClassFlow clusters similar learning-objective struggles so teachers can spot what deserves reteaching.",
    icon: Compass,
  },
  {
    title: "Stay inside the teacher workflow",
    description: "This MVP is built to support reflection after submissions are in, without grading or changing what students see.",
    icon: BarChart3,
  },
  {
    title: "Frame insights carefully",
    description: "Every screen uses observation-centered language so patterns feel actionable, not final.",
    icon: Sparkles,
  },
];

export function LandingPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-7">
            <Badge variant="accent" className="w-fit">
              Teacher-facing MVP preview
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                See where learning objectives keep getting sticky.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                ClassFlow connects assignment work to the objectives you care about, then surfaces recurring patterns worth a closer look.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Explore dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">View sign-in flow</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-gentle">
                <p className="text-2xl font-bold">3</p>
                <p className="mt-1 text-sm text-muted-foreground">mock classes ready to review</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-gentle">
                <p className="text-2xl font-bold">5</p>
                <p className="mt-1 text-sm text-muted-foreground">assignments with objective tags</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-gentle">
                <p className="text-2xl font-bold">7</p>
                <p className="mt-1 text-sm text-muted-foreground">sample recurring patterns</p>
              </div>
            </div>
          </div>
          <Card className="overflow-hidden border-white/80 bg-slate-900 text-white">
            <CardHeader>
              <Badge className="w-fit bg-white/10 text-white">Inside the dashboard</Badge>
              <CardTitle className="text-2xl">A calmer way to notice what needs reteaching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.25rem] bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Observation snapshot</p>
                <p className="mt-3 text-lg font-semibold">
                  “Evidence is present but not fully connected” appeared across 7 submissions in ELA 7.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Targeted objective</p>
                  <p className="mt-2 font-medium">Support claims with textual evidence</p>
                </div>
                <div className="rounded-[1.25rem] bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Next step</p>
                  <p className="mt-2 font-medium">Plan a mini-lesson or pull examples for discussion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-white/80 bg-white/85">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <MockLaunchExamples />
        </div>
      </section>
    </AppShell>
  );
}
