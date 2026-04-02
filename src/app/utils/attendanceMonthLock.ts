/** 本月考勤提交锁定：提交后不可改，直至管理端在消息通知中发放修改权限 */

function keyPart(y: number, monthIndex0: number) {
  return `${y}-${monthIndex0 + 1}`;
}

export function isMonthSubmitted(year: number, monthIndex0: number): boolean {
  return localStorage.getItem(`attendanceSubmitted_${keyPart(year, monthIndex0)}`) === "1";
}

export function submitMonthAttendance(year: number, monthIndex0: number): void {
  localStorage.setItem(`attendanceSubmitted_${keyPart(year, monthIndex0)}`, "1");
}

export function hasMonthEditGrant(year: number, monthIndex0: number): boolean {
  return localStorage.getItem(`attendanceEditGrant_${keyPart(year, monthIndex0)}`) === "1";
}

/** 用户从消息通知中「领取」管理端发放的修改权限后调用 */
export function grantMonthEditPermission(year: number, monthIndex0: number): void {
  localStorage.setItem(`attendanceEditGrant_${keyPart(year, monthIndex0)}`, "1");
}

/** 未提交可随意编辑；已提交仅在有管理端授权时可编辑 */
export function canEditMonthAttendance(year: number, monthIndex0: number): boolean {
  if (!isMonthSubmitted(year, monthIndex0)) return true;
  return hasMonthEditGrant(year, monthIndex0);
}

/** grantMonthKey 形如 "2026-4"（月份为 1–12） */
export function grantMonthEditPermissionByKey(grantMonthKey: string): void {
  const [ys, ms] = grantMonthKey.split("-");
  const year = parseInt(ys, 10);
  const month1 = parseInt(ms, 10);
  if (!year || !month1 || month1 < 1 || month1 > 12) return;
  grantMonthEditPermission(year, month1 - 1);
}
