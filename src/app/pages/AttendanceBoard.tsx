import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  List,
  Calendar as CalendarIcon,
  FileText,
  Send,
} from "lucide-react";
import {
  AttendanceRow,
  type AttendanceRecord,
} from "../components/AttendanceRow";
import { CalendarView } from "../components/CalendarView";
import { exportToExcel, exportToPDF } from "../utils/exportService";
import {
  apiGetMonthAttendance,
  apiMe,
  apiSubmitMonthAttendance,
  apiUpdateAttendanceByDate,
  type AttendanceMonthRecord,
} from "../utils/apiClient";

type AttendanceStatus =
  | "normal"
  | "late"
  | "early"
  | "absent"
  | "overtime"
  | "completed";

type ViewMode = "list" | "calendar";

export function AttendanceBoard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterAbnormal, setFilterAbnormal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(
    currentMonth.getFullYear(),
  );
  const [tempMonth, setTempMonth] = useState(
    currentMonth.getMonth() + 1,
  );

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [me, setMe] = useState<{ name: string; id: string }>({
    name: "",
    id: "",
  });

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  useEffect(() => {
    apiMe()
      .then((u) =>
        setMe({
          name: u.name,
          id: String(u.id),
        }),
      )
      .catch(() => void 0);
  }, []);

  const loadMonthData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const month1to12 = month + 1;

    apiGetMonthAttendance(year, month1to12)
      .then((res) => {
        const allowedStatuses = [
          "normal",
          "late",
          "early",
          "absent",
          "overtime",
        ] as const;

        const normalized: AttendanceRecord[] = res.records.map((r) => {
          const statusRaw = r.status === "completed" ? "normal" : r.status;
          const status = (allowedStatuses.includes(
            statusRaw as any,
          )
            ? statusRaw
            : "normal") as AttendanceRecord["status"];

          return {
            date: r.date,
            status,
            checkInTime: r.checkInTime ?? undefined,
            checkOutTime: r.checkOutTime ?? undefined,
            needsFix: Boolean(r.needsFix),
            deductMinutes:
              typeof r.deductMinutes === "number"
                ? r.deductMinutes
                : undefined,
            attendanceNote:
              typeof r.attendanceNote === "string"
                ? r.attendanceNote
                : undefined,
          };
        });

        setRecords(normalized);
        setAlreadySubmitted(res.lockInfo.submitted);
        setCanEdit(res.lockInfo.canEdit);
      })
      .catch(() => {
        setRecords([]);
        setAlreadySubmitted(false);
        setCanEdit(false);
      });

    // 走完后端接口后，直接返回；下面保留了旧的 localStorage 逻辑作为未迁移分支
    return;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthRecords: AttendanceRecord[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toDateString();
      const saved = localStorage.getItem(`clock-${dateString}`);

      if (saved) {
        const data = JSON.parse(saved);

        // 规范化状态值：将旧的 "completed" 转换为 "normal"
        let status: AttendanceStatus = data.status || "normal";
        if (status === ("completed" as any)) {
          status = "normal";
        }
        // 确保状态值有效
        const validStatuses: AttendanceStatus[] = [
          "normal",
          "late",
          "early",
          "absent",
          "overtime",
        ];
        if (!validStatuses.includes(status)) {
          status = "normal";
        }

        monthRecords.push({
          date: dateString,
          status: status,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          needsFix: !data.checkOutTime,
          deductMinutes:
            typeof data.deductMinutes === "number"
              ? data.deductMinutes
              : undefined,
          attendanceNote:
            typeof data.attendanceNote === "string"
              ? data.attendanceNote
              : undefined,
        });
      } else if (
        date < new Date() &&
        date.getDay() !== 0 &&
        date.getDay() !== 6
      ) {
        // 过去的工作日但没有打卡记录
        monthRecords.push({
          date: dateString,
          status: "absent",
          needsFix: true,
        });
      }
    }

    // 倒序排列，最新日期在最上面
    setRecords(monthRecords.reverse());
  };

  const year = currentMonth.getFullYear();
  const monthIndex0 = currentMonth.getMonth();
  const lockedNoGrant = alreadySubmitted && !canEdit;

  const updateRecord = (
    date: string,
    updates: Partial<AttendanceRecord>,
  ) => {
    if (!canEdit) {
      return;
    }

    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.checkInTime !== undefined)
      payload.checkInTime = updates.checkInTime ?? null;
    if (updates.checkOutTime !== undefined)
      payload.checkOutTime = updates.checkOutTime ?? null;
    if (updates.deductMinutes !== undefined)
      payload.deductMinutes = updates.deductMinutes ?? null;
    if (updates.attendanceNote !== undefined)
      payload.attendanceNote = updates.attendanceNote ?? null;

    apiUpdateAttendanceByDate(date, payload)
      .then(() => loadMonthData())
      .catch(() => void 0);

    // 走后端保存后刷新数据；下面的 localStorage 逻辑作为保留分支不会执行
    return;

    const saved = localStorage.getItem(`clock-${date}`);
    const data = saved ? JSON.parse(saved) : {};
    const prevRec = records.find((r) => r.date === date);
    if (!saved && prevRec) {
      data.status = prevRec.status;
      if (prevRec.checkInTime) data.checkInTime = prevRec.checkInTime;
      if (prevRec.checkOutTime) data.checkOutTime = prevRec.checkOutTime;
    }

    if (updates.status !== undefined) {
      data.status = updates.status;
    }
    if (updates.checkInTime !== undefined) {
      data.checkInTime = updates.checkInTime;
    }
    if (updates.checkOutTime !== undefined) {
      data.checkOutTime = updates.checkOutTime;
    }
    if (updates.needsFix !== undefined) {
      data.needsFix = updates.needsFix;
    }
    if (updates.deductMinutes !== undefined) {
      data.deductMinutes = updates.deductMinutes;
    }
    if (updates.attendanceNote !== undefined) {
      data.attendanceNote = updates.attendanceNote;
    }

    localStorage.setItem(`clock-${date}`, JSON.stringify(data));

    setRecords((prev) =>
      prev.map((record) =>
        record.date === date ? { ...record, ...updates } : record,
      ),
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
      ),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
      ),
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      records,
      `考勤记录_${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`,
    );
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const userInfo = me?.name
      ? me
      : { name: "王小明", id: "EMP001" };
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    exportToPDF(records, userInfo, monthStr);
    setShowExportMenu(false);
  };

  const handleDateClick = (dateString: string) => {
    // 可以在这里添加点击日期后的操作，比如显示详情
    console.log("点击日期:", dateString);
  };

  const handleOpenDatePicker = () => {
    setTempYear(currentMonth.getFullYear());
    setTempMonth(currentMonth.getMonth() + 1);
    setShowDatePicker(true);
  };

  const handleConfirmDate = () => {
    setCurrentMonth(new Date(tempYear, tempMonth - 1, 1));
    setShowDatePicker(false);
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    const labels = {
      normal: "正常",
      late: "迟到",
      early: "早退",
      absent: "缺勤",
      overtime: "加班",
      completed: "完成",
    };
    return labels[status];
  };

  const stats = {
    totalDays: records.filter(
      (r) => r.status === "normal",
    ).length,
    needsFix: records.filter((r) => r.needsFix).length,
    lateDays: records.filter((r) => r.status === "late").length,
    absentDays: records.filter((r) => r.status === "absent").length,
  };

  const abnormalThisMonth = records.filter(
    (r) =>
      r.needsFix ||
      r.status === "late" ||
      r.status === "early" ||
      r.status === "absent",
  );

  const handleOpenSubmit = () => {
    if (alreadySubmitted) return;
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    await apiSubmitMonthAttendance(year, monthIndex0 + 1);
    setShowSubmitModal(false);
    await loadMonthData();
  };

  // 根据筛选状态过滤记录
  const displayRecords = filterAbnormal
    ? records.filter((r) => r.needsFix)
    : records;

  return (
    <div className="min-h-[calc(100dvh-5rem)] pb-6 pt-2 md:min-h-screen md:px-0 md:pb-10 md:pt-0">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        {/* 第一行：日期切换、导出与提交 */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-4">
          {/* 左侧：日期切换 */}
          <div className="relative flex items-center justify-center gap-1 sm:justify-start">
            <button
              onClick={handlePrevMonth}
              className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted md:size-9"
              type="button"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={handleOpenDatePicker}
              className="min-w-0 whitespace-nowrap rounded-lg px-3 py-2 text-base font-semibold transition-colors hover:bg-muted md:text-lg"
              type="button"
            >
              {currentMonth.getFullYear()}年
              {currentMonth.getMonth() + 1}月
            </button>
            <button
              onClick={handleNextMonth}
              className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted md:size-9"
              type="button"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* 日期选择器弹窗 */}
            <AnimatePresence>
              {showDatePicker && (
                <>
                  {/* 背景遮罩 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDatePicker(false)}
                  />

                  {/* 日期选择器 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="absolute top-12 left-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 min-w-[280px]"
                  >
                    <div className="p-4">
                      <h3 className="text-sm font-medium mb-4">
                        选择日期
                      </h3>

                      {/* 年份选择 */}
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">
                          年份
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setTempYear(tempYear - 1)
                            }
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex-1 text-center font-medium">
                            {tempYear}年
                          </div>
                          <button
                            onClick={() =>
                              setTempYear(tempYear + 1)
                            }
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 月份选择 */}
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">
                          月份
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                            12,
                          ].map((month) => (
                            <button
                              key={month}
                              onClick={() =>
                                setTempMonth(month)
                              }
                              className={`py-2 rounded-lg text-sm transition-colors ${
                                tempMonth === month
                                  ? "bg-[#3B82F6] text-white"
                                  : "bg-muted hover:bg-muted/70"
                              }`}
                            >
                              {month}月
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setShowDatePicker(false)
                          }
                          className="flex-1 py-2 px-4 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleConfirmDate}
                          className="flex-1 py-2 px-4 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
                        >
                          确定
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* 右侧：导出 + 提交 */}
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
            <div className="relative">
              <button
                onClick={() =>
                  setShowExportMenu(!showExportMenu)
                }
                className="flex min-h-11 items-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2.5 text-sm text-white transition-colors hover:bg-[#2563EB] md:min-h-0 md:py-2"
                type="button"
              >
                <Download className="size-4 shrink-0" />
                <span>导出</span>
              </button>

              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 z-10 min-w-[120px] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
                >
                  <button
                    onClick={handleExportExcel}
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <FileText className="size-4" />
                    Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <FileText className="size-4" />
                    PDF
                  </button>
                </motion.div>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenSubmit}
              disabled={alreadySubmitted}
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-[#3B82F6]/40 bg-background px-3 py-2.5 text-sm font-medium text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/10 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0 md:py-2"
            >
              <Send className="size-4 shrink-0" />
              <span>{alreadySubmitted ? "已提交" : "提交"}</span>
            </button>
          </div>
        </div>

        {/* 第二行：视图切换 */}
        <div className="mb-3 flex justify-center md:mb-4">
          <div className="flex w-full max-w-xs rounded-xl bg-muted p-1 md:max-w-none md:rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              type="button"
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors md:min-h-0 md:flex-none md:rounded-md md:px-4 ${
                viewMode === "list"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <List className="size-4 shrink-0" />
              <span>列表</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              type="button"
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors md:min-h-0 md:flex-none md:rounded-md md:px-4 ${
                viewMode === "calendar"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <CalendarIcon className="size-4 shrink-0" />
              <span>日历</span>
            </button>
          </div>
        </div>

        {lockedNoGrant && (
          <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200 md:text-sm">
            本月考勤已提交并锁定。在管理员通过消息通知为您开放修改权限前，无法编辑记录；请前往「我的 → 消息通知」查看并领取权限。
          </div>
        )}

        {alreadySubmitted && canEdit && (
          <div className="mb-3 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-xs text-green-800 dark:text-green-200 md:text-sm">
            您已获得本月考勤修改权限，可继续编辑记录；再次提交功能仍不可用（本月已提交）。
          </div>
        )}

        {/* 统计卡片 */}
        <div className="mb-3 grid grid-cols-2 gap-2 md:mb-4 md:gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-3 md:p-4"
          >
            <div className="mb-0.5 text-xl font-semibold md:mb-1 md:text-2xl">
              {stats.totalDays}
            </div>
            <div className="text-xs text-muted-foreground md:text-sm">
              出勤天数
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setFilterAbnormal(!filterAbnormal)}
            type="button"
            className={`rounded-xl border bg-card p-3 text-left transition-all md:p-4 ${
              filterAbnormal
                ? "scale-[1.02] border-orange-500 bg-orange-500/10 md:scale-105"
                : "border-border hover:border-orange-500/50 hover:bg-orange-500/5"
            }`}
          >
            <div
              className={`mb-0.5 text-xl font-semibold md:mb-1 md:text-2xl ${filterAbnormal ? "text-orange-600" : "text-orange-500"}`}
            >
              {stats.needsFix}
            </div>
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground md:text-sm">
              异常补录
              {filterAbnormal && (
                <span className="text-[10px] text-orange-500 md:text-xs">
                  (筛选中)
                </span>
              )}
            </div>
          </motion.button>
        </div>
      </div>

      {/* 视图内容 */}
      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CalendarView
              currentMonth={currentMonth}
              records={records}
              onDateClick={handleDateClick}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3 md:space-y-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card"
          >
            <div className="hidden grid-cols-[1fr_1.5fr_1fr] gap-4 bg-muted/50 px-4 py-3 text-sm text-muted-foreground md:grid">
              <div>日期</div>
              <div>状态</div>
              <div className="text-right">时间</div>
            </div>

            <AnimatePresence mode="wait">
              {displayRecords.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground md:rounded-none md:border-0 md:bg-transparent md:py-12"
                >
                  {filterAbnormal
                    ? "暂无异常记录"
                    : "本月暂无考勤记录"}
                </motion.div>
              ) : (
                <motion.div
                  key={filterAbnormal ? "filtered" : "all"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3 md:gap-0"
                >
                  {displayRecords.map((record, index) => (
                    <div
                      key={record.date}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:contents md:overflow-visible md:shadow-none"
                    >
                      <AttendanceRow
                        record={record}
                        index={index}
                        readOnly={!canEdit}
                        onUpdate={(updates) =>
                          updateRecord(record.date, updates)
                        }
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提示信息 */}
      {stats.needsFix > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3.5 md:rounded-xl md:p-4"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-orange-500" />
          <div>
            <div className="mb-1 text-sm font-medium text-orange-500 md:text-base">
              需要补录考勤
            </div>
            <div className="text-xs text-muted-foreground md:text-sm">
              您有 {stats.needsFix}{" "}
              条记录需补录，请在
              <span className="md:hidden">卡片</span>
              <span className="hidden md:inline">列表行</span>
              中点击时间或状态进行编辑
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showSubmitModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[85] bg-black/45"
              onClick={() => setShowSubmitModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed left-1/2 top-1/2 z-[90] max-h-[min(85vh,32rem)] w-[min(94vw,22rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-base font-semibold">确认提交本月考勤</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  提交后将锁定本月记录；仅当管理端在消息通知中发放修改权限后可再次编辑。
                </p>
              </div>
              <div className="max-h-[min(50vh,18rem)] overflow-y-auto px-4 py-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  本月异常考勤（共 {abnormalThisMonth.length} 条）
                </div>
                {abnormalThisMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">本月暂无异常记录。</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {abnormalThisMonth.map((r) => (
                      <li
                        key={r.date}
                        className="rounded-lg border border-border bg-muted/40 px-3 py-2"
                      >
                        <div className="font-medium">
                          {new Date(r.date).toLocaleDateString("zh-CN")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusLabel(r.status as AttendanceStatus)}
                          {r.needsFix ? " · 需补录" : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2 border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-medium transition-colors hover:bg-muted/80"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex-1 rounded-xl bg-[#3B82F6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                >
                  确认提交
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}