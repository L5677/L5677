// 演示数据初始化脚本
// 在浏览器控制台运行此脚本，快速生成演示数据

export function initDemoData() {
  console.log("🎬 开始初始化演示数据...");

  // 1. 清除旧数据
  localStorage.clear();
  console.log("✅ 已清除旧数据");

  // 2. 设置用户信息
  const demoUser = {
    name: "王小明",
    id: "EMP001",
    department: "技术部",
    position: "前端工程师"
  };
  localStorage.setItem("currentUser", JSON.stringify(demoUser));
  localStorage.setItem("isLoggedIn", "true");
  console.log("✅ 用户信息已设置:", demoUser);

  // 3. 生成最近3个月的考勤数据（更多数据用于演示）
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let totalRecordCount = 0;
  
  // 生成最近3个月的数据
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    // 确定要生成数据的最后一天
    let lastDay = daysInMonth;
    if (monthOffset === 0) {
      // 当前月只生成到今天
      lastDay = today.getDate();
    }

    let monthRecordCount = 0;
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(targetYear, targetMonth, day);
      const dateString = date.toDateString();
      
      // 跳过周末
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // 生成不同类型的考勤记录
      let record;
      const random = Math.random();
      
      if (random < 0.65) {
        // 65% 正常打卡
        record = {
          status: "normal",  // 改为 "normal"
          checkInTime: `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          checkOutTime: `1${7 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          date: dateString,
          type: "normal"
        };
      } else if (random < 0.80) {
        // 15% 迟到
        record = {
          status: "late",
          checkInTime: `0${9 + Math.floor(Math.random() * 2)}:${String(10 + Math.floor(Math.random() * 50)).padStart(2, "0")}`,
          checkOutTime: `1${7 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          date: dateString,
          type: "late"
        };
      } else if (random < 0.92) {
        // 12% 只有上班打卡（需要补录）
        record = {
          status: "normal",  // 改为 "normal"，即使未完成也保持原状态
          checkInTime: `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          checkOutTime: "",
          date: dateString,
          type: "incomplete"
        };
      } else {
        // 8% 缺勤
        record = {
          status: "absent",
          checkInTime: "",
          checkOutTime: "",
          date: dateString,
          type: "absent"
        };
      }

      localStorage.setItem(`clock-${dateString}`, JSON.stringify(record));
      monthRecordCount++;
      totalRecordCount++;
    }
    
    console.log(`✅ ${targetYear}年${targetMonth + 1}月: 已生成 ${monthRecordCount} 条记录`);
  }
  
  console.log(`✅ 总计生成 ${totalRecordCount} 条考勤记录（最近3个月）`);

  // 4. 生成通知消息
  const notifications = [
    {
      id: "1",
      type: "warning",
      date: new Date(currentYear, currentMonth, today.getDate() - 2).toISOString(),
      message: `${currentMonth + 1}月${today.getDate() - 2}日下午未打下班卡，请补录考勤`,
      isRead: false,
      requiresFix: true,
    },
    {
      id: "2",
      type: "info",
      date: new Date(currentYear, currentMonth, today.getDate() - 5).toISOString(),
      message: "系统将于本周五进行维护升级",
      isRead: false,
      requiresFix: false,
    },
    {
      id: "3",
      type: "info",
      date: new Date(currentYear, currentMonth, today.getDate() - 10).toISOString(),
      message: `您的${currentMonth}月考勤已审核通过`,
      isRead: true,
      requiresFix: false,
    },
  ];
  localStorage.setItem("notifications", JSON.stringify(notifications));
  console.log(`✅ 已生成 ${notifications.length} 条通知消息`);

  // 5. 设置工作时间配置
  const workSchedule = {
    checkInTime: "09:00",
    checkOutTime: "18:00",
    flexMinutes: 15,
    checkInStartTime: "07:00",
    checkInEndTime: "10:00",
    checkOutStartTime: "17:00",
    checkOutEndTime: "22:00",
    reminderEnabled: true,
    reminderMinutes: 10,
  };
  localStorage.setItem("workSchedule", JSON.stringify(workSchedule));
  console.log("✅ 工作时间配置已设置:", workSchedule);

  // 6. 生成连续打卡天数
  const consecutiveDays = Math.floor(Math.random() * 20) + 10;
  localStorage.setItem("consecutiveDays", String(consecutiveDays));
  console.log(`✅ 连续打卡天数: ${consecutiveDays} 天`);

  console.log("\n🎉 演示数据初始化完成！");
  console.log("📱 请刷新页面查看效果");
  console.log("\n💡 演示账号:");
  console.log("   用户名: admin");
  console.log("   密码: admin123");
}

// 清除演示数据
export function clearDemoData() {
  localStorage.clear();
  console.log("🗑️ 演示数据已清除");
  console.log("📱 请刷新页面");
}

// 生成指定月份的考勤数据
export function generateMonthData(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let recordCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateString = date.toDateString();
    
    // 跳过周末和未来日期
    if (date.getDay() === 0 || date.getDay() === 6 || date > new Date()) continue;

    const random = Math.random();
    let record;
    
    if (random < 0.75) {
      record = {
        status: "completed",
        checkInTime: `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        checkOutTime: `1${7 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        date: dateString,
        type: "normal"
      };
    } else {
      record = {
        status: "late",
        checkInTime: `0${9 + Math.floor(Math.random() * 2)}:${String(10 + Math.floor(Math.random() * 50)).padStart(2, "0")}`,
        checkOutTime: `1${7 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        date: dateString,
        type: "late"
      };
    }

    localStorage.setItem(`clock-${dateString}`, JSON.stringify(record));
    recordCount++;
  }

  console.log(`✅ 已生成 ${year}年${month}月 ${recordCount} 条考勤记录`);
}

// 生成最近N个月的完整数据（用于演示更多历史记录）
export function generateRecentMonthsData(monthsCount: number = 6) {
  console.log(`🎬 开始生成最近 ${monthsCount} 个月的考勤数据...`);
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let totalRecordCount = 0;
  
  for (let monthOffset = monthsCount - 1; monthOffset >= 0; monthOffset--) {
    const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    // 确定要生成数据的最后一天
    let lastDay = daysInMonth;
    if (monthOffset === 0) {
      // 当前月只生成到今天
      lastDay = today.getDate();
    }

    let monthRecordCount = 0;
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(targetYear, targetMonth, day);
      const dateString = date.toDateString();
      
      // 跳过周末
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const random = Math.random();
      let record;
      
      if (random < 0.68) {
        // 68% 正常打卡
        record = {
          status: "completed",
          checkInTime: `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          checkOutTime: `1${7 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          date: dateString,
          type: "normal"
        };
      } else if (random < 0.83) {
        // 15% 迟到
        record = {
          status: "late",
          checkInTime: `0${9 + Math.floor(Math.random() * 2)}:${String(10 + Math.floor(Math.random() * 50)).padStart(2, "0")}`,
          checkOutTime: `1${7 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          date: dateString,
          type: "late"
        };
      } else if (random < 0.94) {
        // 11% 只有上班打卡（需要补录）
        record = {
          status: "incomplete",
          checkInTime: `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
          checkOutTime: "",
          date: dateString,
          type: "incomplete"
        };
      } else {
        // 6% 缺勤
        record = {
          status: "absent",
          checkInTime: "",
          checkOutTime: "",
          date: dateString,
          type: "absent"
        };
      }

      localStorage.setItem(`clock-${dateString}`, JSON.stringify(record));
      monthRecordCount++;
      totalRecordCount++;
    }
    
    console.log(`✅ ${targetYear}年${targetMonth + 1}月: 已生成 ${monthRecordCount} 条记录`);
  }
  
  console.log(`\n🎉 总计生成 ${totalRecordCount} 条考勤记录（最近${monthsCount}个月）`);
  console.log("📱 请刷新页面或切换月份查看数据");
  
  return totalRecordCount;
}

// 在浏览器控制台中使用方法：
// 1. 初始化演示数据: initDemoData()
// 2. 清除数据: clearDemoData()
// 3. 生成指定月份数据: generateMonthData(2024, 3)

// 自动执行（可选）
if (typeof window !== "undefined") {
  (window as any).demoTools = {
    initDemoData,
    clearDemoData,
    generateMonthData,
    generateRecentMonthsData,
  };
  console.log("🛠️ 演示工具已加载！");
  console.log("📝 在控制台输入以下命:");
  console.log("   demoTools.initDemoData() - 初始化演示数据");
  console.log("   demoTools.clearDemoData() - 清除所有数据");
  console.log("   demoTools.generateMonthData(2024, 3) - 生成指定月份数据");
  console.log("   demoTools.generateRecentMonthsData(6) - 生成最近6个月数据");
}