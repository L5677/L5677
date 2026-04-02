import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  LogOut, 
  Bell, 
  Calendar, 
  ChevronRight, 
  Moon, 
  Sun,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  Edit2,
  Save,
  X,
  Settings,
  Award,
  Trophy
} from "lucide-react";
import { 
  getWorkSchedule, 
  saveWorkSchedule, 
  getConsecutiveDays, 
  scheduleReminders, 
  requestNotificationPermission,
  WorkSchedule 
} from "../utils/notificationService";
import { WorkSettingsDrawer } from "../components/WorkSettingsDrawer";
import {
  apiClaimAttendanceEditPermission,
  apiHandleNotification,
  apiListNotifications,
  apiLogin,
  apiMarkNotificationRead,
  apiMe,
  apiAdminGrantMonthEdit,
  getAccessToken,
  setAccessToken,
  type AppNotification,
} from "../utils/apiClient";

interface Notification {
  id: number;
  type: "warning" | "info";
  date: string;
  message: string;
  isRead: boolean;
  requiresFix: boolean;
  /** 形如 "2026-4"，领取后开放对应月份考勤编辑 */
  grantMonthKey?: string;
}

interface MonthSummary {
  month: string;
  totalDays: number;
  lateDays: number;
  overtimeHours: number;
  absentDays: number;
}

export function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState({ name: "王小明", id: "EMP001" });
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [showWorkSettings, setShowWorkSettings] = useState(false);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthSummary[]>([]);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTarget, setGrantTarget] = useState<Notification | null>(null);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [handleReason, setHandleReason] = useState("");

  useEffect(() => {
    // 检查登录状态（后端 token）
    const token = getAccessToken();
    if (token) {
      apiMe()
        .then((u) => {
          setIsLoggedIn(true);
          setCurrentUser({ name: u.name, id: String(u.id) });
          setCurrentUserRole(u.role);
          loadNotifications();
          loadMonthlySummaries();
          loadConsecutiveDays();
        })
        .catch(() => {
          setIsLoggedIn(false);
          setAccessToken(null);
        });
    } else {
      setIsLoggedIn(false);
    }

    // 检查深色模式
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiListNotifications();
      // 后端返回的字段名与页面接口一致（isRead/requiresFix 等）
      setNotifications(data as unknown as Notification[]);
    } catch {
      setNotifications([]);
    }
  };

  const loadMonthlySummaries = () => {
    // 从localStorage加载考勤数据生成月度汇总
    const summaries: MonthSummary[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 3; i++) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      
      // 计算该月的统计数据
      const stats = calculateMonthStats(month);
      summaries.push({
        month: monthStr,
        ...stats,
      });
    }
    
    setMonthlySummaries(summaries);
  };

  const calculateMonthStats = (month: Date) => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    
    let totalDays = 0;
    let lateDays = 0;
    let overtimeHours = 0;
    let absentDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      if (date.getDay() !== 0 && date.getDay() !== 6 && date <= new Date()) {
        const dateString = date.toDateString();
        const saved = localStorage.getItem(`clock-${dateString}`);
        
        if (saved) {
          const data = JSON.parse(saved);
          totalDays++;
          if (data.status === "late") lateDays++;
          if (data.status === "overtime") overtimeHours += 2;
        } else {
          absentDays++;
        }
      }
    }
    
    return { totalDays, lateDays, overtimeHours, absentDays };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      await apiLogin(username.trim(), password);
      const u = await apiMe();
      setIsLoggedIn(true);
      setCurrentUser({ name: u.name, id: String(u.id) });
      setCurrentUserRole(u.role);
      await loadNotifications();
      loadMonthlySummaries();
      loadConsecutiveDays();
    } catch (err: any) {
      console.error("login failed:", err);
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAccessToken(null);
    setUsername("");
    setPassword("");
    setNotifications([]);
    setCurrentUser({ name: "王小明", id: "" });
    setCurrentUserRole("");
    setShowNotifications(false);
    setShowMonthlySummary(false);
    setShowWorkSettings(false);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (e) {
      console.error("mark read failed:", e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadConsecutiveDays = () => {
    const days = getConsecutiveDays();
    setConsecutiveDays(days);
  };

  const handleOpenHandleModal = (notification: Notification) => {
    setCurrentNotification(notification);
    setHandleReason("");
    setShowHandleModal(true);
  };

  const handleSubmitReason = async () => {
    if (!currentNotification || !handleReason.trim()) return;
    try {
      await apiHandleNotification(currentNotification.id, handleReason);
      setShowHandleModal(false);
      setHandleReason("");
      setCurrentNotification(null);
      await loadNotifications();
    } catch (e) {
      console.error("handle notification failed:", e);
    }
  };

  const handleAcknowledgeNotification = async () => {
    if (!currentNotification) return;
    await markNotificationAsRead(currentNotification.id);
    setShowHandleModal(false);
    setCurrentNotification(null);
  };

  const openGrantModal = (n: Notification) => {
    setGrantTarget(n);
    setShowGrantModal(true);
  };

  const handleClaimAttendanceGrant = () => {
    if (!grantTarget?.grantMonthKey) return;
    (async () => {
      try {
        await apiClaimAttendanceEditPermission(grantTarget.id);
        setShowGrantModal(false);
        setGrantTarget(null);
        await loadNotifications();
      } catch (e) {
        console.error("claim grant failed:", e);
      }
    })();
  };

  const simulateAdminGrantCurrentMonth = () => {
    if (currentUserRole !== "admin") return;
    (async () => {
      try {
        const d = new Date();
        await apiAdminGrantMonthEdit(
          parseInt(String(currentUser.id), 10),
          d.getFullYear(),
          d.getMonth() + 1,
        );
        await loadNotifications();
      } catch (e) {
        console.error("admin grant failed:", e);
      }
    })();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#3B82F6] mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl mb-2">员工考勤系统</h1>
            <p className="text-muted-foreground">请登录您的账号</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors"
            >
              登录
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            演示账号：任意用户名和密码
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <AnimatePresence>
        {/* 通知抽屉 */}
        {showNotifications && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-lg">通知消息</h2>
                <div className="w-10" />
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Bell className="w-12 h-12 mb-4 opacity-50" />
                    <p>暂无通知</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3 max-w-[390px] mx-auto">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          // 带 grantMonthKey 的通知：不要点卡片就标记已读，否则会影响领取权限
                          if (!notification.grantMonthKey) {
                            markNotificationAsRead(notification.id);
                          }
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                          notification.isRead
                            ? "bg-card border-border"
                            : "bg-[#3B82F6]/5 border-[#3B82F6]/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.type === "warning" ? (
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-muted-foreground">
                                {new Date(notification.date).toLocaleDateString("zh-CN")}
                              </span>
                              {!notification.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                              )}
                            </div>
                            <p className="text-sm break-words">{notification.message}</p>
                            {notification.requiresFix && (
                              <button 
                                className="mt-2 text-sm text-[#3B82F6] hover:underline" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenHandleModal(notification);
                                }}
                              >
                                立即处理 →
                              </button>
                            )}
                            {notification.grantMonthKey && (
                              <button
                                type="button"
                                className="mt-2 text-sm font-medium text-[#3B82F6] hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGrantModal(notification);
                                }}
                              >
                                领取考勤修改权限 →
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mx-auto w-full max-w-[390px] shrink-0 border-t border-border p-4">
                <button
                  type="button"
                  onClick={simulateAdminGrantCurrentMonth}
                  className="w-full rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  演示：模拟管理员发放「本月」考勤修改权限通知
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 月度汇总抽屉 */}
        {showMonthlySummary && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <button
                  onClick={() => {
                    setShowMonthlySummary(false);
                    setEditingMonth(null);
                  }}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-lg">月度汇总</h2>
                <div className="w-10" />
              </div>

              {/* Monthly Summaries */}
              <div className="flex-1 overflow-y-auto py-6 px-4 pb-24">
                <div className="space-y-4 max-w-[390px] mx-auto">
                  {monthlySummaries.map((summary, index) => {
                    const isEditing = editingMonth === summary.month;
                    
                    return (
                      <motion.div
                        key={summary.month}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                          <h3 className="font-medium">
                            {summary.month.split("-")[0]}年{summary.month.split("-")[1]}月
                          </h3>
                          <button
                            onClick={() => setEditingMonth(isEditing ? null : summary.month)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                          >
                            {isEditing ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Edit2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          {/* 横向统计卡片 */}
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            <div className="flex-1 min-w-[70px] p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold mb-1">{summary.totalDays}</div>
                              <div className="text-[10px] text-muted-foreground text-center whitespace-nowrap">出勤天数</div>
                            </div>
                            <div className="flex-1 min-w-[70px] p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold mb-1 text-orange-500">{summary.lateDays}</div>
                              <div className="text-[10px] text-muted-foreground text-center whitespace-nowrap">迟到次数</div>
                            </div>
                            <div className="flex-1 min-w-[70px] p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold mb-1 text-[#3B82F6]">{summary.overtimeHours}h</div>
                              <div className="text-[10px] text-muted-foreground text-center whitespace-nowrap">加班时长</div>
                            </div>
                            <div className="flex-1 min-w-[70px] p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold mb-1 text-red-500">{summary.absentDays}</div>
                              <div className="text-[10px] text-muted-foreground text-center whitespace-nowrap">缺勤天数</div>
                            </div>
                          </div>

                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-3 border-t border-border"
                            >
                              <p className="text-sm text-muted-foreground mb-3">
                                点击"考勤"页面可以编辑具体日期的考勤记录
                              </p>
                              <button className="w-full py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2">
                                <Calendar className="w-4 h-4" />
                                查看详细记录
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 工作设置抽屉 */}
        {showWorkSettings && (
          <WorkSettingsDrawer
            open={showWorkSettings}
            onClose={() => setShowWorkSettings(false)}
            consecutiveDays={consecutiveDays}
          />
        )}
      </AnimatePresence>

      {/* 主页面内容 */}
      <div className="py-6 px-4">
        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                {currentUser.name.charAt(0)}
              </div>
              {/* 徽章显示 */}
              {consecutiveDays >= 7 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white"
                >
                  {consecutiveDays >= 30 ? (
                    <Trophy className="w-4 h-4 text-white" />
                  ) : (
                    <Award className="w-4 h-4 text-white" />
                  )}
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-xl mb-1">{currentUser.name}</h2>
              <p className="text-white/80 text-sm">工号: {currentUser.id}</p>
              {consecutiveDays >= 7 && (
                <div className="flex items-center gap-1 mt-1">
                  <Award className="w-3 h-3" />
                  <span className="text-xs">连续出勤 {consecutiveDays} 天</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Clock className="w-4 h-4" />
            <span>今日已打卡</span>
          </div>

          {/* 装饰性元素 */}
          {consecutiveDays >= 30 && (
            <div className="absolute top-4 right-4 opacity-20">
              <Trophy className="w-20 h-20" />
            </div>
          )}
        </motion.div>

        {/* 功能菜单 */}
        <div className="space-y-3">
          {/* 通知 */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowNotifications(true)}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">通知消息</div>
                <div className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount}条未读` : "暂无未读"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.button>

          {/* 月度汇总 */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowMonthlySummary(true)}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="text-left">
                <div className="font-medium">月度汇总</div>
                <div className="text-sm text-muted-foreground">查看和编辑考勤统计</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* 工作设置 */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowWorkSettings(true)}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="text-left">
                <div className="font-medium">工作设置</div>
                <div className="text-sm text-muted-foreground">查看和编辑工作设置</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* 深色模式 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-purple-500" />
                ) : (
                  <Sun className="w-5 h-5 text-purple-500" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium">深色模式</div>
                <div className="text-sm text-muted-foreground">
                  {darkMode ? "已开启" : "已关闭"}
                </div>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                darkMode ? "bg-[#3B82F6]" : "bg-gray-300"
              }`}
            >
              <motion.div
                animate={{ x: darkMode ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
              />
            </button>
          </motion.div>

          {/* 退出登录 */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleLogout}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-red-500/10 hover:border-red-500/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <div className="font-medium group-hover:text-red-500 transition-colors">退出登录</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* 领取考勤修改权限 */}
      <AnimatePresence>
        {showGrantModal && grantTarget?.grantMonthKey && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              className="fixed inset-0 z-[60]"
              onClick={() => {
                setShowGrantModal(false);
                setGrantTarget(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[70] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <h3 className="text-lg font-semibold">领取考勤修改权限</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {grantTarget.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  对应月份：
                  {(() => {
                    const [gy, gm] = grantTarget.grantMonthKey.split("-");
                    return `${gy}年${gm}月`;
                  })()}
                </p>
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGrantModal(false);
                      setGrantTarget(null);
                    }}
                    className="flex-1 rounded-xl bg-muted py-3 text-sm font-medium transition-colors hover:bg-muted/80"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleClaimAttendanceGrant}
                    className="flex-1 rounded-xl bg-[#3B82F6] py-3 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                  >
                    确认领取
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 处理通知弹窗 */}
      <AnimatePresence>
        {showHandleModal && currentNotification && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              className="fixed inset-0 z-[60]"
              onClick={() => setShowHandleModal(false)}
            />
            
            {/* 弹窗内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] max-w-md"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">处理通知</h3>
                  <button
                    onClick={() => setShowHandleModal(false)}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* 通知信息 */}
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">通知日期</div>
                    <div className="text-sm font-medium">
                      {new Date(currentNotification.date).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">通知内容</div>
                    <div className="text-sm">{currentNotification.message}</div>
                  </div>
                </div>
                
                {/* 输入说明原因 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">说明原因</label>
                  <textarea
                    value={handleReason}
                    onChange={(e) => setHandleReason(e.target.value)}
                    placeholder="请输入说明原因，发送给管理端..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
                    rows={4}
                  />
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAcknowledgeNotification}
                    className="flex-1 py-2.5 px-4 bg-muted hover:bg-muted/70 rounded-lg transition-colors text-sm font-medium"
                  >
                    收到
                  </button>
                  <button
                    onClick={handleSubmitReason}
                    disabled={!handleReason.trim()}
                    className="flex-1 py-2.5 px-4 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    提交原因
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}