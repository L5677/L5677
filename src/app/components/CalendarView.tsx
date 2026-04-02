import { motion } from "motion/react";

interface AttendanceRecord {
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  needsFix?: boolean;
}

interface CalendarViewProps {
  currentMonth: Date;
  records: AttendanceRecord[];
  onDateClick: (date: string) => void;
}

export function CalendarView({ currentMonth, records, onDateClick }: CalendarViewProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 获取日历开始日期（可能是上个月的日期）
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // 调整到周日
  
  // 生成6周的日历（42天）
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }
  
  // 获取指定日期的考勤记录
  const getRecordForDate = (date: Date): AttendanceRecord | null => {
    // 后端/列表页使用 ISO 日期：YYYY-MM-DD
    const dateString = date.toISOString().slice(0, 10);
    return records.find((r) => r.date === dateString) || null;
  };
  
  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      normal: "bg-green-500",
      completed: "bg-green-500",
      late: "bg-orange-500",
      early: "bg-yellow-500",
      absent: "bg-red-500",
      overtime: "bg-[#3B82F6]",
      checkedIn: "bg-blue-500",
    };
    return colors[status] || "bg-gray-400";
  };
  
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const todayIso = new Date().toISOString().slice(0, 10);
  
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2 p-3 bg-muted/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-2 p-3">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toISOString().slice(0, 10) === todayIso;
          const record = getRecordForDate(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const dateString = date.toISOString().slice(0, 10);
          
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => isCurrentMonth && onDateClick(dateString)}
              disabled={!isCurrentMonth}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                relative transition-all
                ${isCurrentMonth ? "hover:bg-muted" : "opacity-30"}
                ${isToday ? "ring-2 ring-[#3B82F6]" : ""}
                ${!isCurrentMonth || isWeekend ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* 日期 */}
              <div className={`text-sm ${isToday ? "text-[#3B82F6] font-bold" : ""}`}>
                {date.getDate()}
              </div>
              
              {/* 状态指示器 */}
              {record && (
                <div className="flex items-center gap-0.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(record.status)}`} />
                  {record.needsFix && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>
              )}
              
              {/* 未打卡标记 */}
              {isCurrentMonth && !isWeekend && date < new Date() && !record && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* 图例 */}
      <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">正常</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">迟到</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">缺勤</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span className="text-muted-foreground">加班</span>
        </div>
      </div>
    </div>
  );
}
