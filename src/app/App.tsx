import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "next-themes";
import { getWorkSchedule, scheduleReminders } from "./utils/notificationService";
import "../utils/demoData"; // 加载演示数据工具

export default function App() {
  useEffect(() => {
    // 初始化通知提醒系统
    const schedule = getWorkSchedule();
    if (schedule.reminderEnabled) {
      scheduleReminders(schedule);
    }

    // 开发模式下显示演示工具提示
    if (import.meta.env.DEV) {
      console.log("%c🎬 演示模式", "color: #3B82F6; font-size: 16px; font-weight: bold;");
      console.log("%c快速初始化演示数据，请在控制台输入: demoTools.initDemoData()", "color: #10B981; font-size: 14px;");
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}