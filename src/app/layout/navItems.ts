import { Activity, UserRound } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "nav.workout", icon: Activity },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound }
] as const;
