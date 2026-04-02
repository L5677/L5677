import { Home, Calendar, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "首页", path: "/" },
    { icon: Calendar, label: "记录", path: "/attendance" },
    { icon: User, label: "我的", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border z-50 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex justify-around items-center h-16 min-h-[4rem] px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 relative px-4 py-2"
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? "text-[#3B82F6]" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs ${
                  isActive ? "text-[#3B82F6]" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#3B82F6] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}