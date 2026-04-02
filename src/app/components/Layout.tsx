import { Outlet, NavLink } from "react-router";
import { BottomNavigation } from "./BottomNavigation";
import { Home, CalendarDays, User } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <header className="hidden md:flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card/90 px-6 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 sticky top-0 z-40">
        <span className="text-lg font-semibold tracking-tight">员工打卡</span>
        <nav className="flex items-center gap-1" aria-label="主导航">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Home className="size-4" />
            首页
          </NavLink>
          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <CalendarDays className="size-4" />
            记录
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <User className="size-4" />
            我的
          </NavLink>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-3 pt-4 pb-24 md:max-w-6xl md:mx-auto md:px-8 md:pt-8 md:pb-10">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}
