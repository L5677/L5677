// 通知服务 - 处理打卡提醒和异常预警

export interface WorkSchedule {
  checkInTime: string; // 格式: "09:00"
  checkOutTime: string; // 格式: "18:00"
  flexMinutes: number; // 弹性时间（分钟）
  reminderEnabled: boolean;
  reminderMinutes: number; // 提前提醒时间（分钟）
  checkInStartTime: string; // 上班打卡开始时间 格式: "07:00"
  checkInEndTime: string; // 上班打卡结束时间 格式: "10:00"
  checkOutStartTime: string; // 下班打卡开始时间 格式: "17:00"
  checkOutEndTime: string; // 下班打卡结束时间 格式: "21:00"
}

export const DEFAULT_SCHEDULE: WorkSchedule = {
  checkInTime: "09:00",
  checkOutTime: "18:00",
  flexMinutes: 15,
  reminderEnabled: true,
  reminderMinutes: 5,
  checkInStartTime: "07:00",
  checkInEndTime: "10:00",
  checkOutStartTime: "17:00",
  checkOutEndTime: "21:00",
};

// 请求通知权限
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("此浏览器不支持通知");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// 发送通知
export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  }
};

// 计算下一次提醒时间
export const getNextReminderTime = (
  schedule: WorkSchedule,
  type: "checkIn" | "checkOut"
): Date | null => {
  const now = new Date();
  const [hours, minutes] = (type === "checkIn" ? schedule.checkInTime : schedule.checkOutTime).split(":");
  
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours), parseInt(minutes) - schedule.reminderMinutes, 0, 0);
  
  // 如果今天的提醒时间已过，设置为明天
  if (reminderTime < now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  // 跳过周末
  const day = reminderTime.getDay();
  if (day === 0) { // 周日
    reminderTime.setDate(reminderTime.getDate() + 1);
  } else if (day === 6) { // 周六
    reminderTime.setDate(reminderTime.getDate() + 2);
  }
  
  return reminderTime;
};

// 设置定时提醒
export const scheduleReminders = (schedule: WorkSchedule) => {
  if (!schedule.reminderEnabled) return;

  // 清除现有的定时器
  const existingTimers = JSON.parse(localStorage.getItem("reminderTimers") || "[]");
  existingTimers.forEach((id: number) => clearTimeout(id));
  
  const timers: number[] = [];
  
  // 设置上班提醒
  const checkInTime = getNextReminderTime(schedule, "checkIn");
  if (checkInTime) {
    const delay = checkInTime.getTime() - Date.now();
    if (delay > 0) {
      const timer = window.setTimeout(() => {
        sendNotification("上班打卡提醒", {
          body: `距离上班时间还有${schedule.reminderMinutes}分钟，请准备打卡`,
          tag: "check-in-reminder",
        });
        // 重新设置明天的提醒
        scheduleReminders(schedule);
      }, delay);
      timers.push(timer);
    }
  }
  
  // 设置下班提醒
  const checkOutTime = getNextReminderTime(schedule, "checkOut");
  if (checkOutTime) {
    const delay = checkOutTime.getTime() - Date.now();
    if (delay > 0) {
      const timer = window.setTimeout(() => {
        sendNotification("下班打卡提醒", {
          body: `距离下班时间还有${schedule.reminderMinutes}分钟，请记得打卡`,
          tag: "check-out-reminder",
        });
        // 重新设置明天的提醒
        scheduleReminders(schedule);
      }, delay);
      timers.push(timer);
    }
  }
  
  localStorage.setItem("reminderTimers", JSON.stringify(timers));
};

// 检查连续出勤
export const getConsecutiveDays = (): number => {
  let count = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 跳过周末
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateString = date.toDateString();
    const saved = localStorage.getItem(`clock-${dateString}`);
    
    if (saved) {
      const data = JSON.parse(saved);
      if (data.status === "completed") {
        count++;
      } else {
        break;
      }
    } else if (date < today) {
      // 过去的工作日但没有打卡记录
      break;
    }
  }
  
  return count;
};

// 检查异常情况
export const checkAnomalies = (): { type: string; message: string }[] => {
  const anomalies: { type: string; message: string }[] = [];
  const today = new Date();
  
  // 检查最近7天的迟到情况
  let lateDays = 0;
  let absentDays = 0;
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateString = date.toDateString();
    const saved = localStorage.getItem(`clock-${dateString}`);
    
    if (saved) {
      const data = JSON.parse(saved);
      if (data.status === "late") lateDays++;
    } else {
      absentDays++;
    }
  }
  
  if (lateDays >= 3) {
    anomalies.push({
      type: "warning",
      message: `最近7天内有${lateDays}次迟到记录，请注意准时打卡`,
    });
  }
  
  if (absentDays >= 2) {
    anomalies.push({
      type: "error",
      message: `最近7天内有${absentDays}天缺勤记录，请及时补录`,
    });
  }
  
  return anomalies;
};

// 获取工作时间配置
export const getWorkSchedule = (): WorkSchedule => {
  const saved = localStorage.getItem("workSchedule");
  return saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
};

// 保存工作时间配置
export const saveWorkSchedule = (schedule: WorkSchedule) => {
  localStorage.setItem("workSchedule", JSON.stringify(schedule));
  scheduleReminders(schedule);
};