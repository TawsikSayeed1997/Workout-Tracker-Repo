import { useEffect, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { RedirectIfAuthenticated, RequireAuth } from "./guards";
import { CallbackPage } from "../../features/auth/CallbackPage";
import { ActivationPage } from "../../features/auth/ActivationPage";
import { ErrorPage } from "../../features/auth/ErrorPage";
import { LoginPage } from "../../features/auth/LoginPage";
import { NotFoundPage } from "../../features/auth/NotFoundPage";
import { ProfilePage } from "../../features/profile/ProfilePage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { SavedWorkoutsPage } from "../../features/workouts/SavedWorkoutsPage";
import { WorkoutPage } from "../../features/workouts/WorkoutPage";

export function AppRouter() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextPath: string) {
    const [nextPathname = "/", queryString = ""] = nextPath.split("?");
    window.history.pushState({}, "", nextPath);
    setPath(nextPathname);
    setSearch(queryString ? `?${queryString}` : "");
  }

  if (path === "/login/callback") {
    return <CallbackPage onNavigate={navigate} />;
  }

  const isActivationPath = path === "/activate" || /^\/oidc\/activate\/[^/]+\/?$/.test(path);
  if (isActivationPath) {
    const params = new URLSearchParams(search);
    const code = (params.get("code") || params.get("activationCode") || "").trim();
    return <ActivationPage code={code} onNavigate={navigate} />;
  }

  if (path === "/login") {
    const returnTo = new URLSearchParams(search).get("returnTo") || undefined;
    return (
      <RedirectIfAuthenticated onNavigate={navigate}>
        <LoginPage returnTo={returnTo} />
      </RedirectIfAuthenticated>
    );
  }

  if (!["/", "/workouts", "/add-workout", "/profile", "/error"].includes(path)) {
    return <NotFoundPage onNavigate={navigate} />;
  }

  return (
    <RequireAuth currentPath={path} onNavigate={navigate}>
      <AppShell activePath={path} onNavigate={navigate}>
        {path === "/" ? <DashboardPage onNavigate={navigate} /> : null}
        {path === "/workouts" ? <SavedWorkoutsPage onNavigate={navigate} /> : null}
        {path === "/add-workout" ? <WorkoutPage onNavigate={navigate} /> : null}
        {path === "/profile" ? <ProfilePage /> : null}
        {path === "/error" ? <ErrorPage /> : null}
      </AppShell>
    </RequireAuth>
  );
}
