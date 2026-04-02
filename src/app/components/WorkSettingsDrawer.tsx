import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Clock, Bell, Save, ChevronDown, ChevronUp, Send, CheckCircle } from "lucide-react";
import { 
  WorkSchedule, 
  getWorkSchedule, 
  saveWorkSchedule, 
  requestNotificationPermission, 
  scheduleReminders 
} from "../utils/notificationService";

interface WorkSettingsDrawerProps {
  open?: boolean;
  onClose: () => void;
  consecutiveDays: number;
}

export function WorkSettingsDrawer({ open, onClose, consecutiveDays }: WorkSettingsDrawerProps) {
  const [schedule, setSchedule] = useState<WorkSchedule>(getWorkSchedule());
  const [hasChanges, setHasChanges] = useState(false);
  const [showTimeRange, setShowTimeRange] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitReason, setSubmitReason] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");

  useEffect(() => {
    if (open !== false) {
      setSchedule(getWorkSchedule());
      setHasChanges(false);
      // 加载审批状态
      const status = localStorage.getItem("workSettingsApprovalStatus") || "none";
      setApprovalStatus(status as any);
    }
  }, [open]);

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!submitReason.trim()) {
      alert("请填写申请原因");
      return;
    }

    // 如果启用了提醒，请求通知权限
    if (schedule.reminderEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert("请允许通知权限以启用打卡提醒");
        return;
      }
    }

    // 保存工作时间配置
    saveWorkSchedule(schedule);
    if (schedule.reminderEnabled) {
      scheduleReminders(schedule);
    }

    // 保存审批申请
    const approval = {
      schedule,
      reason: submitReason,
      submittedAt: new Date().toISOString(),
      submittedBy: JSON.parse(localStorage.getItem("currentUser") || '{"name":"王小明","id":"EMP001"}').name,
      status: "pending"
    };
    localStorage.setItem("workSettingsApproval", JSON.stringify(approval));
    localStorage.setItem("workSettingsApprovalStatus", "pending");
    
    setApprovalStatus("pending");
    setHasChanges(false);
    setShowSubmitModal(false);
    setSubmitReason("");
    
    // 显示成功消息
    alert("工作时间调整申请已提交，等待管理员审批");
  };

  const handleChange = (field: keyof WorkSchedule, value: any) => {
    setSchedule({ ...schedule, [field]: value });
    setHasChanges(true);
  };

  if (!open) return null;

  return (
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
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg">工作时间配置</h2>
          <button
            onClick={handleSubmit}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              hasChanges
                ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            上交审批
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 px-4 pb-24">
          <div className="space-y-6 max-w-[390px] mx-auto">
            {/* 审批状态卡片 */}
            {approvalStatus !== "none" && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border-2 ${
                  approvalStatus === "pending"
                    ? "bg-orange-500/10 border-orange-500/30"
                    : approvalStatus === "approved"
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    approvalStatus === "pending"
                      ? "bg-orange-500/20"
                      : approvalStatus === "approved"
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }`}>
                    {approvalStatus === "pending" ? (
                      <Clock className="w-5 h-5 text-orange-500" />
                    ) : approvalStatus === "approved" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">
                      {approvalStatus === "pending"
                        ? "审批中"
                        : approvalStatus === "approved"
                        ? "已通过"
                        : "已驳回"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {approvalStatus === "pending"
                        ? "您的工作时间调整申请正在审批中"
                        : approvalStatus === "approved"
                        ? "您的工作时间调整申请已通过"
                        : "您的工作时间调整申请已被驳回"}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 上班时间 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <div className="font-medium">上班时间</div>
                  <div className="text-sm text-muted-foreground">设置每日上班打卡时间</div>
                </div>
              </div>
              <input
                type="time"
                value={schedule.checkInTime}
                onChange={(e) => handleChange("checkInTime", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* 下班时间 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="font-medium">下班时间</div>
                  <div className="text-sm text-muted-foreground">设置每日下班打卡时间</div>
                </div>
              </div>
              <input
                type="time"
                value={schedule.checkOutTime}
                onChange={(e) => handleChange("checkOutTime", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* 弹性时间 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="font-medium mb-2">弹性打卡</div>
              <div className="text-sm text-muted-foreground mb-4">
                允许的打卡时间偏差（分钟）
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={schedule.flexMinutes}
                  onChange={(e) => handleChange("flexMinutes", parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="w-16 text-right text-lg font-semibold text-[#3B82F6]">
                  {schedule.flexMinutes}分
                </div>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                在设定时间的前后 {schedule.flexMinutes} 分钟内打卡均视为正常
              </div>
            </div>

            {/* 打卡时间范围 */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowTimeRange(!showTimeRange)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">打卡时间范围</div>
                    <div className="text-sm text-muted-foreground">设置允许打卡的有效时间窗口</div>
                  </div>
                </div>
                {showTimeRange ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {showTimeRange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-4">
                      {/* 上班打卡时间范围 */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[#3B82F6]">上班打卡时间范围</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              最早打卡时间
                            </label>
                            <input
                              type="time"
                              value={schedule.checkInStartTime}
                              onChange={(e) => handleChange("checkInStartTime", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              最晚打卡时间
                            </label>
                            <input
                              type="time"
                              value={schedule.checkInEndTime}
                              onChange={(e) => handleChange("checkInEndTime", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                          ⏰ 允许打卡时间：{schedule.checkInStartTime} - {schedule.checkInEndTime}
                        </div>
                      </div>

                      {/* 分隔线 */}
                      <div className="border-t border-border" />

                      {/* 下班打卡时间范围 */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-green-500">下班打卡时间范围</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              最早打卡时间
                            </label>
                            <input
                              type="time"
                              value={schedule.checkOutStartTime}
                              onChange={(e) => handleChange("checkOutStartTime", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              最晚打卡时间
                            </label>
                            <input
                              type="time"
                              value={schedule.checkOutEndTime}
                              onChange={(e) => handleChange("checkOutEndTime", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                          ⏰ 允许打卡时间：{schedule.checkOutStartTime} - {schedule.checkOutEndTime}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 打卡提醒 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-medium">打卡提醒</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.reminderEnabled ? "已开启" : "已关闭"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleChange("reminderEnabled", !schedule.reminderEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    schedule.reminderEnabled ? "bg-[#3B82F6]" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    animate={{ x: schedule.reminderEnabled ? 24 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>

              {schedule.reminderEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="text-sm text-muted-foreground mb-2">
                    提前提醒时间（分钟）
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={schedule.reminderMinutes}
                      onChange={(e) => handleChange("reminderMinutes", parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="w-16 text-right text-lg font-semibold text-[#3B82F6]">
                      {schedule.reminderMinutes}分
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#3B82F6]" />
                      <span className="font-medium">提醒时间</span>
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>
                        上班提醒：{calculateReminderTime(schedule.checkInTime, schedule.reminderMinutes)}
                      </div>
                      <div>
                        下班提醒：{calculateReminderTime(schedule.checkOutTime, schedule.reminderMinutes)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 说明 */}
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
              <div className="font-medium mb-2">💡 温馨提示</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>工作日为周一至周五，周末自动跳过</li>
                <li>打卡提醒需要允许浏览器通知权限</li>
                <li>提醒会在指定时间自动推送到系统通知栏</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 提交审批弹窗 */}
        <AnimatePresence>
          {showSubmitModal && (
            <>
              {/* 背景遮罩 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                className="fixed inset-0 z-[60]"
                onClick={() => setShowSubmitModal(false)}
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
                    <h3 className="text-lg font-semibold">上交审批</h3>
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* 工作时间预览 */}
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">上班时间</div>
                      <div className="text-sm font-medium">{schedule.checkInTime}</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">下班时间</div>
                      <div className="text-sm font-medium">{schedule.checkOutTime}</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">弹性时间</div>
                      <div className="text-sm font-medium">±{schedule.flexMinutes}分钟</div>
                    </div>
                  </div>
                  
                  {/* 输入申请原因 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">申请原因</label>
                    <textarea
                      value={submitReason}
                      onChange={(e) => setSubmitReason(e.target.value)}
                      placeholder="请说明工作时间调整的原因..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
                      rows={4}
                    />
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1 py-2.5 px-4 bg-muted hover:bg-muted/70 rounded-lg transition-colors text-sm font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      disabled={!submitReason.trim()}
                      className="flex-1 py-2.5 px-4 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      提交审批
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// 计算提醒时间
function calculateReminderTime(time: string, minutesBefore: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes - minutesBefore;
  const reminderHours = Math.floor(totalMinutes / 60);
  const reminderMinutes = totalMinutes % 60;
  return `${String(reminderHours).padStart(2, "0")}:${String(reminderMinutes).padStart(2, "0")}`;
}