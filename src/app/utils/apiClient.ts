export type ApiError = { message: string; status?: number };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api";

const TOKEN_KEY = "accessToken";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) message = String(data.detail);
      else if (data?.message) message = String(data.message);
    } catch {
      // ignore
    }
    const err: ApiError = { message, status: res.status };
    throw err;
  }

  return res.json();
}

// Auth
export async function apiLogin(username: string, password: string) {
  const data = await requestJSON<{ access_token: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
  );
  setAccessToken(data.access_token);
  return data;
}

export async function apiMe() {
  return requestJSON<{
    id: number;
    username: string;
    name: string;
    role: string;
  }>("/me");
}

// Notifications
export type AppNotification = {
  id: number;
  type: "warning" | "info";
  date: string; // YYYY-MM-DD
  message: string;
  isRead: boolean;
  requiresFix: boolean;
  grantMonthKey?: string | null;
};

export async function apiListNotifications() {
  return requestJSON<AppNotification[]>("/notifications");
}

export async function apiMarkNotificationRead(notificationId: number) {
  await requestJSON(`/notifications/${notificationId}/read`, {
    method: "PUT",
  });
}

export async function apiHandleNotification(
  notificationId: number,
  reason?: string,
) {
  await requestJSON(`/notifications/${notificationId}/handle`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || "" }),
  });
}

export async function apiClaimAttendanceEditPermission(
  notificationId: number,
) {
  await requestJSON(`/permissions/claim`, {
    method: "POST",
    body: JSON.stringify({ notification_id: notificationId }),
  });
}

// Admin (dev)
export async function apiAdminGrantMonthEdit(
  userId: number,
  year: number,
  month1to12: number,
) {
  return requestJSON(`/admin/grant-month-edit`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, year, month: month1to12 }),
  });
}

// Attendance
export async function apiGetTodayAttendance() {
  return requestJSON<{
    clockStatus: "none" | "checkedIn" | "completed";
    checkInTime?: string | null;
    checkOutTime?: string | null;
  }>("/attendance/today");
}

export async function apiToggleTodayAttendance() {
  return requestJSON<{
    clockStatus: "none" | "checkedIn" | "completed";
    checkInTime?: string | null;
    checkOutTime?: string | null;
  }>("/attendance/today/toggle", { method: "POST" });
}

export async function apiGetMonthSummary(year: number, month1to12: number) {
  return requestJSON<{ monthWorkHours: number; monthLeaveDays: number }>(
    `/attendance/month/summary?year=${year}&month=${month1to12}`,
  );
}

export type AttendanceMonthRecord = {
  date: string; // YYYY-MM-DD
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  needsFix: boolean;
  deductMinutes?: number | null;
  attendanceNote?: string | null;
};

export async function apiGetMonthAttendance(
  year: number,
  month1to12: number,
) {
  return requestJSON<{
    records: AttendanceMonthRecord[];
    lockInfo: { submitted: boolean; canEdit: boolean };
  }>(`/attendance/month?year=${year}&month=${month1to12}`);
}

export async function apiUpdateAttendanceByDate(
  dateStr: string,
  updates: Partial<{
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    deductMinutes: number | null;
    attendanceNote: string | null;
  }>,
) {
  // 后端不接收 needsFix 字段；这里做字段白名单过滤
  const payload: Record<string, any> = {};
  if (typeof updates.status === "string") payload.status = updates.status;
  if (updates.checkInTime !== undefined) payload.checkInTime = updates.checkInTime;
  if (updates.checkOutTime !== undefined) payload.checkOutTime = updates.checkOutTime;
  if (updates.deductMinutes !== undefined) payload.deductMinutes = updates.deductMinutes;
  if (updates.attendanceNote !== undefined)
    payload.attendanceNote = updates.attendanceNote;

  await requestJSON(`/attendance/${dateStr}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function apiSubmitMonthAttendance(year: number, month1to12: number) {
  await requestJSON("/attendance/month/submit", {
    method: "POST",
    body: JSON.stringify({ year, month: month1to12 }),
  });
}

