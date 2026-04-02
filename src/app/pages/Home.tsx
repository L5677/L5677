import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Camera, Clipboard, Upload, Clock, CalendarX } from "lucide-react";
import {
  apiGetMonthSummary,
  apiGetTodayAttendance,
  apiToggleTodayAttendance,
} from "../utils/apiClient";

type ClockStatus = "none" | "checkedIn" | "completed";

function ClockButtonBlock({
  clockStatus,
  ripples,
  getButtonText,
  onClockIn,
}: {
  clockStatus: ClockStatus;
  ripples: number[];
  getButtonText: () => string;
  onClockIn: () => void;
}) {
  return (
    <div className="relative flex justify-center">
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.div
            key={id}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/2 size-[min(12.5rem,72vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#3B82F6] md:size-[200px]"
          />
        ))}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: clockStatus === "completed" ? 1 : 0.95 }}
        onClick={onClockIn}
        disabled={clockStatus === "completed"}
        className={`relative flex size-[min(12.5rem,72vw)] items-center justify-center rounded-full text-lg font-semibold tracking-wide text-white shadow-2xl transition-all duration-300 active:shadow-lg md:size-[200px] md:text-2xl md:font-medium ${
          clockStatus === "completed"
            ? "cursor-not-allowed bg-green-500"
            : "bg-[#3B82F6] hover:bg-[#2563EB]"
        }`}
        style={{ boxShadow: "0 16px 40px rgba(59, 130, 246, 0.35)" }}
      >
        {getButtonText()}
      </motion.button>
    </div>
  );
}

export function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockStatus, setClockStatus] = useState<ClockStatus>("none");
  const [ripples, setRipples] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState({
    monthWorkHours: 0,
    monthLeaveDays: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    apiGetTodayAttendance()
      .then((res) => setClockStatus(res.clockStatus))
      .catch(() => {
        // 未登录/Token 失效时，保持默认 none
      });

    loadStats();
  }, []);

  const loadStats = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month1to12 = today.getMonth() + 1;
    apiGetMonthSummary(year, month1to12)
      .then((res) =>
        setDashboard({
          monthWorkHours: res.monthWorkHours,
          monthLeaveDays: res.monthLeaveDays,
        }),
      )
      .catch(() => {
        setDashboard({ monthWorkHours: 0, monthLeaveDays: 0 });
      });
  };

  const handleClockIn = () => {
    if (clockStatus === "completed") return;
    apiToggleTodayAttendance()
      .then((res) => {
        setClockStatus(res.clockStatus);
        setRipples((prev) => [...prev, Date.now()]);
        setTimeout(() => {
          setRipples((prev) => prev.slice(1));
        }, 1000);
        loadStats();
      })
      .catch((err: any) => {
        setNotice(err?.message || "打卡失败，请稍后重试");
      });
  };

  const getButtonText = () => {
    switch (clockStatus) {
      case "none":
        return "上班打卡";
      case "checkedIn":
        return "下班打卡";
      case "completed":
        return "已完成";
    }
  };

  const quickActions = [
    { icon: Mic, label: "语音" },
    { icon: Camera, label: "拍照" },
    { icon: Clipboard, label: "粘贴" },
    { icon: Upload, label: "导入" },
  ];

  const showComingSoon = () => {
    setNotice("该功能仍在完善中，将在后续版本开放，敬请期待。");
  };

  const formatWorkHours = (h: number) => {
    if (h <= 0) return "0";
    return Number.isInteger(h) ? String(h) : h.toFixed(1);
  };

  return (
    <>
      <div className="flex min-h-[calc(100dvh-7rem)] flex-col pb-28 md:min-h-[calc(100vh-8rem)] md:pb-6">
        <div className="mb-4 grid grid-cols-2 gap-2 md:mb-6 md:gap-3">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-2.5 text-white md:p-3"
          >
            <Clock className="mb-1 size-4 opacity-80 md:mb-2 md:size-5" />
            <div className="text-lg font-semibold leading-tight md:text-2xl">
              {formatWorkHours(dashboard.monthWorkHours)}h
            </div>
            <div className="text-[10px] opacity-80 md:text-xs">本月工作时长</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 text-white md:p-3"
          >
            <CalendarX className="mb-1 size-4 opacity-80 md:mb-2 md:size-5" />
            <div className="text-lg font-semibold leading-tight md:text-2xl">{dashboard.monthLeaveDays}</div>
            <div className="text-[10px] opacity-80 md:text-xs">本月请假天数</div>
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 shrink-0 text-center md:mb-10"
          >
            <div className="text-4xl font-light tracking-tight md:text-6xl">
              {currentTime.toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="mt-1 text-sm text-muted-foreground md:text-base">
              {currentTime.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </div>
          </motion.div>

          {/* 打卡按钮：占据中部留白区域，贴近屏幕垂直中心 */}
          <div className="flex w-full flex-1 flex-col items-center justify-center py-2 md:py-6">
            <div className="relative z-30 flex justify-center md:mb-12">
              <ClockButtonBlock
                clockStatus={clockStatus}
                ripples={ripples}
                getButtonText={getButtonText}
                onClockIn={handleClockIn}
              />
            </div>
          </div>

          <div className="mt-auto flex w-full max-w-sm shrink-0 flex-wrap justify-center gap-5 px-1 pb-2 pt-4 md:mt-0 md:max-w-none md:gap-8 md:pt-0">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={showComingSoon}
                  className="group flex flex-col items-center gap-1.5 md:gap-2"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-accent md:size-14">
                    <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground md:size-6" />
                  </div>
                  <span className="text-[11px] text-muted-foreground md:text-xs">{action.label}</span>
                </motion.button>
              );
            })}
          </div>

          {clockStatus !== "none" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 shrink-0 text-center md:mt-10"
            >
              <div className="inline-block rounded-full bg-muted px-5 py-2.5 md:px-6 md:py-3">
                <span className="text-xs text-muted-foreground md:text-sm">
                  {clockStatus === "checkedIn" ? "✅ 上班已打卡" : "✅ 今日打卡完成"}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-notice-title"
            onClick={() => setNotice(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="home-notice-title" className="text-base font-semibold text-foreground">
                后续更新
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{notice}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="mt-6 w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
