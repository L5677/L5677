import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Minus, Plus } from "lucide-react";

type AttendanceStatus = "normal" | "late" | "early" | "absent" | "overtime";

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  needsFix?: boolean;
  deductMinutes?: number;
  attendanceNote?: string;
}

interface AttendanceRowProps {
  record: AttendanceRecord;
  index: number;
  onUpdate: (updates: Partial<AttendanceRecord>) => void;
  readOnly?: boolean;
}

const DEDUCT_STEP = 5;
const DEDUCT_MAX = 12 * 60;

export function AttendanceRow({ record, index, onUpdate, readOnly }: AttendanceRowProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeductPopup, setShowDeductPopup] = useState(false);
  const [draftDeduct, setDraftDeduct] = useState(60);
  const [draftNote, setDraftNote] = useState("");

  const statusConfig = {
    normal: { label: "正常", color: "text-green-600 bg-green-500/10" },
    late: { label: "迟到", color: "text-orange-600 bg-orange-500/10" },
    early: { label: "早退", color: "text-orange-600 bg-orange-500/10" },
    absent: { label: "缺勤", color: "text-red-600 bg-red-500/10" },
    overtime: { label: "加班", color: "text-blue-600 bg-blue-500/10" },
  };

  const safeStatus = (statusConfig[record.status] ? record.status : "normal") as AttendanceStatus;

  const openDeductPopup = () => {
    if (readOnly) return;
    setDraftDeduct(
      typeof record.deductMinutes === "number" ? record.deductMinutes : 60,
    );
    setDraftNote(record.attendanceNote ?? "");
    setShowDeductPopup(true);
  };

  const saveDeduct = () => {
    const clamped = Math.min(DEDUCT_MAX, Math.max(0, draftDeduct));
    onUpdate({
      deductMinutes: clamped,
      attendanceNote: draftNote.trim(),
    });
    setShowDeductPopup(false);
    triggerSuccess();
  };

  const handleTimeClick = (field: "checkInTime" | "checkOutTime") => {
    if (readOnly) return;
    setEditingField(field);
    setTempValue(record[field] || "09:00");
  };

  const handleTimeBlur = () => {
    if (editingField && tempValue) {
      const updates: Partial<AttendanceRecord> = {
        [editingField]: tempValue,
        needsFix: false,
      };

      if (record.status === "absent" && tempValue) {
        updates.status = "normal";
      }

      onUpdate(updates);
      triggerSuccess();
    }
    setEditingField(null);
  };

  const handleStatusClick = () => {
    if (readOnly) return;
    const statuses: AttendanceStatus[] = ["normal", "late", "early", "absent", "overtime"];
    const currentIndex = statuses.indexOf(record.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdate({ status: nextStatus });
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 500);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} 周${weekday}`;
  };

  const deductDisplay =
    typeof record.deductMinutes === "number" ? `${record.deductMinutes} 分` : "未设置";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: showSuccess
            ? "rgba(34, 197, 94, 0.1)"
            : record.needsFix
              ? "rgba(239, 68, 68, 0.05)"
              : "rgba(0, 0, 0, 0)",
        }}
        transition={{ delay: index * 0.05 }}
        className={`grid grid-cols-1 gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_1.6fr_1fr] sm:gap-4 ${
          record.needsFix ? "border-l-4 border-l-red-500" : ""
        } ${readOnly ? "opacity-90" : ""}`}
      >
        <div className="text-sm">{formatDate(record.date)}</div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleStatusClick}
            disabled={readOnly}
            className={`rounded-full px-3 py-1 text-xs transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${
              statusConfig[safeStatus].color
            }`}
          >
            {statusConfig[safeStatus].label}
          </button>
          <button
            type="button"
            onClick={openDeductPopup}
            disabled={readOnly}
            className="rounded-full border border-border bg-muted/80 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 md:text-xs"
          >
            扣除 · {deductDisplay}
          </button>
          {record.needsFix && <AlertCircle className="size-4 shrink-0 text-red-500" />}
        </div>

        <div className="space-y-1 text-right text-sm">
          {editingField === "checkInTime" ? (
            <input
              type="time"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={handleTimeBlur}
              autoFocus
              className="w-full rounded border border-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 text-right text-[#3B82F6] outline-none"
            />
          ) : (
            <div
              role="button"
              tabIndex={readOnly ? -1 : 0}
              onClick={() => handleTimeClick("checkInTime")}
              onKeyDown={(e) => e.key === "Enter" && handleTimeClick("checkInTime")}
              className={
                readOnly
                  ? "text-muted-foreground"
                  : "cursor-pointer transition-colors hover:text-[#3B82F6]"
              }
            >
              上: {record.checkInTime || "--:--"}
            </div>
          )}

          {editingField === "checkOutTime" ? (
            <input
              type="time"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={handleTimeBlur}
              autoFocus
              className="w-full rounded border border-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 text-right text-[#3B82F6] outline-none"
            />
          ) : (
            <div
              role="button"
              tabIndex={readOnly ? -1 : 0}
              onClick={() => handleTimeClick("checkOutTime")}
              onKeyDown={(e) => e.key === "Enter" && handleTimeClick("checkOutTime")}
              className={
                readOnly
                  ? "text-muted-foreground"
                  : "cursor-pointer transition-colors hover:text-[#3B82F6]"
              }
            >
              下: {record.checkOutTime || "--:--"}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeductPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/45"
              onClick={() => setShowDeductPopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="fixed left-1/2 top-1/2 z-[90] w-[min(92vw,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 text-sm font-semibold">扣除时间</div>
              <div className="mb-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setDraftDeduct((d) => Math.max(0, d - DEDUCT_STEP))}
                  className="flex size-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
                >
                  <Minus className="size-5" />
                </button>
                <div className="min-w-[5rem] text-center text-xl font-semibold tabular-nums">
                  {draftDeduct}
                  <span className="text-sm font-normal text-muted-foreground"> 分钟</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraftDeduct((d) => Math.min(DEDUCT_MAX, d + DEDUCT_STEP))
                  }
                  className="flex size-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
                >
                  <Plus className="size-5" />
                </button>
              </div>
              <label className="mb-1.5 block text-xs text-muted-foreground">备注（将写入 Excel）</label>
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="选填，导出 Excel 时会带出"
                rows={3}
                className="mb-4 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeductPopup(false)}
                  className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-medium transition-colors hover:bg-muted/80"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveDeduct}
                  className="flex-1 rounded-xl bg-[#3B82F6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
