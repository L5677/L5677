import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AttendanceRecord {
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  /** 扣除分钟数，导出 Excel 用 */
  deductMinutes?: number;
  /** 备注，导出 Excel 用 */
  attendanceNote?: string;
}

// 导出Excel
export const exportToExcel = (
  records: AttendanceRecord[],
  filename: string = "考勤记录"
) => {
  // 准备数据
  const data = records.map((r) => ({
    日期: new Date(r.date).toLocaleDateString("zh-CN"),
    星期: ["日", "一", "二", "三", "四", "五", "六"][new Date(r.date).getDay()],
    上班时间: r.checkInTime || "-",
    下班时间: r.checkOutTime || "-",
    状态: getStatusLabel(r.status),
    扣除分钟:
      typeof r.deductMinutes === "number" ? r.deductMinutes : "-",
    备注: (r.attendanceNote && String(r.attendanceNote).trim()) || "-",
  }));

  // 创建工作簿
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "考勤记录");

  // 设置列宽
  ws["!cols"] = [
    { wch: 15 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 28 },
  ];

  // 下载文件
  XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString("zh-CN")}.xlsx`);
};

// 导出PDF
export const exportToPDF = (
  records: AttendanceRecord[],
  userInfo: { name: string; id: string },
  month: string,
  filename: string = "考勤证明"
) => {
  const doc = new jsPDF();

  // 设置中文字体（使用内置字体的替代方案）
  doc.setFont("helvetica");

  // 标题
  doc.setFontSize(18);
  doc.text("Attendance Certificate", 105, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.text("考勤证明", 105, 30, { align: "center" });

  // 基本信息
  doc.setFontSize(12);
  doc.text(`Employee Name / 姓名: ${userInfo.name}`, 20, 45);
  doc.text(`Employee ID / 工号: ${userInfo.id}`, 20, 55);
  doc.text(`Month / 月份: ${month}`, 20, 65);

  // 统计信息
  const totalDays = records.filter((r) => r.status === "normal" || r.status === "completed").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const absentDays = records.filter((r) => r.status === "absent").length;

  doc.text(`Total Attendance / 出勤天数: ${totalDays}`, 20, 80);
  doc.text(`Late Days / 迟到次数: ${lateDays}`, 20, 90);
  doc.text(`Absent Days / 缺勤天数: ${absentDays}`, 20, 100);

  // 表格数据
  const tableData = records.map((r) => [
    new Date(r.date).toLocaleDateString("zh-CN"),
    r.checkInTime || "-",
    r.checkOutTime || "-",
    getStatusLabel(r.status),
    typeof r.deductMinutes === "number" ? String(r.deductMinutes) : "-",
    (r.attendanceNote && String(r.attendanceNote).trim()) || "-",
  ]);

  autoTable(doc, {
    head: [
      [
        "Date",
        "In",
        "Out",
        "Status",
        "Deduct(min)",
        "Note",
      ],
    ],
    body: tableData,
    startY: 115,
    styles: {
      font: "helvetica",
      fontSize: 10,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // 页脚
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Generated on ${new Date().toLocaleDateString("zh-CN")}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // 下载文件
  doc.save(`${filename}_${month}.pdf`);
};

// 导出自定义日期范围
export const exportCustomRange = (
  startDate: Date,
  endDate: Date,
  format: "excel" | "pdf",
  userInfo?: { name: string; id: string }
) => {
  const records: AttendanceRecord[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      const dateString = current.toDateString();
      const saved = localStorage.getItem(`clock-${dateString}`);

      if (saved) {
        const data = JSON.parse(saved);
        records.push({
          date: dateString,
          status: data.status,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          deductMinutes:
            typeof data.deductMinutes === "number"
              ? data.deductMinutes
              : undefined,
          attendanceNote: data.attendanceNote,
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const filename = `考勤记录_${startDate.toLocaleDateString("zh-CN")}_至_${endDate.toLocaleDateString("zh-CN")}`;

  if (format === "excel") {
    exportToExcel(records, filename);
  } else if (format === "pdf" && userInfo) {
    const monthStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
    exportToPDF(records, userInfo, monthStr, filename);
  }
};

const getStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    normal: "正常",
    late: "迟到",
    early: "早退",
    absent: "缺勤",
    overtime: "加班",
    completed: "正常",
    checkedIn: "待下班",
  };
  return labels[status] || status;
};
