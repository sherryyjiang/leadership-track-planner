import { LeadershipPlannerApp } from "@/components/planner/LeadershipPlannerApp";

export default function HomePage() {
  return (
    <LeadershipPlannerApp
      convexConfigured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)}
    />
  );
}
