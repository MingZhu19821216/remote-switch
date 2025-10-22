(function () {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const randomBetween = (min, max, fractionDigits = 0) => {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(fractionDigits));
  };

  async function login({ username, password }) {
    await delay(360);
    const validUsers = [
      { username: "admin", password: "123456", displayName: "系统管理员" },
      { username: "operator", password: "operator123", displayName: "值班员" },
    ];

    const found = validUsers.find(
      (user) => user.username === username && user.password === password
    );

    if (!found) {
      const error = new Error("账号或密码错误");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    return {
      token: `mock-token-${Math.random().toString(36).slice(2)}`,
      user: {
        username: found.username,
        displayName: found.displayName,
        role: found.username === "admin" ? "管理员" : "操作员",
      },
    };
  }

  async function fetchDashboardData() {
    await delay(480);

    const now = new Date();
    const formatDate = (date) =>
      date.toISOString().split("T")[0];

    const dailyRange = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      return {
        date: formatDate(day),
        value: randomBetween(0.3, 1.2, 2),
      };
    });

    const realtimeSeries = Array.from({ length: 12 }).map((_, index) => ({
      label: `${8 + index}:00`,
      value: randomBetween(45, 98, 0),
    }));

    const weeklyStats = dailyRange.map((entry) => ({
      date: entry.date,
      duration: randomBetween(6, 15, 1),
      interrupts: randomBetween(0, 4, 0),
    }));

    const monthlyStats = Array.from({ length: 6 }).map((_, index) => ({
      month: `${now.getFullYear()}-${String(index + 1).padStart(2, "0")}`,
      value: randomBetween(80, 170, 1),
    }));

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return {
      updatedAt: now.toISOString(),
      stats: [
        { id: "daily", label: "日充电桩数(个)", value: 4, unit: "" },
        { id: "online", label: "实时在线数(个)", value: 4, unit: "" },
        { id: "inUse", label: "在充数量(个)", value: 2, unit: "" },
        { id: "fault", label: "故障桩数量(个)", value: 0, unit: "" },
        { id: "mileage", label: "累计里程(KM)", value: 220, unit: "" },
        { id: "todayPower", label: "实时充电能耗(KWH)", value: 5.13, unit: "" },
        { id: "monthPower", label: "当月累计能耗(KWH)", value: 5.13, unit: "" },
      ],
      alerts: [
        {
          id: "alert-1",
          title: "2#充电桩发生漏电报警，请立即派人处理",
          time: `${formatDate(now)} 13:11:13`,
        },
        {
          id: "alert-2",
          title: "3#充电桩电流异常，请检查线路安全",
          time: `${formatDate(now)} 11:40:17`,
        },
        {
          id: "alert-3",
          title: "5#充电桩通信中断，等待恢复",
          time: `${formatDate(now)} 09:25:18`,
        },
      ],
      usage: {
        today: randomBetween(68, 96, 0),
        week: randomBetween(70, 92, 0),
      },
      yesterday: {
        chargeCount: 126,
        trips: 0.7,
      },
      dailyRange,
      realtimeSeries,
      weeklyStats,
      monthlyStats,
      patrols: [
        { date: formatDate(yesterdayDate), count: 1, people: 1, org: "运营部" },
        { date: formatDate(twoDaysAgo), count: 1, people: 2, org: "检修组" },
        { date: "2021-06-04", count: 1, people: 3, org: "检修组" },
        { date: "2021-06-16", count: 1, people: 2, org: "第三方检测单位" },
      ],
    };
  }

  window.MockApi = {
    login,
    fetchDashboardData,
  };
})();
