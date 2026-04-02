export interface AppNotification {
  id: string;
  type: "warning" | "info";
  date: string;
  message: string;
  isRead: boolean;
  requiresFix: boolean;
  /** 若存在，用户可在通知详情中领取对应月份的考勤修改权限，格式 "2026-4" */
  grantMonthKey?: string;
}

const STORAGE_KEY = "notifications";

export function readAppNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAppNotifications(list: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function appendAppNotification(entry: Omit<AppNotification, "id" | "isRead"> & { id?: string }) {
  const list = readAppNotifications();
  const n: AppNotification = {
    id: entry.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: entry.type,
    date: entry.date,
    message: entry.message,
    isRead: false,
    requiresFix: entry.requiresFix ?? false,
    grantMonthKey: entry.grantMonthKey,
  };
  list.unshift(n);
  saveAppNotifications(list);
}
