import { History, LayoutDashboard, Plus, UserRound } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/workouts", labelKey: "nav.workouts", icon: History },
  { href: "/add-workout", labelKey: "nav.addWorkout", icon: Plus },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound }
] as const;
